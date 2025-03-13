import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import 'dotenv/config';

const App = () => {
  const [coupon, setCoupon] = useState(null);
  const [message, setMessage] = useState("Welcome! Claim your special discount coupon below.");
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [intervalId, setIntervalId] = useState(null);
  const [copied, setCopied] = useState(false);

 

  useEffect(() => {
    // Check if user has an active restriction
    const checkRestriction = async () => {
      try {
        const response = await axios.get(`${import.meta.env.DEV_URL}/check-status`, { withCredentials: true });
        if (response.data.restricted) {
          setTimeLeft(response.data.timeLeft);
          startCountdown(response.data.timeLeft);
          setMessage("Please wait before claiming another coupon");
          setMessageType("warning");
        } else {
          setMessage("Welcome! Claim your special discount coupon below.");
          setMessageType("info");
        }
      } catch (error) {
        setMessage("Unable to check status. Please try again later.");
        setMessageType("error");
      }
    };

    checkRestriction();

    // Cleanup interval on component unmount
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const startCountdown = (seconds) => {
    if (intervalId) clearInterval(intervalId);
    
    const newIntervalId = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(newIntervalId);
          setMessage("You can now claim a new coupon!");
          setMessageType("success");
          return null;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    setIntervalId(newIntervalId);
  };

  const formatTime = (totalSeconds) => {
    if (!totalSeconds) return "";
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const claimCoupon = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.DEV_URL}/check-status`, {}, { withCredentials: true });
      setCoupon(response.data.coupon);
      setMessage("Coupon claimed successfully!");
      setMessageType("success");
      
      if (response.data.restrictionTime) {
        setTimeLeft(response.data.restrictionTime);
        startCountdown(response.data.restrictionTime);
      }
    } catch (error) {
      setCoupon(null);
      setMessage(error.response?.data?.message || "Error claiming coupon");
      setMessageType("error");
      
      if (error.response?.data?.timeLeft) {
        setTimeLeft(error.response?.data?.timeLeft);
        startCountdown(error.response?.data?.timeLeft);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (coupon) {
      try {
        await navigator.clipboard.writeText(coupon);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy code:', err);
      }
    }
  };

  const getMessageStyles = () => {
    const baseStyles = "p-4 my-5 rounded-lg text-center";
    
    switch (messageType) {
      case "info":
        return `${baseStyles} bg-blue-50 text-blue-700 border-l-4 border-blue-500`;
      case "success":
        return `${baseStyles} bg-green-50 text-green-700 border-l-4 border-green-500`;
      case "warning":
        return `${baseStyles} bg-yellow-50 text-yellow-700 border-l-4 border-yellow-500`;
      case "error":
        return `${baseStyles} bg-red-50 text-red-700 border-l-4 border-red-500`;
      default:
        return baseStyles;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 flex justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-center text-white">
            <h1 className="text-2xl font-bold mb-2">Exclusive Coupon Offer</h1>
            <p className="text-sm opacity-90">Get your limited-time discount code</p>
          </div>
          
          <div className="p-6">
            {/* Message */}
            <div className={getMessageStyles()}>
              {message}
            </div>
            
            {/* Coupon Display */}
            {coupon && (
              <div className="my-6 p-5 border-2 border-dashed border-indigo-500 rounded-lg bg-gray-50 text-center relative">
                <div className="absolute w-4 h-4 bg-white rounded-full -left-2 top-1/2 transform -translate-y-1/2"></div>
                <div className="absolute w-4 h-4 bg-white rounded-full -right-2 top-1/2 transform -translate-y-1/2"></div>
                
                <p className="text-sm text-indigo-600 mb-2">Your Discount Code:</p>
                <div 
                  onClick={handleCopyCode}
                  className="text-2xl font-bold tracking-wider text-gray-800 my-3 py-2 px-4 bg-indigo-50 rounded-md inline-block cursor-pointer hover:bg-indigo-100 transition-colors relative"
                >
                  {coupon}
                  {copied && (
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                      Copied!
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">Click the code to copy to clipboard</p>
              </div>
            )}
            
            {/* Timer */}
            {timeLeft && (
              <div className="my-5 text-center">
                <p className="text-sm text-gray-500 mb-1">Time until next coupon:</p>
                <div className="text-xl font-mono font-semibold text-gray-800 bg-gray-100 py-2 px-4 rounded-md inline-block">
                  {formatTime(timeLeft)}
                </div>
              </div>
            )}
            
            {/* Button */}
            <button 
              className={`w-full py-4 px-6 mt-6 rounded-lg font-medium text-white transition-all focus:outline-none ${
                loading || timeLeft 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-lg transform hover:-translate-y-0.5'
              }`}
              onClick={claimCoupon}
              disabled={loading || timeLeft}
            >
              {loading ? 'Processing...' : timeLeft ? 'Please Wait' : 'Claim Your Coupon'}
            </button>
            
            {/* Footer */}
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Our coupons are distributed fairly using a round-robin system.</p>
              <p className="mt-1">One coupon per user within the restricted time period.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;