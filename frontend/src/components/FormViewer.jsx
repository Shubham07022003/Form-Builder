import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { shouldShowQuestion } from '../utils/conditionalLogic';

function FormViewer() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchForm();
  }, [formId]);

  const fetchForm = async () => {
    try {
      const response = await axios.get(`/api/forms/${formId}`);
      setForm(response.data);
    } catch (error) {
      console.error('Error fetching form:', error);
      alert('Failed to load form: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionKey, value) => {
    setAnswers({ ...answers, [questionKey]: value });
    // Clear error for this field
    if (errors[questionKey]) {
      const newErrors = { ...errors };
      delete newErrors[questionKey];
      setErrors(newErrors);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    for (const question of form.questions) {
      // Check if question should be shown
      if (!shouldShowQuestion(question.conditionalRules, answers)) {
        continue; // Skip validation for hidden questions
      }

      const answer = answers[question.questionKey];

      if (question.required && (answer === undefined || answer === null || answer === '')) {
        newErrors[question.questionKey] = `${question.label} is required`;
      }

      // Type-specific validation
      if (answer !== undefined && answer !== null && answer !== '') {
        if (question.type === 'multiSelect' && !Array.isArray(answer)) {
          newErrors[question.questionKey] = `${question.label} must be an array`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`/api/responses/forms/${formId}/submit`, { answers });
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      if (error.response?.data?.errors) {
        const newErrors = {};
        error.response.data.errors.forEach(err => {
          const question = form.questions.find(q => err.includes(q.label));
          if (question) {
            newErrors[question.questionKey] = err;
          }
        });
        setErrors(newErrors);
      } else {
        alert('Failed to submit form: ' + (error.response?.data?.error || error.message));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="container">Loading form...</div>;
  }

  if (!form) {
    return <div className="container">Form not found</div>;
  }

  if (submitSuccess) {
    return (
      <div className="container" style={{ maxWidth: '600px', marginTop: '50px' }}>
        <div className="card">
          <h1 style={{ color: '#28a745', marginBottom: '20px' }}>✓ Form Submitted Successfully!</h1>
          <p style={{ marginBottom: '30px' }}>Thank you for your submission.</p>
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/dashboard')}
              style={{ padding: '10px 20px' }}
            >
              Back to Dashboard
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSubmitSuccess(false);
                setAnswers({});
                setErrors({});
              }}
              style={{ padding: '10px 20px' }}
            >
              Submit Another Response
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: 0 }}>{form.title}</h1>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/dashboard')}
            style={{ fontSize: '14px', padding: '8px 16px' }}
          >
            Cancel
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {form.questions.map((question, index) => {
            const shouldShow = shouldShowQuestion(question.conditionalRules, answers);
            
            if (!shouldShow) {
              return null;
            }

            return (
              <div key={index} className="form-group">
                <label>
                  {question.label}
                  {question.required && <span style={{ color: '#dc3545' }}> *</span>}
                </label>

                {question.type === 'shortText' && (
                  <input
                    type="text"
                    value={answers[question.questionKey] || ''}
                    onChange={(e) => handleAnswerChange(question.questionKey, e.target.value)}
                  />
                )}

                {question.type === 'longText' && (
                  <textarea
                    value={answers[question.questionKey] || ''}
                    onChange={(e) => handleAnswerChange(question.questionKey, e.target.value)}
                  />
                )}

                {question.type === 'singleSelect' && (
                  <select
                    value={answers[question.questionKey] || ''}
                    onChange={(e) => handleAnswerChange(question.questionKey, e.target.value)}
                  >
                    <option value="">Select an option...</option>
                    {question.options.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                )}

                {question.type === 'multiSelect' && (
                  <div>
                    {question.options.map(option => {
                      const currentValue = answers[question.questionKey] || [];
                      const isChecked = Array.isArray(currentValue) && currentValue.includes(option);
                      return (
                        <label key={option} style={{ display: 'block', marginBottom: '5px' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const current = answers[question.questionKey] || [];
                              const newValue = e.target.checked
                                ? [...current, option]
                                : current.filter(v => v !== option);
                              handleAnswerChange(question.questionKey, newValue);
                            }}
                            style={{ marginRight: '5px' }}
                          />
                          {option}
                        </label>
                      );
                    })}
                  </div>
                )}

                {question.type === 'attachment' && (
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      handleAnswerChange(question.questionKey, files.map(f => ({ name: f.name, url: '' })));
                    }}
                  />
                )}

                {errors[question.questionKey] && (
                  <div className="error">{errors[question.questionKey]}</div>
                )}
              </div>
            );
          })}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ marginTop: '20px' }}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default FormViewer;

