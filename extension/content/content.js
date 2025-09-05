// Import SudokuCaptcha
// Content script to detect and pause video elements
class VideoBlocker {
  constructor() {
    this.videos = new Set();
    this.solvedVideoSources = new Set(); // Track video sources that have been solved
    this.solvedVideoIds = new Set(); // Track videos by other identifiers
    this.currentUrl = window.location.href;
    this.overlayInjected = false;
    this.init();
  }

  init() {
    // Find existing videos
    this.findAndBlockVideos();
    
    // Watch for new videos added to the page
    this.observeVideoChanges();
    
    // Watch for URL changes (Instagram Reels navigation)
    this.observeUrlChanges();
    
    // Listen for messages from the overlay
    this.setupMessageListener();
  }

  findAndBlockVideos() {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => this.blockVideo(video));
  }

  observeVideoChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node is a video
            if (node.tagName === 'VIDEO') {
              this.blockVideo(node);
            }
            // Check for videos within the added node
            const videos = node.querySelectorAll?.('video');
            videos?.forEach(video => this.blockVideo(video));
          }
        });
      });
      
      // Also check for src changes (Instagram/TikTok changes video sources)
      if (mutation.type === 'attributes' && mutation.target.tagName === 'VIDEO') {
        this.blockVideo(mutation.target);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src']
    });
  }

  observeUrlChanges() {
    // Check for URL changes every 500ms (Instagram Reels uses pushState)
    setInterval(() => {
      if (window.location.href !== this.currentUrl) {
        this.currentUrl = window.location.href;
        console.log('URL changed to:', this.currentUrl);
        
        // Clear solved videos when URL changes (new reel)
        this.solvedVideoSources.clear();
        this.solvedVideoIds.clear();
        this.videos.clear();
        
        // Find and block videos on the new page
        setTimeout(() => {
          this.findAndBlockVideos();
        }, 100);
      }
    }, 500);
  }

  blockVideo(video) {
    if (this.videos.has(video)) return;
    
    // Get video identifiers
    const videoSrc = video.src || video.currentSrc || '';
    const videoId = video.id || video.getAttribute('data-id') || '';
    const videoIdentifier = videoSrc || videoId || this.currentUrl;
    
    if (!videoIdentifier) return; // Skip videos without identifier
    
    // Don't block if this specific video has already been solved
    if (this.solvedVideoSources.has(videoSrc) || this.solvedVideoIds.has(videoIdentifier)) {
      return;
    }
    
    this.videos.add(video);
    
    // Check if this is TikTok (let video play behind CAPTCHA)
    const isTikTok = window.location.hostname.includes('tiktok.com');
    
    if (!isTikTok) {
      // For Instagram and other sites, pause the video
      video.pause();
      
      // Prevent play attempts
      const blockHandler = (e) => {
        e.preventDefault();
        video.pause();
      };

      video._blockHandler = blockHandler;
      video.addEventListener('pause', blockHandler);
    }

    // Inject overlay if not already done
    if (!this.overlayInjected) {
      this.injectOverlay();
      this.overlayInjected = true;
    }
  }

  async injectOverlay() {
    // Get user's theme preference
    const result = await chrome.storage.sync.get(['theme']);
    const theme = result.theme || 'dark';
    
    // Create container for CAPTCHA overlay
    const overlayContainer = document.createElement('div');
    overlayContainer.id = 'captcha-overlay-container';
    
    // Add fadeIn animation
    if (!document.getElementById('captcha-overlay-styles')) {
      const style = document.createElement('style');
      style.id = 'captcha-overlay-styles';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(overlayContainer);

    // Randomly choose between easy captcha, 9x9 Sudoku, and 4x4 Sudoku
    const captchaType = Math.random();
    
    if (captchaType < 0.33) {
      // Create the regular CAPTCHA component with theme
      this.captchaComponent = new CaptchaComponent(
        overlayContainer,
        () => this.onCaptchaSuccess(),
        () => this.onCaptchaError(),
        theme
      );
    } else if (captchaType < 0.66) {
      // Create 9x9 Sudoku CAPTCHA component
      this.captchaComponent = new SudokuCaptchaComponent(
        overlayContainer,
        () => this.onCaptchaSuccess(),
        () => this.onCaptchaError(),
        theme,
        9
      );
    } else {
      // Create 4x4 Sudoku CAPTCHA component
      this.captchaComponent = new SudokuCaptchaComponent(
        overlayContainer,
        () => this.onCaptchaSuccess(),
        () => this.onCaptchaError(),
        theme,
        4
      );
    }
  }

  onCaptchaSuccess() {
    console.log('CAPTCHA solved! Unblocking videos...');
    this.unblockVideos();
    this.removeOverlay();
  }

  onCaptchaError() {
    console.log('CAPTCHA error occurred');
    // Component handles its own error display
  }


  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'captchaSolved') {
        this.unblockVideos();
        this.removeOverlay();
      } else if (request.action === 'testCaptcha') {
        // Test message from popup
        sendResponse({ success: true, message: 'Content script is working!' });
      }
    });
  }

  unblockVideos() {
    this.videos.forEach(video => {
      // Mark this video as solved using multiple identifiers
      const videoSrc = video.src || video.currentSrc || '';
      const videoId = video.id || video.getAttribute('data-id') || '';
      const videoIdentifier = videoSrc || videoId || this.currentUrl;
      
      if (videoSrc) {
        this.solvedVideoSources.add(videoSrc);
      }
      if (videoIdentifier) {
        this.solvedVideoIds.add(videoIdentifier);
      }
      
      // Check if this is TikTok (no need to resume)
      const isTikTok = window.location.hostname.includes('tiktok.com');
      
      if (!isTikTok) {
        // For Instagram and other sites, resume the video
        if (video._blockHandler) {
          video.removeEventListener('play', video._blockHandler);
          delete video._blockHandler;
        }
        video.play();
      }
    });
    this.videos.clear();
    console.log('Videos unblocked!');
  }

  removeOverlay() {
    // Clean up the CAPTCHA component
    if (this.captchaComponent) {
      this.captchaComponent.destroy();
      this.captchaComponent = null;
    }
    
    const overlay = document.getElementById('captcha-overlay-container');
    if (overlay) {
      overlay.remove();
    }
    this.overlayInjected = false;
  }
}

/**
 * SudokuCaptchaComponent - Wrapper for SudokuCaptcha with theme support
 */
class SudokuCaptchaComponent {
  constructor(container, onSuccess, onError, theme = 'dark', size = 9) {
    this.container = container;
    this.onSuccess = onSuccess;
    this.onError = onError;
    this.theme = theme;
    this.size = size;
    this.init();
  }

  init() {
    this.injectStyles();
    this.render();
  }

  injectStyles() {
    if (!document.getElementById('sudoku-captcha-styles')) {
      const style = document.createElement('style');
      style.id = 'sudoku-captcha-styles';
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
        @keyframes success {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        /* Sudoku CAPTCHA Container */
        .sudoku-captcha-container {
          animation: slideIn 0.4s ease-out !important;
          width: 500px !important;
          max-width: 500px !important;
          min-width: 500px !important;
          margin: 0 !important;
          padding: 2.5rem !important;
          box-sizing: border-box !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
          font-size: 16px !important;
          line-height: 1.5 !important;
          position: relative !important;
          display: block !important;
          text-align: center !important;
          border-radius: 20px !important;
          overflow: hidden !important;
        }
        
        .sudoku-captcha-container * {
          box-sizing: border-box !important;
        }
        
        .sudoku-captcha-container h2 {
          font-size: 1.8rem !important;
          margin: 0 0 0.5rem 0 !important;
          font-weight: 700 !important;
          line-height: 1.2 !important;
        }
        
        .sudoku-captcha-container p {
          font-size: 1rem !important;
          margin: 0 !important;
          line-height: 1.5 !important;
        }
        
        .sudoku-captcha-container button {
          padding: 1rem 2rem !important;
          font-size: 1rem !important;
          font-weight: 600 !important;
          border: none !important;
          border-radius: 12px !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
          position: relative !important;
          overflow: hidden !important;
          margin: 0 !important;
          box-sizing: border-box !important;
        }
        
        .sudoku-captcha-container #error-message {
          font-size: 0.9rem !important;
          margin-top: 1rem !important;
          padding: 0.75rem !important;
          border-radius: 8px !important;
          box-sizing: border-box !important;
        }
        
        .sudoku-captcha-container .captcha-help {
          margin-top: 1.5rem !important;
          font-size: 0.85rem !important;
          line-height: 1.4 !important;
          box-sizing: border-box !important;
        }
        
        /* Animation classes */
        .sudoku-captcha-error {
          animation: shake 0.5s ease-in-out !important;
        }
        .sudoku-captcha-success {
          animation: success 0.6s ease-in-out !important;
        }
        
        /* Overlay container - Force consistent sizing */
        #captcha-overlay-container {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          background: rgba(0, 0, 0, 0.85) !important;
          backdrop-filter: blur(8px) !important;
          z-index: 999999 !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          animation: fadeIn 0.3s ease-out !important;
          margin: 0 !important;
          padding: 0 !important;
          box-sizing: border-box !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  getThemeStyles() {
    if (this.theme === 'light') {
      return {
        container: `
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          color: #1f2937;
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.1),
            0 0 0 1px rgba(0, 0, 0, 0.1);
        `,
        headerIcon: `
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        `,
        title: `
          background: linear-gradient(135deg, #1f2937, #374151);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        `,
        subtitle: `
          opacity: 0.6;
        `,
        helpText: `
          opacity: 0.5;
        `
      };
    } else {
      return {
        container: `
          background: linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%);
          color: #ffffff;
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.1);
        `,
        headerIcon: `
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        `,
        title: `
          background: linear-gradient(135deg, #ffffff, #e5e7eb);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        `,
        subtitle: `
          opacity: 0.7;
        `,
        helpText: `
          opacity: 0.6;
        `
      };
    }
  }

  render() {
    const styles = this.getThemeStyles();
    
    this.container.innerHTML = `
      <div class="sudoku-captcha-container" style="${styles.container}">
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
        <div style="margin-bottom: 2rem; text-align: center;">
          <div style="
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 60px;
            height: 60px;
            ${styles.headerIcon}
            border-radius: 50%;
            margin-bottom: 1rem;
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
          ">
            <span style="font-size: 1.8rem;">🧩</span>
          </div>
          <h2 style="
            font-size: 1.8rem; 
            margin: 0 0 0.5rem 0; 
            font-weight: 700;
            ${styles.title}
            text-align: center;
          ">
            Sudoku Challenge
          </h2>
          <p style="
            font-size: 1rem; 
            margin: 0; 
            ${styles.subtitle}
            line-height: 1.5;
            text-align: center;
          ">
            Complete the ${this.size}x${this.size} Sudoku puzzle to continue watching
          </p>
        </div>
        
        <!-- Sudoku Grid Container -->
        <div id="sudoku-grid-container" style="margin-bottom: 1.5rem;"></div>
        
        <!-- Action Buttons -->
        <div style="display: flex; gap: 0.75rem; justify-content: center;">
          <button 
            id="verify-sudoku-btn"
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
              overflow: hidden;lu
            "
            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(16, 185, 129, 0.4)';"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(16, 185, 129, 0.3)';"
          >
            <span style="position: relative; z-index: 1;">✓ Verify</span>
          </button>
          <button 
            id="refresh-sudoku-btn"
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
        <div class="captcha-help" style="${styles.helpText}; text-align: center;">
          💡 Tip: Fill in the missing numbers (1-${this.size}) in each row, column, and ${this.size === 4 ? '2x2' : '3x3'} box
        </div>
      </div>
    `;

    // Initialize the Sudoku captcha
    this.sudokuCaptcha = new SudokuCaptcha(
      document.getElementById('sudoku-grid-container'),
      () => this.onSudokuSuccess(),
      this.size
    );
    
    this.setupEvents();
  }

  setupEvents() {
    const verifyBtn = document.getElementById('verify-sudoku-btn');
    const refreshBtn = document.getElementById('refresh-sudoku-btn');
    const errorDiv = document.getElementById('error-message');
    const container = document.querySelector('.sudoku-captcha-container');

    // Clear any existing event listeners by cloning elements
    const newVerifyBtn = verifyBtn.cloneNode(true);
    const newRefreshBtn = refreshBtn.cloneNode(true);
    
    verifyBtn.parentNode.replaceChild(newVerifyBtn, verifyBtn);
    refreshBtn.parentNode.replaceChild(newRefreshBtn, refreshBtn);

    // Get references to the new elements
    const currentVerifyBtn = document.getElementById('verify-sudoku-btn');
    const currentRefreshBtn = document.getElementById('refresh-sudoku-btn');

    // Verify button click
    currentVerifyBtn.addEventListener('click', () => {
      if (this.sudokuCaptcha) {
        this.sudokuCaptcha.checkSolution();
      }
    });

    // Refresh button click
    currentRefreshBtn.addEventListener('click', () => {
      // Add rotation animation to refresh button
      currentRefreshBtn.style.transform = 'rotate(360deg)';
      currentRefreshBtn.style.transition = 'transform 0.5s ease';
      
      setTimeout(() => {
        // Randomly choose a new captcha type
        this.refreshToRandomCaptcha();
        currentRefreshBtn.style.transform = 'rotate(0deg)';
      }, 250);
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

  onSudokuSuccess() {
    const verifyBtn = document.getElementById('verify-sudoku-btn');
    const errorDiv = document.getElementById('error-message');
    const container = document.querySelector('.sudoku-captcha-container');
    
    // Show success animation
    verifyBtn.innerHTML = '<span style="position: relative; z-index: 1;">✓ Success!</span>';
    verifyBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    
    // Add success animation to container
    if (container) {
      container.classList.add('sudoku-captcha-success');
    }
    
    // Show success message briefly
    errorDiv.style.display = 'block';
    errorDiv.style.color = '#10b981';
    errorDiv.style.background = 'rgba(16, 185, 129, 0.1)';
    errorDiv.style.border = '1px solid rgba(16, 185, 129, 0.2)';
    errorDiv.textContent = '✓ Sudoku solved! Unblocking videos...';
    
    setTimeout(() => {
      console.log('Sudoku CAPTCHA solved! Unblocking videos...');
      this.onSuccess();
    }, 1000);
  }

  refreshToRandomCaptcha() {
    // Get the parent overlay container
    const overlayContainer = this.container;
    
    // Clean up current component
    this.destroy();
    
    // Randomly choose a new captcha type
    const captchaType = Math.random();
    
    if (captchaType < 0.33) {
      // Create the regular CAPTCHA component
      this.captchaComponent = new CaptchaComponent(
        overlayContainer,
        () => this.onSuccess(),
        () => this.onError(),
        this.theme
      );
    } else if (captchaType < 0.66) {
      // Create 9x9 Sudoku CAPTCHA component
      this.captchaComponent = new SudokuCaptchaComponent(
        overlayContainer,
        () => this.onSuccess(),
        () => this.onError(),
        this.theme,
        9
      );
    } else {
      // Create 4x4 Sudoku CAPTCHA component
      this.captchaComponent = new SudokuCaptchaComponent(
        overlayContainer,
        () => this.onSuccess(),
        () => this.onError(),
        this.theme,
        4
      );
    }
  }

  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
    if (this.sudokuCaptcha) {
      this.sudokuCaptcha = null;
    }
  }
}

// Initialize the video blocker
new VideoBlocker();