import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { CaptchaGenerator } from './CaptchaGenerator.js';
import { Storage } from '../utils/storage.js';
import { THEMES, MESSAGES } from '../utils/constants.js';

const CaptchaOverlay = () => {
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(THEMES.DARK);

  useEffect(() => {
    // Generate a simple CAPTCHA
    generateCaptcha();
    
    // Load theme from storage
    loadTheme();
  }, []);

  const loadTheme = async () => {
    const savedTheme = await Storage.getTheme();
    setTheme(savedTheme);
  };

  const generateCaptcha = () => {
    const captcha = CaptchaGenerator.generate();
    setCaptchaText(captcha);
  };

  const handleSubmit = () => {
    if (CaptchaGenerator.validate(userInput, captchaText)) {
      // CAPTCHA solved successfully
      chrome.runtime.sendMessage({ action: MESSAGES.CAPTCHA_SOLVED });
    } else {
      setError('Incorrect CAPTCHA. Please try again.');
      setUserInput('');
      generateCaptcha();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const styles = {
    container: {
      backgroundColor: theme === THEMES.DARK ? '#1a1a1a' : '#ffffff',
      color: theme === THEMES.DARK ? '#ffffff' : '#000000',
      padding: '2rem',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      textAlign: 'center',
      maxWidth: '400px',
      width: '90%',
      fontFamily: 'Arial, sans-serif'
    },
    title: {
      fontSize: '1.5rem',
      marginBottom: '1rem',
      fontWeight: 'bold'
    },
    captcha: {
      fontSize: '2rem',
      fontWeight: 'bold',
      letterSpacing: '0.5rem',
      margin: '1rem 0',
      padding: '1rem',
      backgroundColor: theme === THEMES.DARK ? '#333333' : '#f0f0f0',
      borderRadius: '8px',
      border: '2px dashed #666666'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      fontSize: '1rem',
      border: `2px solid ${theme === THEMES.DARK ? '#555555' : '#cccccc'}`,
      borderRadius: '6px',
      backgroundColor: theme === THEMES.DARK ? '#2a2a2a' : '#ffffff',
      color: theme === THEMES.DARK ? '#ffffff' : '#000000',
      marginBottom: '1rem',
      outline: 'none'
    },
    button: {
      backgroundColor: '#4CAF50',
      color: 'white',
      padding: '0.75rem 1.5rem',
      fontSize: '1rem',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      marginRight: '0.5rem',
      transition: 'background-color 0.3s'
    },
    refreshButton: {
      backgroundColor: '#2196F3',
      color: 'white',
      padding: '0.75rem 1.5rem',
      fontSize: '1rem',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background-color 0.3s'
    },
    error: {
      color: '#f44336',
      fontSize: '0.9rem',
      marginTop: '0.5rem'
    },
    description: {
      fontSize: '0.9rem',
      marginBottom: '1rem',
      opacity: 0.8
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🔒 Video Access Required</h2>
      <p style={styles.description}>
        Please solve the CAPTCHA below to continue watching videos
      </p>
      
      <div style={styles.captcha}>
        {captchaText}
      </div>
      
      <input
        type="text"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Enter the text above"
        style={styles.input}
        autoFocus
      />
      
      <div>
        <button 
          onClick={handleSubmit}
          style={styles.button}
          onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
        >
          Verify
        </button>
        <button 
          onClick={generateCaptcha}
          style={styles.refreshButton}
          onMouseOver={(e) => e.target.style.backgroundColor = '#1976D2'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#2196F3'}
        >
          🔄 Refresh
        </button>
      </div>
      
      {error && <div style={styles.error}>{error}</div>}
    </div>
  );
};

// Mount the React component
const container = document.getElementById('captcha-overlay-container');
if (container) {
  const root = createRoot(container);
  root.render(<CaptchaOverlay />);
}
