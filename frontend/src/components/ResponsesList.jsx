import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function ResponsesList({ user }) {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResponses();
  }, [formId]);

  const fetchResponses = async () => {
    try {
      const response = await axios.get(`/api/responses/forms/${formId}/responses`);
      setResponses(response.data);
    } catch (error) {
      console.error('Error fetching responses:', error);
      alert('Failed to fetch responses');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (responses.length === 0) {
      alert('No data to export');
      return;
    }

    // Get all unique question keys from all responses
    const allKeys = new Set();
    responses.forEach(response => {
      Object.keys(response.answers).forEach(key => allKeys.add(key));
    });
    const headers = ['ID', 'Status', 'Created At', ...Array.from(allKeys)];

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...responses.map(response => {
        const row = [
          response.id,
          response.status,
          new Date(response.createdAt).toISOString(),
          ...Array.from(allKeys).map(key => {
            const value = response.answers[key];
            // Handle different data types and escape CSV
            if (value === null || value === undefined) return '';
            if (Array.isArray(value)) return `"${value.join('; ')}"`;
            if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            return `"${String(value).replace(/"/g, '""')}"`;
          })
        ];
        return row.join(',');
      })
    ].join('\n');

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `form_responses_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    if (responses.length === 0) {
      alert('No data to export');
      return;
    }

    // Create JSON content with better structure
    const jsonData = {
      exportDate: new Date().toISOString(),
      totalResponses: responses.length,
      responses: responses.map(response => ({
        id: response.id,
        status: response.status,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        answers: response.answers
      }))
    };

    // Download JSON file
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `form_responses_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '20px' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: 0 }}>Form Responses</h1>
          {!loading && responses.length > 0 && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-primary"
                onClick={exportToCSV}
                style={{ fontSize: '14px', padding: '8px 16px' }}
              >
                📊 Export CSV
              </button>
              <button
                className="btn btn-secondary"
                onClick={exportToJSON}
                style={{ fontSize: '14px', padding: '8px 16px' }}
              >
                📄 Export JSON
              </button>
            </div>
          )}
        </div>
        {loading ? (
          <p>Loading responses...</p>
        ) : responses.length === 0 ? (
          <p style={{ color: '#666' }}>No responses yet.</p>
        ) : (
          <div>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Total responses: {responses.length}
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th style={{ textAlign: 'left', padding: '10px' }}>ID</th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Created</th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Answers Preview</th>
                </tr>
              </thead>
              <tbody>
                {responses.map(response => (
                  <tr key={response.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '12px' }}>
                      {response.id.substring(0, 8)}...
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: response.status === 'deleted' ? '#dc3545' : '#28a745',
                        color: 'white'
                      }}>
                        {response.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px', color: '#666' }}>
                      {new Date(response.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ fontSize: '12px' }}>
                        {Object.entries(response.answers).slice(0, 3).map(([key, value]) => (
                          <div key={key} style={{ marginBottom: '5px' }}>
                            <strong>{key}:</strong> {String(value)}
                          </div>
                        ))}
                        {Object.keys(response.answers).length > 3 && (
                          <div style={{ color: '#666' }}>...and {Object.keys(response.answers).length - 3} more</div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResponsesList;

