import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function FormBuilder({ user }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [bases, setBases] = useState([]);
  const [tables, setTables] = useState([]);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    airtableBaseId: '',
    airtableTableId: '',
    questions: []
  });

  const [showNewFieldForm, setShowNewFieldForm] = useState(false);
  const [newField, setNewField] = useState({
    name: '',
    type: 'shortText',
    required: false
  });

  useEffect(() => {
    fetchBases();
  }, []);

  const fetchBases = async () => {
    try {
      const response = await axios.get('/api/forms/bases');
      setBases(response.data);
    } catch (error) {
      console.error('Error fetching bases:', error);
      alert('Failed to fetch Airtable bases');
    }
  };

  const fetchTables = async (baseId) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/forms/bases/${baseId}/tables`);
      setTables(response.data);
      setStep(2);
    } catch (error) {
      console.error('Error fetching tables:', error);
      alert('Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  };

  const fetchFields = async (tableId) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/forms/bases/${formData.airtableBaseId}/tables/${tableId}/fields`);
      setFields(response.data);
      setStep(3);
    } catch (error) {
      console.error('Error fetching fields:', error);
      alert('Failed to fetch fields');
    } finally {
      setLoading(false);
    }
  };

  const handleBaseSelect = (baseId) => {
    setFormData({ ...formData, airtableBaseId: baseId });
    fetchTables(baseId);
  };

  const handleTableSelect = (tableId) => {
    setFormData({ ...formData, airtableTableId: tableId });
    fetchFields(tableId);
  };

  const toggleField = (field) => {
    const existingIndex = formData.questions.findIndex(q => q.airtableFieldId === field.id);
    
    if (existingIndex >= 0) {
      // Remove field
      const newQuestions = formData.questions.filter((_, i) => i !== existingIndex);
      setFormData({ ...formData, questions: newQuestions });
    } else {
      // Add field
      const questionKey = field.name.toLowerCase().replace(/\s+/g, '_');
      const newQuestion = {
        questionKey,
        airtableFieldId: field.id,
        label: field.name,
        type: field.type,
        required: false,
        options: field.options || [],
        conditionalRules: null
      };
      setFormData({ ...formData, questions: [...formData.questions, newQuestion] });
    }
  };

  const addNewField = () => {
    if (!newField.name.trim()) {
      alert('Please enter a field name');
      return;
    }

    const questionKey = newField.name.toLowerCase().replace(/\s+/g, '_');
    const customFieldId = `custom_${Date.now()}`;
    const newQuestion = {
      questionKey,
      airtableFieldId: customFieldId,
      label: newField.name,
      type: newField.type,
      required: newField.required,
      options: newField.type === 'singleSelect' || newField.type === 'multiSelect' ? [] : null,
      conditionalRules: null,
      isCustomField: true
    };

    setFormData({ ...formData, questions: [...formData.questions, newQuestion] });
    setNewField({ name: '', type: 'shortText', required: false });
    setShowNewFieldForm(false);
  };

  const updateQuestion = (index, updates) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setFormData({ ...formData, questions: newQuestions });
  };

  const addCondition = (questionIndex) => {
    const question = formData.questions[questionIndex];
    const existingRules = question.conditionalRules || { logic: 'AND', conditions: [] };
    
    const newCondition = {
      questionKey: formData.questions[0]?.questionKey || '',
      operator: 'equals',
      value: ''
    };

    existingRules.conditions.push(newCondition);
    updateQuestion(questionIndex, { conditionalRules: existingRules });
  };

  const updateCondition = (questionIndex, conditionIndex, updates) => {
    const question = formData.questions[questionIndex];
    const rules = { ...question.conditionalRules };
    rules.conditions[conditionIndex] = { ...rules.conditions[conditionIndex], ...updates };
    updateQuestion(questionIndex, { conditionalRules: rules });
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a form title');
      return;
    }

    if (formData.questions.length === 0) {
      alert('Please select at least one field');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/forms', formData);
      navigate(`/forms/${response.data._id}`);
    } catch (error) {
      console.error('Error creating form:', error);
      alert('Failed to create form: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '20px' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </div>

      <div className="card">
        <h1>Create New Form</h1>

        {step === 1 && (
          <div>
            <div className="form-group">
              <label>Form Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter form title"
              />
            </div>
            <div className="form-group">
              <label>Select Airtable Base</label>
              {bases.length === 0 ? (
                <p>Loading bases...</p>
              ) : (
                <select onChange={(e) => handleBaseSelect(e.target.value)}>
                  <option value="">Select a base...</option>
                  {bases.map(base => (
                    <option key={base.id} value={base.id}>{base.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <button className="btn btn-secondary" onClick={() => setStep(1)} style={{ marginBottom: '20px' }}>
              ← Back
            </button>
            <div className="form-group">
              <label>Select Table</label>
              {loading ? (
                <p>Loading tables...</p>
              ) : (
                <select onChange={(e) => handleTableSelect(e.target.value)}>
                  <option value="">Select a table...</option>
                  {tables.map(table => (
                    <option key={table.id} value={table.id}>{table.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <button className="btn btn-secondary" onClick={() => setStep(2)} style={{ marginBottom: '20px' }}>
              ← Back
            </button>
            <h2>Select Fields</h2>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Select the fields you want to include in your form
            </p>

            {fields.map(field => {
              const isSelected = formData.questions.some(q => q.airtableFieldId === field.id);
              return (
                <div key={field.id} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleField(field)}
                      style={{ marginRight: '10px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <strong>{field.name}</strong> ({field.type})
                    </div>
                  </label>
                </div>
              );
            })}

            
            {formData.questions.length > 0 && (
              <div style={{ marginTop: '30px' }}>
                <h2>Configure Questions</h2>
                {formData.questions.map((question, qIndex) => (
                  <div key={qIndex} className="card" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h4 style={{ margin: 0 }}>
                        {question.label}
                        {question.isCustomField && <span style={{ color: '#007bff', marginLeft: '5px', fontSize: '12px' }}>(Custom)</span>}
                      </h4>
                      <button
                        className="btn btn-danger"
                        onClick={() => {
                          const newQuestions = formData.questions.filter((_, i) => i !== qIndex);
                          setFormData({ ...formData, questions: newQuestions });
                        }}
                        style={{ fontSize: '12px', padding: '5px 10px' }}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="form-group">
                      <label>Question Label</label>
                      <input
                        type="text"
                        value={question.label}
                        onChange={(e) => updateQuestion(qIndex, { label: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(e) => updateQuestion(qIndex, { required: e.target.checked })}
                          style={{ marginRight: '5px' }}
                        />
                        Required
                      </label>
                    </div>

                    <div style={{ marginTop: '15px' }}>
                      <h3>Conditional Logic (Optional)</h3>
                      {question.conditionalRules && question.conditionalRules.conditions.length > 0 ? (
                        <div>
                          <div className="form-group">
                            <label>Logic Operator</label>
                            <select
                              value={question.conditionalRules.logic}
                              onChange={(e) => {
                                const rules = { ...question.conditionalRules, logic: e.target.value };
                                updateQuestion(qIndex, { conditionalRules: rules });
                              }}
                            >
                              <option value="AND">AND (all conditions must be true)</option>
                              <option value="OR">OR (any condition can be true)</option>
                            </select>
                          </div>
                          {question.conditionalRules.conditions.map((condition, cIndex) => (
                            <div key={cIndex} style={{ padding: '10px', background: '#f9f9f9', marginBottom: '10px', borderRadius: '4px' }}>
                              <div className="form-group">
                                <label>Show if</label>
                                <select
                                  value={condition.questionKey}
                                  onChange={(e) => updateCondition(qIndex, cIndex, { questionKey: e.target.value })}
                                >
                                  <option value="">Select question...</option>
                                  {formData.questions
                                    .filter((q, idx) => idx !== qIndex)
                                    .map((q, idx) => (
                                      <option key={idx} value={q.questionKey}>{q.label}</option>
                                    ))}
                                </select>
                              </div>
                              <div className="form-group">
                                <label>Operator</label>
                                <select
                                  value={condition.operator}
                                  onChange={(e) => updateCondition(qIndex, cIndex, { operator: e.target.value })}
                                >
                                  <option value="equals">equals</option>
                                  <option value="notEquals">not equals</option>
                                  <option value="contains">contains</option>
                                </select>
                              </div>
                              <div className="form-group">
                                <label>Value</label>
                                <input
                                  type="text"
                                  value={condition.value}
                                  onChange={(e) => updateCondition(qIndex, cIndex, { value: e.target.value })}
                                />
                              </div>
                              <button
                                className="btn btn-danger"
                                onClick={() => {
                                  const rules = { ...question.conditionalRules };
                                  rules.conditions.splice(cIndex, 1);
                                  updateQuestion(qIndex, { conditionalRules: rules.conditions.length > 0 ? rules : null });
                                }}
                                style={{ fontSize: '12px', padding: '5px 10px' }}
                              >
                                Remove Condition
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <button
                          className="btn btn-secondary"
                          onClick={() => addCondition(qIndex)}
                          style={{ fontSize: '12px' }}
                        >
                          Add Conditional Logic
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '30px' }}>
              {/* Add New Field Section */}
              <div style={{ marginBottom: '20px', padding: '15px', border: '2px dashed #007bff', borderRadius: '4px', backgroundColor: '#f8f9fa' }}>
                {!showNewFieldForm ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowNewFieldForm(true)}
                    style={{ width: '100%' }}
                  >
                    + Add New Custom Field
                  </button>
                ) : (
                  <div>
                    <h4 style={{ marginTop: 0, marginBottom: '15px' }}>Create New Field</h4>
                    <div className="form-group">
                      <label>Field Name</label>
                      <input
                        type="text"
                        value={newField.name}
                        onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                        placeholder="Enter field name"
                        style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Field Type</label>
                      <select
                        value={newField.type}
                        onChange={(e) => setNewField({ ...newField, type: e.target.value })}
                        style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                      >
                        <option value="shortText">Short Text</option>
                        <option value="longText">Long Text</option>
                        <option value="singleSelect">Single Select</option>
                        <option value="multiSelect">Multi Select</option>
                        <option value="attachment">Attachment</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={newField.required}
                          onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                          style={{ marginRight: '5px' }}
                        />
                        Required
                      </label>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        className="btn btn-primary"
                        onClick={addNewField}
                        style={{ flex: 1 }}
                      >
                        Add Field
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowNewFieldForm(false);
                          setNewField({ name: '', type: 'shortText', required: false });
                        }}
                        style={{ flex: 1 }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={loading || formData.questions.length === 0}
                style={{ width: '100%', padding: '12px' }}
              >
                {loading ? 'Creating...' : 'Create Form'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FormBuilder;

