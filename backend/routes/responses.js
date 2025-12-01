const express = require('express');
const { authenticate } = require('../middleware/auth');
const Form = require('../models/Form');
const Response = require('../models/Response');
const User = require('../models/User');
const { createRecord } = require('../utils/airtableClient');
const { shouldShowQuestion } = require('../utils/conditionalLogic');

const router = express.Router();

/**
 * Submit a form response (public - no auth required)
 */
router.post('/forms/:formId/submit', async (req, res) => {
  try {
    const { formId } = req.params;
    const { answers } = req.body;

    // Fetch form and populate owner to get access token
    const form = await Form.findById(formId).populate('owner');
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Get form owner's access token
    const owner = await User.findById(form.owner);
    if (!owner || !owner.accessToken) {
      return res.status(500).json({ error: 'Form owner authentication not available' });
    }

    // Validate answers against form definition
    const validationErrors = [];

    for (const question of form.questions) {
      const answer = answers[question.questionKey];

      // Check required fields
      if (question.required && (answer === undefined || answer === null || answer === '')) {
        validationErrors.push(`${question.label} is required`);
        continue;
      }

      // Skip validation if answer is empty and field is not required
      if (answer === undefined || answer === null || answer === '') {
        continue;
      }

      // Validate based on type
      switch (question.type) {
        case 'singleSelect':
          if (!question.options.includes(answer)) {
            validationErrors.push(`${question.label}: Invalid selection`);
          }
          break;

        case 'multiSelect':
          if (!Array.isArray(answer)) {
            validationErrors.push(`${question.label}: Must be an array`);
          } else {
            const invalidOptions = answer.filter(opt => !question.options.includes(opt));
            if (invalidOptions.length > 0) {
              validationErrors.push(`${question.label}: Invalid selections: ${invalidOptions.join(', ')}`);
            }
          }
          break;

        case 'attachment':
          if (!Array.isArray(answer)) {
            validationErrors.push(`${question.label}: Must be an array of attachments`);
          }
          break;

        case 'shortText':
        case 'longText':
          if (typeof answer !== 'string') {
            validationErrors.push(`${question.label}: Must be a string`);
          }
          break;
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Prepare fields for Airtable
    const airtableFields = {};
    for (const question of form.questions) {
      const answer = answers[question.questionKey];
      if (answer !== undefined && answer !== null && answer !== '') {
        // Map answer to Airtable field format
        if (question.type === 'multiSelect') {
          airtableFields[question.airtableFieldId] = answer;
        } else if (question.type === 'singleSelect') {
          airtableFields[question.airtableFieldId] = answer;
        } else if (question.type === 'attachment') {
          // Airtable expects array of objects with url property
          airtableFields[question.airtableFieldId] = answer.map(att => ({
            url: att.url || att
          }));
        } else {
          airtableFields[question.airtableFieldId] = answer;
        }
      }
    }

    // Create record in Airtable using form owner's access token
    let airtableRecord;
    try {
      airtableRecord = await createRecord(
        owner.accessToken,
        form.airtableBaseId,
        form.airtableTableId,
        airtableFields
      );
    } catch (airtableError) {
      console.error('Airtable create error:', airtableError);
      return res.status(500).json({ error: 'Failed to save to Airtable', details: airtableError.message });
    }

    // Save response to database
    const response = await Response.create({
      formId: form._id,
      airtableRecordId: airtableRecord.id,
      answers
    });

    res.status(201).json({
      message: 'Response submitted successfully',
      responseId: response._id,
      airtableRecordId: airtableRecord.id
    });
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ error: 'Failed to submit response' });
  }
});

// Routes that require authentication
router.use(authenticate);

/**
 * Get all responses for a form
 */
router.get('/forms/:formId/responses', async (req, res) => {
  try {
    const { formId } = req.params;

    // Verify form exists and user owns it
    const form = await Form.findOne({ _id: formId, owner: req.user._id });
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Fetch responses from database
    const responses = await Response.find({ formId })
      .sort({ createdAt: -1 })
      .select('_id airtableRecordId answers createdAt updatedAt deletedInAirtable');

    // Format responses for display
    const formattedResponses = responses.map(response => {
      // Create a compact preview of answers
      const answerPreview = {};
      for (const question of form.questions) {
        const answer = response.answers[question.questionKey];
        if (answer !== undefined && answer !== null) {
          if (Array.isArray(answer)) {
            answerPreview[question.label] = answer.length > 0 ? `${answer.length} items` : 'Empty';
          } else {
            const str = String(answer);
            answerPreview[question.label] = str.length > 50 ? str.substring(0, 50) + '...' : str;
          }
        }
      }

      return {
        id: response._id,
        airtableRecordId: response.airtableRecordId,
        answers: answerPreview,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        status: response.deletedInAirtable ? 'deleted' : 'active'
      };
    });

    res.json(formattedResponses);
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

/**
 * Get a single response by ID
 */
router.get('/responses/:responseId', async (req, res) => {
  try {
    const { responseId } = req.params;
    const response = await Response.findById(responseId);

    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }

    // Verify user owns the form
    const form = await Form.findOne({ _id: response.formId, owner: req.user._id });
    if (!form) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(response);
  } catch (error) {
    console.error('Error fetching response:', error);
    res.status(500).json({ error: 'Failed to fetch response' });
  }
});

module.exports = router;

