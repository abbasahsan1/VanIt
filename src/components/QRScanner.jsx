import React, { useState, useRef, useEffect } from 'react';
import { FaQrcode, FaCamera, FaCameraRotate } from 'react-icons/fa6';
import { FaCheckCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import jsQR from 'jsqr';
import axios from 'axios';

const QRScanner = ({ studentId, onScanSuccess, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' for front camera, 'environment' for back
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    if (isScanning) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isScanning, facingMode]);

  const startCamera = async () => {
    try {
      setError(null);
      setHasPermission(null);

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        // Start scanning for QR codes
        scanIntervalRef.current = setInterval(scanForQRCode, 1000);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setHasPermission(false);
      setError('Camera access denied. Please allow camera permissions and try again.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const scanForQRCode = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Get image data from canvas
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Try to detect QR code using a simple approach
      // Note: For production, you'd want to use a more robust QR code library like jsQR
      const qrCode = await detectQRCode(canvas);
      
      if (qrCode) {
        setIsScanning(false);
        await processQRCode(qrCode);
      }
    } catch (err) {
      console.error('Error scanning QR code:', err);
    }
  };

  // Actual QR code detection using jsQR
  const detectQRCode = async (canvas) => {
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });
    
    return code?.data || null;
  };

  // Simulate QR code scanning with manual input for demo
  const simulateQRScan = () => {
    const mockQRData = "eyJyb3V0ZV9uYW1lIjoiUm91dGUgMSIsImdlbmVyYXRlZF9hdCI6MTcwNTM2MzIwMDAwMCwiZXhwaXJlc19hdCI6MTcwNTQ0OTYwMDAwMCwidmVyc2lvbiI6IjEuMCIsImhhc2giOiJhYmMxMjMifQ==";
    processQRCode(mockQRData);
  };

  const processQRCode = async (qrData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current location if available
      let latitude = null;
      let longitude = null;

      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: true
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (err) {
          console.log('Location not available:', err);
        }
      }

      // Send QR scan to backend
      const response = await axios.post('http://localhost:5000/api/attendance/qr-scan', {
        studentId: studentId,
        qrData: qrData,
        latitude: latitude,
        longitude: longitude
      });

      if (response.data.success) {
        setScanResult({
          success: true,
          message: response.data.message,
          data: response.data.data
        });

        // Call success callback
        if (onScanSuccess) {
          onScanSuccess(response.data.data);
        }
      } else {
        setScanResult({
          success: false,
          message: response.data.error || 'Failed to process QR code'
        });
      }
    } catch (error) {
      console.error('Error processing QR scan:', error);
      setScanResult({
        success: false,
        message: error.response?.data?.error || 'Network error. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCamera = () => {
    setFacingMode(facingMode === 'environment' ? 'user' : 'environment');
  };

  const resetScanner = () => {
    setScanResult(null);
    setError(null);
    setIsScanning(true);
  };

  if (scanResult) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 m-4 max-w-md w-full">
          <div className="text-center">
            {scanResult.success ? (
              <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
            ) : (
              <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-4" />
            )}
            
            <h3 className={`text-xl font-bold mb-2 ${scanResult.success ? 'text-green-600' : 'text-red-600'}`}>
              {scanResult.success ? 'Boarding Successful!' : 'Scan Failed'}
            </h3>
            
            <p className="text-gray-700 mb-4">
              {scanResult.message}
            </p>

            {scanResult.success && scanResult.data && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4 text-left">
                <p className="text-sm text-blue-800">
                  <strong>Route:</strong> {scanResult.data.routeName}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Captain:</strong> {scanResult.data.captainName}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Students Onboard:</strong> {scanResult.data.studentsOnboard}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Time:</strong> {new Date(scanResult.data.scanTimestamp).toLocaleTimeString()}
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              {!scanResult.success && (
                <button
                  onClick={resetScanner}
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg m-4 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-blue-500 text-white p-4 flex justify-between items-center">
          <h3 className="text-lg font-bold flex items-center">
            <FaQrcode className="mr-2" />
            Scan QR Code
          </h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative">
          {!isScanning ? (
            <div className="p-8 text-center">
              <FaCamera className="text-6xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Point your camera at the QR code to board the bus
              </p>
              <button
                onClick={() => setIsScanning(true)}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center mx-auto"
              >
                <FaCamera className="mr-2" />
                Start Camera
              </button>
            </div>
          ) : hasPermission === false ? (
            <div className="p-8 text-center">
              <FaExclamationTriangle className="text-6xl text-red-400 mx-auto mb-4" />
              <p className="text-red-600 mb-4">
                {error || 'Camera permission is required to scan QR codes'}
              </p>
              <button
                onClick={() => setIsScanning(true)}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 object-cover"
                autoPlay
                playsInline
                muted
              />
              
              {/* QR Code Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-white rounded-lg" style={{ width: '200px', height: '200px' }}>
                  <div className="relative w-full h-full">
                    {/* Corner indicators */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500"></div>
                  </div>
                </div>
              </div>

              {/* Camera controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                <button
                  onClick={toggleCamera}
                  className="bg-white bg-opacity-80 p-3 rounded-full hover:bg-opacity-100 transition-all"
                  title="Switch Camera"
                >
                  <FaCameraRotate className="text-gray-700" />
                </button>
              </div>

              {isLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="bg-white p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
                      <span>Processing QR Code...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hidden canvas for image processing */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {/* Instructions */}
        <div className="p-4 bg-gray-50">
          <p className="text-sm text-gray-600 text-center mb-3">
            Hold your phone steady and point the camera at the QR code displayed in the bus
          </p>
          
          {/* Demo button for testing */}
          <button
            onClick={simulateQRScan}
            className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors text-sm"
          >
            Demo: Simulate QR Scan
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
