// Background service worker for Manifest V3
chrome.runtime.onInstalled.addListener(() => {
    console.log('Video CAPTCHA Blocker installed');
    
    // Set default theme
    chrome.storage.sync.get(['theme'], (result) => {
        if (!result.theme) {
            chrome.storage.sync.set({ theme: 'dark' });
        }
    });
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'captchaSolved') {
        console.log('CAPTCHA solved, videos unblocked');
        // Could add analytics or logging here if needed
    }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    // Open options page when extension icon is clicked
    chrome.runtime.openOptionsPage();
});
