const express = require('express');
const Response = require('../models/Response');
const { updateRecord } = require('../utils/airtableClient');

const router = express.Router();


router.post('/airtable', async (req, res) => {
  try {
    const { event, base, table, record } = req.body;

 

    if (!event || !base || !table || !record) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    const response = await Response.findOne({ airtableRecordId: record.id });

    if (!response) {
      console.log(`Webhook received for unknown record: ${record.id}`);
      return res.status(200).json({ message: 'Record not found in database' });
    }

    switch (event) {
      case 'record.updated':
       // as it might have different structure. Instead, we just mark it as synced.
        response.updatedAt = new Date();
        response.deletedInAirtable = false;
        await response.save();
        break;

      case 'record.deleted':
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


router.get('/airtable', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = router;

