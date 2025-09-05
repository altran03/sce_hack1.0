// Content script to detect and pause video elements
import { MESSAGES } from '../utils/constants.js';

class VideoBlocker {
  constructor() {
    this.videos = new Set();
    this.overlayInjected = false;
    this.init();
  }

  init() {
    // Find existing videos
    this.findAndBlockVideos();
    
    // Watch for new videos added to the page
    this.observeVideoChanges();
    
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
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  blockVideo(video) {
    if (this.videos.has(video)) return;
    
    this.videos.add(video);
    
    // Pause the video immediately
    video.pause();
    
    // Prevent play attempts
    video.addEventListener('play', (e) => {
      e.preventDefault();
      video.pause();
    });

    // Inject overlay if not already done
    if (!this.overlayInjected) {
      this.injectOverlay();
      this.overlayInjected = true;
    }
  }

  injectOverlay() {
    // Create container for React overlay
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

    // Inject the React overlay script
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('dist/captcha-overlay.js');
    script.onload = () => {
      // The React component will mount itself
    };
    document.head.appendChild(script);
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === MESSAGES.CAPTCHA_SOLVED) {
        this.unblockVideos();
        this.removeOverlay();
      }
    });
  }

  unblockVideos() {
    this.videos.forEach(video => {
      // Remove event listeners and allow playback
      video.removeEventListener('play', (e) => e.preventDefault());
    });
    this.videos.clear();
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
