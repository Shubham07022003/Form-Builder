import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { shouldShowQuestion } from '../utils/conditionalLogic';

function FormPreview() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    const questionsParam = searchParams.get('questions');
    const titleParam = searchParams.get('title');

    if (questionsParam && titleParam) {
      try {
        const questions = JSON.parse(decodeURIComponent(questionsParam));
        setForm({
          title: decodeURIComponent(titleParam),
          questions
        });
      } catch (error) {
        console.error('Error parsing form data:', error);
        alert('Failed to load form preview');
        navigate('/dashboard');
      }
    }
  }, [searchParams, navigate]);

  const handleAnswerChange = (questionKey, value) => {
    setAnswers({ ...answers, [questionKey]: value });
  };

  const handleBackToBuilder = () => {
    // Store form data in sessionStorage for when we return to builder
    if (form) {
      sessionStorage.setItem('formBuilderData', JSON.stringify({
        title: form.title,
        questions: form.questions
      }));
    }
    navigate(-1);
  };

  if (!form) {
    return <div className="container"><p>Loading preview...</p></div>;
  }

  const renderQuestionInput = (question) => {
    switch (question.type) {
      case 'shortText':
        return (
          <input
            type="text"
            placeholder={`Enter ${question.label.toLowerCase()}`}
            value={answers[question.questionKey] || ''}
            onChange={(e) => handleAnswerChange(question.questionKey, e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        );
      case 'longText':
        return (
          <textarea
            placeholder={`Enter ${question.label.toLowerCase()}`}
            value={answers[question.questionKey] || ''}
            onChange={(e) => handleAnswerChange(question.questionKey, e.target.value)}
            rows={4}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        );
      case 'singleSelect':
        return (
          <select
            value={answers[question.questionKey] || ''}
            onChange={(e) => handleAnswerChange(question.questionKey, e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="">Select an option...</option>
            {question.options && question.options.map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'multiSelect':
        return (
          <select
            multiple
            value={Array.isArray(answers[question.questionKey]) ? answers[question.questionKey] : []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value);
              handleAnswerChange(question.questionKey, selected);
            }}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            {question.options && question.options.map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'attachment':
        return (
          <input
            type="file"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              const fileNames = files.map(f => f.name).join(', ');
              handleAnswerChange(question.questionKey, files.length > 0 ? fileNames : '');
            }}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        );
      default:
        return <input type="text" disabled placeholder="Unsupported field type" />;
    }
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '20px' }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      <div className="card">
        <h1>{form.title}</h1>
        <p style={{ color: '#666', marginBottom: '30px', fontStyle: 'italic' }}>
          Preview mode - Changes are not saved
        </p>

        <form>
          {form.questions.length === 0 ? (
            <p style={{ color: '#999' }}>No questions in this form yet.</p>
          ) : (
            form.questions.map((question, idx) => {
              const shouldShow = shouldShowQuestion(question.conditionalRules, answers);
              
              if (!shouldShow) {
                return null;
              }

              return (
                <div key={idx} className="form-group" style={{ marginBottom: '25px' }}>
                  <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                    {question.label}
                    {question.required && <span style={{ color: '#dc3545' }}>*</span>}
                  </label>
                  {question.type && (
                    <small style={{ display: 'block', color: '#999', marginBottom: '8px' }}>
                      ({question.type})
                    </small>
                  )}
                  {renderQuestionInput(question)}
                  {question.conditionalRules && question.conditionalRules.conditions.length > 0 && (
                    <small style={{ display: 'block', color: '#0066cc', marginTop: '5px' }}>
                      ⚠️ This field has conditional logic
                    </small>
                  )}
                </div>
              );
            })
          )}
        </form>

        <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
          <h3 style={{ marginTop: 0 }}>Preview Info</h3>
          <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
            <li>Total fields: {form.questions.length}</li>
            <li>Required fields: {form.questions.filter(q => q.required).length}</li>
            <li>Fields with conditions: {form.questions.filter(q => q.conditionalRules && q.conditionalRules.conditions.length > 0).length}</li>
            <li>Currently visible: {form.questions.filter(q => shouldShowQuestion(q.conditionalRules, answers)).length}</li>
          </ul>
        </div>

        <div style={{ marginTop: '20px' }}>
          <button
            className="btn btn-secondary"
            onClick={handleBackToBuilder}
            style={{ marginRight: '10px' }}
          >
            Back to Form Builder
          </button>
        </div>
      </div>
    </div>
  );
}

export default FormPreview;
