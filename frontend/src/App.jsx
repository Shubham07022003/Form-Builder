import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import FormBuilder from './components/FormBuilder';
import FormViewer from './components/FormViewer';
import ResponsesList from './components/ResponsesList';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data || error.message);
    if (error.response?.status === 401 && !window.location.pathname.includes('/login') && !loading) {
      console.log('401 Unauthorized, redirecting to login');
      window.location.href = '/login?error=session_expired';
    }
    return Promise.reject(error);
  }
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('Checking authentication status...');
      console.log('Cookies available:', document.cookie);
      
      const response = await api.get('/auth/me');
      console.log('Auth check successful:', response.data);
      setUser(response.data);
    } catch (error) {
      console.error('Auth check failed:', error.response?.status, error.response?.data || error.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      localStorage.removeItem('user');
      window.location.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      localStorage.removeItem('user');
      window.location.replace('/login');
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" /> : <Login onLogin={checkAuth} />} 
        />
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/forms/new" 
          element={user ? <FormBuilder user={user} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/forms/:formId" 
          element={<FormViewer />} 
        />
        <Route 
          path="/forms/:formId/responses" 
          element={user ? <ResponsesList user={user} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={user ? "/dashboard" : "/login"} />} 
        />
      </Routes>
    </Router>
  );
}

export default App;

