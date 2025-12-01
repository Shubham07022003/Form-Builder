const express = require('express');
const { authenticate } = require('../middleware/auth');
const Form = require('../models/Form');
const { fetchBases, fetchTables, fetchFields, mapFieldType, getFieldOptions } = require('../utils/airtableClient');

const router = express.Router();

// All other routes require authentication
router.use(authenticate);

// Get all bases for the authenticated user
router.get('/bases', async (req, res) => {
  try {
    console.log('Fetching bases for user:', req.user.airtableUserId);
    console.log('Access token exists:', !!req.user.accessToken);
    console.log('Token expires at:', req.user.tokenExpiresAt);
    
    // Check if token is expired
    if (req.user.tokenExpiresAt && new Date() > req.user.tokenExpiresAt) {
      console.log('Access token expired');
      return res.status(401).json({ error: 'Access token expired. Please log in again.' });
    }
    
    const bases = await fetchBases(req.user.accessToken);
    console.log('Successfully fetched bases:', bases.length);
    res.json(bases);
  } catch (error) {
    console.error('Error fetching bases:', error);
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return res.status(401).json({ error: 'Invalid or expired access token. Please log in again.' });
    }
    res.status(500).json({ error: 'Failed to fetch bases: ' + error.message });
  }
});

// Public route: Get single form (for viewing/filling) - must be after specific routes
router.get('/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    // Skip if this is a special route
    if (formId === 'bases') {
      return res.status(404).json({ error: 'Not found' });
    }
    const form = await Form.findById(formId);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json(form);
  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({ error: 'Failed to fetch form' });
  }
});


/**
 * Get tables for a base
 */
router.get('/bases/:baseId/tables', async (req, res) => {
  try {
    const { baseId } = req.params;
    console.log('Fetching tables for base:', baseId);
    
    // Check if token is expired
    if (req.user.tokenExpiresAt && new Date() > req.user.tokenExpiresAt) {
      return res.status(401).json({ error: 'Access token expired. Please log in again.' });
    }
    
    const tables = await fetchTables(req.user.accessToken, baseId);
    console.log('Successfully fetched tables:', tables.length);
    res.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return res.status(401).json({ error: 'Invalid or expired access token. Please log in again.' });
    }
    res.status(500).json({ error: 'Failed to fetch tables: ' + error.message });
  }
});

/**
 * Get fields for a table
 */
router.get('/bases/:baseId/tables/:tableId/fields', async (req, res) => {
  try {
    const { baseId, tableId } = req.params;
    const fields = await fetchFields(req.user.accessToken, baseId, tableId);

    // Filter and map to supported field types
    const supportedFields = fields
      .map(field => {
        const mappedType = mapFieldType(field.type);
        if (!mappedType) {
          return null; // Skip unsupported types
        }

        return {
          id: field.id,
          name: field.name,
          type: mappedType,
          options: getFieldOptions(field)
        };
      })
      .filter(field => field !== null);

    res.json(supportedFields);
  } catch (error) {
    console.error('Error fetching fields:', error);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
});

/**
 * Get all forms for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const forms = await Form.find({ owner: req.user._id })
      .select('title airtableBaseId airtableTableId createdAt updatedAt')
      .sort({ createdAt: -1 });
    res.json(forms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
});

/**
 * Create a new form
 */
router.post('/', async (req, res) => {
  try {
    const { title, airtableBaseId, airtableTableId, questions } = req.body;

    // Validate required fields
    if (!airtableBaseId || !airtableTableId || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate each question
    for (const question of questions) {
      if (!question.questionKey || !question.airtableFieldId || !question.label || !question.type) {
        return res.status(400).json({ error: 'Invalid question structure' });
      }

      // Validate type
      const validTypes = ['shortText', 'longText', 'singleSelect', 'multiSelect', 'attachment'];
      if (!validTypes.includes(question.type)) {
        return res.status(400).json({ error: `Invalid question type: ${question.type}` });
      }
    }

    const form = await Form.create({
      owner: req.user._id,
      title: title || 'Untitled Form',
      airtableBaseId,
      airtableTableId,
      questions
    });

    res.status(201).json(form);
  } catch (error) {
    console.error('Error creating form:', error);
    res.status(500).json({ error: 'Failed to create form' });
  }
});

/**
 * Update a form
 */
router.put('/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    const { title, questions } = req.body;

    const form = await Form.findOne({ _id: formId, owner: req.user._id });
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    if (title) form.title = title;
    if (questions) form.questions = questions;

    await form.save();
    res.json(form);
  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({ error: 'Failed to update form' });
  }
});

/**
 * Delete a form
 */
router.delete('/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    const form = await Form.findOneAndDelete({ _id: formId, owner: req.user._id });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ error: 'Failed to delete form' });
  }
});

module.exports = router;
