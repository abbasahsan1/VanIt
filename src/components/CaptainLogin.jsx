// src/pages/CaptainLogin.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CaptainLogin = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // ✅ Toggle between login and signup
  const toggleMode = () => {
    setIsSignup(!isSignup);
    setMessage('');
    setStep(1);
    setPhone('');
    setOtp('');
    setPassword('');
  };

  // ✅ Send OTP for signup
  const sendOtp = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/auth/captains/send-otp", { phone });
      setMessage(response.data.message);
      setStep(2);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to send OTP');
    }
  };

  // ✅ Verify OTP
  const verifyOtp = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/captains/verify-otp', { phone, otp });
      localStorage.setItem('captainToken', response.data.token);
      localStorage.setItem('phoneForPassword', phone); // Save for setting password
      localStorage.setItem('captainPhone', phone);
      localStorage.setItem('otpLogin', 'true');
      navigate('/captain/home'); // We'll trigger the password popup here
    } catch (error) {
      setMessage(error.response?.data?.error || 'Invalid OTP');
    }
  };

  // ✅ Normal login
  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/auth/captains/login", { phone, password });
      localStorage.setItem('captainToken', response.data.token);
      navigate('/captain/home');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-blue-100 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4 text-blue-700">{isSignup ? 'Captain Signup (OTP)' : 'Captain Login'}</h2>

        <input
          type="text"
          placeholder="Enter Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
        />

        {isSignup ? (
          <>
            {step === 2 && (
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full mb-4 p-2 border rounded"
              />
            )}
            <button
              onClick={step === 1 ? sendOtp : verifyOtp}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              {step === 1 ? 'Send OTP' : 'Verify OTP'}
            </button>
          </>
        ) : (
          <>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-4 p-2 border rounded"
            />
            <button
              onClick={handleLogin}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              Login
            </button>
          </>
        )}

        <p className="text-center mt-4 text-blue-600 cursor-pointer hover:underline" onClick={toggleMode}>
          {isSignup ? 'Already have an account? Login' : 'New here? Sign up with OTP'}
        </p>

        {message && <p className="mt-4 text-center text-red-500">{message}</p>}
      </div>
    </div>
  );
};

export default CaptainLogin;
