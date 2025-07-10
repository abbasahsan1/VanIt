import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const captainToken = localStorage.getItem('captainToken');
  const studentToken = localStorage.getItem('studentToken');

  if (captainToken || studentToken) {
    return children;
  } else {
    return <Navigate to="/landing-page" />;
  }
};

export default PrivateRoute;
