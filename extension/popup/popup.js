// Popup script
document.addEventListener('DOMContentLoaded', function() {
    const statusDiv = document.getElementById('status');
    const statusText = document.getElementById('statusText');
    const optionsBtn = document.getElementById('optionsBtn');

    // Check if extension is active on current tab
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const currentTab = tabs[0];
        const url = currentTab.url;
        
        // Check if current site is supported
        const supportedSites = ['youtube.com/shorts/', 'tiktok.com', 'instagram.com/reels/'];
        const isSupported = supportedSites.some(site => url.includes(site));
        
        if (isSupported) {
            statusDiv.className = 'status active';
            statusText.textContent = '✅ Active on this page';
        } else {
            statusDiv.className = 'status inactive';
            statusText.textContent = '❌ Not supported on this page';
        }
    });

    // Open options page
    optionsBtn.addEventListener('click', function() {
        chrome.runtime.openOptionsPage();
    });
});
