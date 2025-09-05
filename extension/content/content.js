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
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      z-index: 999999;
      display: flex;
      justify-content: center;
      align-items: center;
      animation: fadeIn 0.3s ease-out;
    `;
    
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

    // Create the CAPTCHA component
    this.captchaComponent = new CaptchaComponent(
      overlayContainer,
      () => this.onCaptchaSuccess(),
      () => this.onCaptchaError()
    );
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

// Initialize the video blocker
new VideoBlocker();