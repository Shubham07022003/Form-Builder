import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Dashboard({ user, onLogout }) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const response = await axios.get('/api/forms');
      setForms(response.data);
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (formId) => {
    if (!window.confirm('Are you sure you want to delete this form?')) {
      return;
    }

    try {
      await axios.delete(`/api/forms/${formId}`);
      fetchForms();
    } catch (error) {
      console.error('Error deleting form:', error);
      alert('Failed to delete form');
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1>Dashboard</h1>
          <p style={{ color: '#666', marginTop: '5px' }}>
            Welcome
          </p>
        </div>
        <div>
          <Link to="/forms/new" className="btn btn-primary" style={{ marginRight: '10px', textDecoration: 'none' }}>
            Create New Form
          </Link>
          <button className="btn btn-secondary" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '20px' }}>Your Forms</h2>
        {loading ? (
          <p>Loading forms...</p>
        ) : forms.length === 0 ? (
          <p style={{ color: '#666' }}>No forms yet. Create your first form!</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '10px' }}>Title</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Created</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {forms.map(form => (
                <tr key={form._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>
                    <Link to={`/forms/${form._id}`} style={{ textDecoration: 'none', color: '#007bff' }}>
                      {form.title}
                    </Link>
                  </td>
                  <td style={{ padding: '10px', color: '#666' }}>
                    {new Date(form.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <Link 
                      to={`/forms/${form._id}/responses`} 
                      className="btn btn-secondary" 
                      style={{ marginRight: '5px', textDecoration: 'none', padding: '5px 10px', fontSize: '12px' }}
                    >
                      View Responses
                    </Link>
                    <button 
                      className="btn btn-danger" 
                      onClick={() => handleDelete(form._id)}
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

