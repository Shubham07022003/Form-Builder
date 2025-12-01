import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import FormBuilder from './components/FormBuilder';
import FormViewer from './components/FormViewer';
import ResponsesList from './components/ResponsesList';

// Configure axios defaults
const api = axios.create({
  baseURL: '/api', // Use proxy instead of direct URL
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth headers here if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data || error.message);
    // Only redirect to login on 401 if not already on login page
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
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
      // Clear any stored tokens or user data
      localStorage.removeItem('user');
      // Navigate to login without triggering auth check
      window.location.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
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

