const express = require('express');
const Response = require('../models/Response');
const { updateRecord } = require('../utils/airtableClient');

const router = express.Router();

/**
 * Airtable webhook handler
 * This endpoint receives webhook events from Airtable when records change
 */
router.post('/airtable', async (req, res) => {
  try {
    const { event, base, table, record } = req.body;

    // Verify webhook signature if configured (recommended for production)
    // For now, we'll process all webhooks

    if (!event || !base || !table || !record) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    // Find response by Airtable record ID
    const response = await Response.findOne({ airtableRecordId: record.id });

    if (!response) {
      // Record doesn't exist in our DB, might be from another form
      console.log(`Webhook received for unknown record: ${record.id}`);
      return res.status(200).json({ message: 'Record not found in database' });
    }

    switch (event) {
      case 'record.updated':
        // Update the response in our database
        // Note: We don't update the answers field directly from Airtable
        // as it might have different structure. Instead, we just mark it as synced.
        response.updatedAt = new Date();
        response.deletedInAirtable = false;
        await response.save();
        break;

      case 'record.deleted':
        // Mark as deleted, don't hard delete
        response.deletedInAirtable = true;
        await response.save();
        break;

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

/**
 * Webhook verification endpoint (for Airtable webhook setup)
 */
router.get('/airtable', (req, res) => {
  // Airtable may send a GET request to verify the webhook endpoint
  res.status(200).json({ status: 'ok' });
});

module.exports = router;

