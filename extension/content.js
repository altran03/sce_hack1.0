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

  injectOverlay() {
    // Create container for CAPTCHA overlay
    const overlayContainer = document.createElement('div');
    overlayContainer.id = 'captcha-overlay-container';
    overlayContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 999999;
      display: flex;
      justify-content: center;
      align-items: center;
    `;
    
    document.body.appendChild(overlayContainer);

    // Create the CAPTCHA interface
    this.createCaptchaInterface();
  }

  createCaptchaInterface() {
    const container = document.getElementById('captcha-overlay-container');
    if (!container) return;

    // Generate CAPTCHA
    const captchaText = this.generateCaptcha();
    
    // Create CAPTCHA HTML
    container.innerHTML = `
      <div style="
        background: #1a1a1a;
        color: #ffffff;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        text-align: center;
        max-width: 400px;
        width: 90%;
        font-family: Arial, sans-serif;
      ">
        <h2 style="font-size: 1.5rem; margin-bottom: 1rem; font-weight: bold;">
          🔒 Video Access Required
        </h2>
        <p style="font-size: 0.9rem; margin-bottom: 1rem; opacity: 0.8;">
          Please solve the CAPTCHA below to continue watching videos
        </p>
        
        <div style="
          font-size: 2rem;
          font-weight: bold;
          letter-spacing: 0.5rem;
          margin: 1rem 0;
          padding: 1rem;
          background: #333333;
          border-radius: 8px;
          border: 2px dashed #666666;
        " id="captcha-display">
          ${captchaText}
        </div>
        
        <input 
          type="text" 
          id="captcha-input"
          placeholder="Enter the text above"
          style="
            width: 100%;
            padding: 0.75rem;
            font-size: 1rem;
            border: 2px solid #555555;
            border-radius: 6px;
            background: #2a2a2a;
            color: #ffffff;
            margin-bottom: 1rem;
            outline: none;
            box-sizing: border-box;
          "
        />
        
        <div>
          <button 
            id="verify-btn"
            style="
              background: #4CAF50;
              color: white;
              padding: 0.75rem 1.5rem;
              font-size: 1rem;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              margin-right: 0.5rem;
              transition: background-color 0.3s;
            "
          >
            Verify
          </button>
          <button 
            id="refresh-btn"
            style="
              background: #2196F3;
              color: white;
              padding: 0.75rem 1.5rem;
              font-size: 1rem;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              transition: background-color 0.3s;
            "
          >
            🔄 Refresh
          </button>
        </div>
        
        <div id="error-message" style="
          color: #f44336;
          font-size: 0.9rem;
          margin-top: 0.5rem;
          display: none;
        "></div>
      </div>
    `;

    // Add event listeners
    this.setupCaptchaEvents(captchaText);
  }

  generateCaptcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  setupCaptchaEvents(originalCaptcha) {
    const input = document.getElementById('captcha-input');
    const verifyBtn = document.getElementById('verify-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const errorDiv = document.getElementById('error-message');
    const captchaDisplay = document.getElementById('captcha-display');

    // Focus input
    input.focus();

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

    // Verify button click
    currentVerifyBtn.addEventListener('click', () => {
      const userInput = currentInput.value.trim().toUpperCase();
      const correctAnswer = originalCaptcha.toUpperCase();
      
      console.log('User input:', userInput);
      console.log('Correct answer:', correctAnswer);
      
      if (userInput === correctAnswer) {
        // CAPTCHA solved successfully
        console.log('CAPTCHA solved! Unblocking videos...');
        this.unblockVideos();
        this.removeOverlay();
      } else {
        // Show error and generate new CAPTCHA
        errorDiv.textContent = 'Incorrect CAPTCHA. Please try again.';
        errorDiv.style.display = 'block';
        currentInput.value = '';
        const newCaptcha = this.generateCaptcha();
        captchaDisplay.textContent = newCaptcha;
        this.setupCaptchaEvents(newCaptcha);
      }
    });

    // Refresh button click
    currentRefreshBtn.addEventListener('click', () => {
      const newCaptcha = this.generateCaptcha();
      captchaDisplay.textContent = newCaptcha;
      currentInput.value = '';
      errorDiv.style.display = 'none';
      this.setupCaptchaEvents(newCaptcha);
    });

    // Enter key press
    currentInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        currentVerifyBtn.click();
      }
    });

    // Button hover effects
    currentVerifyBtn.addEventListener('mouseover', () => {
      currentVerifyBtn.style.backgroundColor = '#45a049';
    });
    currentVerifyBtn.addEventListener('mouseout', () => {
      currentVerifyBtn.style.backgroundColor = '#4CAF50';
    });

    currentRefreshBtn.addEventListener('mouseover', () => {
      currentRefreshBtn.style.backgroundColor = '#1976D2';
    });
    currentRefreshBtn.addEventListener('mouseout', () => {
      currentRefreshBtn.style.backgroundColor = '#2196F3';
    });
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
    const overlay = document.getElementById('captcha-overlay-container');
    if (overlay) {
      overlay.remove();
    }
    this.overlayInjected = false;
  }
}

// Initialize the video blocker
new VideoBlocker();