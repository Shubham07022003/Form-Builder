const Airtable = require('airtable');

/**
 * Get Airtable base instance
 */
function getAirtableBase(accessToken, baseId) {
  Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: accessToken
  });
  return new Airtable().base(baseId);
}

/**
 * Fetch all bases for a user
 */
async function fetchBases(accessToken) {
  try {
    const response = await fetch('https://api.airtable.com/v0/meta/bases', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.bases || [];
  } catch (error) {
    console.error('Error fetching bases:', error);
    throw error;
  }
}

/**
 * Fetch tables for a base
 */
async function fetchTables(accessToken, baseId) {
  try {
    const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tables || [];
  } catch (error) {
    console.error('Error fetching tables:', error);
    throw error;
  }
}

/**
 * Fetch fields for a table
 */
async function fetchFields(accessToken, baseId, tableId) {
  try {
    console.log(`Fetching fields for base: ${baseId}, table: ${tableId}`);
    
    // Try the meta API first
    let response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables/${tableId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.log(`Meta API failed (${response.status}), trying direct table access...`);
      
      // Fallback: Try to get a few records to infer the schema
      response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}?maxRecords=1`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error(`Both APIs failed. Last response: ${response.status} ${response.statusText}`);
        throw new Error(`Airtable API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.records && data.records.length > 0) {
        const fields = Object.keys(data.records[0].fields).map(fieldName => ({
          id: fieldName,
          name: fieldName,
          type: 'singleLineText', // Default type
          options: []
        }));
        console.log(`Successfully inferred ${fields.length} fields from record data`);
        return fields;
      }
      
      return [];
    }

    const data = await response.json();
    console.log(`Successfully fetched ${data.fields?.length || 0} fields from meta API`);
    return data.fields || [];
  } catch (error) {
    console.error('Error fetching fields:', error);
    throw error;
  }
}

/**
 * Map Airtable field type to our supported types
 */
function mapFieldType(airtableType) {
  const typeMap = {
    'singleLineText': 'shortText',
    'multilineText': 'longText',
    'singleSelect': 'singleSelect',
    'multipleSelects': 'multiSelect',
    'multipleAttachments': 'attachment'
  };

  return typeMap[airtableType] || null;
}

/**
 * Get options for select fields
 */
function getFieldOptions(field) {
  if (field.options && field.options.choices) {
    return field.options.choices.map(choice => choice.name || choice);
  }
  return [];
}

/**
 * Create a record in Airtable
 */
async function createRecord(accessToken, baseId, tableId, fields) {
  try {
    const base = getAirtableBase(accessToken, baseId);
    const records = await base(tableId).create([{ fields }]);
    return records[0];
  } catch (error) {
    console.error('Error creating Airtable record:', error);
    throw error;
  }
}

/**
 * Update a record in Airtable
 */
async function updateRecord(accessToken, baseId, tableId, recordId, fields) {
  try {
    const base = getAirtableBase(accessToken, baseId);
    const record = await base(tableId).update(recordId, fields);
    return record;
  } catch (error) {
    console.error('Error updating Airtable record:', error);
    throw error;
  }
}

module.exports = {
  getAirtableBase,
  fetchBases,
  fetchTables,
  fetchFields,
  mapFieldType,
  getFieldOptions,
  createRecord,
  updateRecord
};

