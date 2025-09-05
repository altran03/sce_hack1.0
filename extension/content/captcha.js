/**
 * CaptchaComponent - Handles CAPTCHA UI and interactions
 */
class CaptchaComponent {
  constructor(container, onSuccess, onError) {
    this.container = container;
    this.onSuccess = onSuccess;
    this.onError = onError;
    this.captchaText = this.generateCaptcha();
    this.init();
  }

  init() {
    this.injectStyles();
    this.render();
    this.setupEvents();
  }

  injectStyles() {
    if (!document.getElementById('captcha-styles')) {
      const style = document.createElement('style');
      style.id = 'captcha-styles';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { 
            opacity: 0; 
            transform: translateY(-20px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes success {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .captcha-container {
          animation: slideIn 0.4s ease-out;
        }
        .captcha-error {
          animation: shake 0.5s ease-in-out;
        }
        .captcha-success {
          animation: success 0.6s ease-in-out;
        }
        .captcha-input:focus {
          animation: pulse 0.3s ease-in-out;
        }
      `;
      document.head.appendChild(style);
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="captcha-container" style="
        background: linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%);
        color: #ffffff;
        padding: 2.5rem;
        border-radius: 20px;
        box-shadow: 
          0 20px 60px rgba(0, 0, 0, 0.4),
          0 0 0 1px rgba(255, 255, 255, 0.1);
        text-align: center;
        max-width: 450px;
        width: 90%;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        position: relative;
        overflow: hidden;
      ">
        <!-- Decorative background elements -->
        <div style="
          position: absolute;
          top: -50px;
          right: -50px;
          width: 100px;
          height: 100px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
          border-radius: 50%;
        "></div>
        <div style="
          position: absolute;
          bottom: -30px;
          left: -30px;
          width: 60px;
          height: 60px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%);
          border-radius: 50%;
        "></div>
        
        <!-- Header -->
        <div style="margin-bottom: 2rem;">
          <div style="
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border-radius: 50%;
            margin-bottom: 1rem;
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
          ">
            <span style="font-size: 1.8rem;">🔒</span>
          </div>
          <h2 style="
            font-size: 1.8rem; 
            margin: 0 0 0.5rem 0; 
            font-weight: 700;
            background: linear-gradient(135deg, #ffffff, #e5e7eb);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          ">
            Video Access Required
          </h2>
          <p style="
            font-size: 1rem; 
            margin: 0; 
            opacity: 0.7;
            line-height: 1.5;
          ">
            Please solve the security challenge below to continue watching
          </p>
        </div>
        
        <!-- CAPTCHA Display -->
        <div style="margin-bottom: 1.5rem;">
          <div style="
            font-size: 2.2rem;
            font-weight: 800;
            letter-spacing: 0.3rem;
            margin: 1.5rem 0;
            padding: 1.5rem;
            background: linear-gradient(135deg, #374151, #1f2937);
            border-radius: 16px;
            border: 2px solid rgba(255, 255, 255, 0.1);
            box-shadow: 
              inset 0 2px 4px rgba(0, 0, 0, 0.2),
              0 4px 12px rgba(0, 0, 0, 0.3);
            position: relative;
            overflow: hidden;
          " id="captcha-display">
            <div style="
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.05) 50%, transparent 70%);
              animation: shimmer 2s infinite;
            "></div>
            <span style="position: relative; z-index: 1;">${this.captchaText}</span>
          </div>
        </div>
        
        <!-- Input Field -->
        <div style="margin-bottom: 1.5rem;">
          <input 
            type="text" 
            id="captcha-input"
            placeholder="Type the characters above"
            style="
              width: 100%;
              padding: 1rem 1.25rem;
              font-size: 1.1rem;
              border: 2px solid rgba(255, 255, 255, 0.1);
              border-radius: 12px;
              background: rgba(255, 255, 255, 0.05);
              color: #ffffff;
              outline: none;
              box-sizing: border-box;
              transition: all 0.3s ease;
              backdrop-filter: blur(10px);
            "
            onfocus="this.style.borderColor='#3b82f6'; this.style.boxShadow='0 0 0 3px rgba(59, 130, 246, 0.1)';"
            onblur="this.style.borderColor='rgba(255, 255, 255, 0.1)'; this.style.boxShadow='none';"
          />
        </div>
        
        <!-- Action Buttons -->
        <div style="display: flex; gap: 0.75rem; justify-content: center;">
          <button 
            id="verify-btn"
            style="
              background: linear-gradient(135deg, #10b981, #059669);
              color: white;
              padding: 1rem 2rem;
              font-size: 1rem;
              font-weight: 600;
              border: none;
              border-radius: 12px;
              cursor: pointer;
              transition: all 0.3s ease;
              box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
              flex: 1;
              position: relative;
              overflow: hidden;
            "
            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(16, 185, 129, 0.4)';"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(16, 185, 129, 0.3)';"
          >
            <span style="position: relative; z-index: 1;">✓ Verify</span>
          </button>
          <button 
            id="refresh-btn"
            style="
              background: linear-gradient(135deg, #6366f1, #4f46e5);
              color: white;
              padding: 1rem 1.5rem;
              font-size: 1rem;
              font-weight: 600;
              border: none;
              border-radius: 12px;
              cursor: pointer;
              transition: all 0.3s ease;
              box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
              position: relative;
              overflow: hidden;
            "
            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(99, 102, 241, 0.4)';"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(99, 102, 241, 0.3)';"
          >
            <span style="position: relative; z-index: 1;">🔄</span>
          </button>
        </div>
        
        <!-- Error Message -->
        <div id="error-message" style="
          color: #ef4444;
          font-size: 0.9rem;
          margin-top: 1rem;
          display: none;
          padding: 0.75rem;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 8px;
          border: 1px solid rgba(239, 68, 68, 0.2);
        "></div>
        
        <!-- Help Text -->
        <div style="
          margin-top: 1.5rem;
          font-size: 0.85rem;
          opacity: 0.6;
          line-height: 1.4;
        ">
          💡 Tip: Type the characters exactly as shown above
        </div>
      </div>
    `;
  }

  setupEvents() {
    const input = document.getElementById('captcha-input');
    const verifyBtn = document.getElementById('verify-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const errorDiv = document.getElementById('error-message');
    const captchaDisplay = document.getElementById('captcha-display');
    const container = document.querySelector('.captcha-container');

    // Focus and select input
    input.focus();
    input.select();

    // Clear any existing event listeners by cloning elements
    const newVerifyBtn = verifyBtn.cloneNode(true);
    const newRefreshBtn = refreshBtn.cloneNode(true);
    const newInput = input.cloneNode(true);
    
    verifyBtn.parentNode.replaceChild(newVerifyBtn, verifyBtn);
    refreshBtn.parentNode.replaceChild(newRefreshBtn, refreshBtn);
    input.parentNode.replaceChild(newInput, input);

    // Get references to the new elements
    const currentInput = document.getElementById('captcha-input');
    const currentVerifyBtn = document.getElementById('verify-btn');
    const currentRefreshBtn = document.getElementById('refresh-btn');

    // Verify button click with enhanced feedback
    currentVerifyBtn.addEventListener('click', () => {
      const userInput = currentInput.value.trim().toUpperCase();
      const correctAnswer = this.captchaText.toUpperCase();
      
      console.log('User input:', userInput);
      console.log('Correct answer:', correctAnswer);
      
      if (userInput === correctAnswer) {
        // CAPTCHA solved successfully - show success animation
        currentVerifyBtn.innerHTML = '<span style="position: relative; z-index: 1;">✓ Success!</span>';
        currentVerifyBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        
        // Add success animation to container
        if (container) {
          container.classList.add('captcha-success');
        }
        
        // Show success message briefly
        errorDiv.style.display = 'block';
        errorDiv.style.color = '#10b981';
        errorDiv.style.background = 'rgba(16, 185, 129, 0.1)';
        errorDiv.style.border = '1px solid rgba(16, 185, 129, 0.2)';
        errorDiv.textContent = '✓ CAPTCHA verified! Unblocking videos...';
        
        setTimeout(() => {
          console.log('CAPTCHA solved! Unblocking videos...');
          this.onSuccess();
        }, 1000);
      } else {
        // Show error with shake animation
        errorDiv.textContent = '❌ Incorrect CAPTCHA. Please try again.';
        errorDiv.style.display = 'block';
        errorDiv.style.color = '#ef4444';
        errorDiv.style.background = 'rgba(239, 68, 68, 0.1)';
        errorDiv.style.border = '1px solid rgba(239, 68, 68, 0.2)';
        
        // Add shake animation
        if (container) {
          container.classList.add('captcha-error');
          setTimeout(() => {
            container.classList.remove('captcha-error');
          }, 500);
        }
        
        // Clear input and generate new CAPTCHA
        currentInput.value = '';
        currentInput.focus();
        
        setTimeout(() => {
          this.captchaText = this.generateCaptcha();
          captchaDisplay.innerHTML = `
            <div style="
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.05) 50%, transparent 70%);
              animation: shimmer 2s infinite;
            "></div>
            <span style="position: relative; z-index: 1;">${this.captchaText}</span>
          `;
          this.setupEvents();
        }, 300);
      }
    });

    // Refresh button click with animation
    currentRefreshBtn.addEventListener('click', () => {
      // Add rotation animation to refresh button
      currentRefreshBtn.style.transform = 'rotate(360deg)';
      currentRefreshBtn.style.transition = 'transform 0.5s ease';
      
      setTimeout(() => {
        this.captchaText = this.generateCaptcha();
        captchaDisplay.innerHTML = `
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.05) 50%, transparent 70%);
            animation: shimmer 2s infinite;
          "></div>
          <span style="position: relative; z-index: 1;">${this.captchaText}</span>
        `;
        currentInput.value = '';
        currentInput.focus();
        currentInput.select();
        errorDiv.style.display = 'none';
        currentRefreshBtn.style.transform = 'rotate(0deg)';
        this.setupEvents();
      }, 250);
    });

    // Enter key press
    currentInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        currentVerifyBtn.click();
      }
    });

    // Input validation feedback
    currentInput.addEventListener('input', (e) => {
      const value = e.target.value;
      if (value.length > 0) {
        currentInput.style.borderColor = 'rgba(59, 130, 246, 0.5)';
      } else {
        currentInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      }
    });

    // Enhanced button interactions
    currentVerifyBtn.addEventListener('mouseover', () => {
      currentVerifyBtn.style.transform = 'translateY(-2px)';
      currentVerifyBtn.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
    });
    
    currentVerifyBtn.addEventListener('mouseout', () => {
      currentVerifyBtn.style.transform = 'translateY(0)';
      currentVerifyBtn.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
    });

    currentRefreshBtn.addEventListener('mouseover', () => {
      currentRefreshBtn.style.transform = 'translateY(-2px)';
      currentRefreshBtn.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)';
    });
    
    currentRefreshBtn.addEventListener('mouseout', () => {
      currentRefreshBtn.style.transform = 'translateY(0)';
      currentRefreshBtn.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.3)';
    });
  }

  generateCaptcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}
