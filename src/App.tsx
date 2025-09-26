import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashoard';
import CreateStudent from './components/CreateStudent';
import EditStudent from './components/EditStudent';
import Home from './components/Home';
import StudentDashboard from './components/StudentDashboard';

// Composant pour protéger les routes des administrateurs
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('authUser') || '{}');
  const token = localStorage.getItem('authToken');

  if (!token || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Composant pour protéger les routes des étudiants
const StudentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('authUser') || '{}');
  
  const token = localStorage.getItem('authToken');
  
  if (!token || user.role !== 'student') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <div className="App">
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* Routes protégées pour les administrateurs */}
          <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
          <Route path="/create-student" element={<AdminRoute><CreateStudent /></AdminRoute>} />
          <Route path="/edit-student/:id" element={<AdminRoute><EditStudent /></AdminRoute>} />

          {/* Route protégée pour les étudiants */}
          <Route path="/student-dashboard" element={<StudentRoute><StudentDashboard /></StudentRoute>} />

          {/* Route accessible par l'administrateur pour voir le profil de l'étudiant */}
          <Route path="/student/:studentId" element={<AdminRoute><StudentDashboard /></AdminRoute>} />
        </Routes>
      </main>
    </div>
  );
};

// App doit être enveloppé dans Router pour utiliser useNavigate
const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;
