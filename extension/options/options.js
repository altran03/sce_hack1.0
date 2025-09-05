// Options page script
document.addEventListener('DOMContentLoaded', async function() {
    const themeSelect = document.getElementById('theme');
    const statusDiv = document.getElementById('status');

    // Load saved settings
    const result = await chrome.storage.sync.get(['theme']);
    const theme = result.theme || 'dark';
    themeSelect.value = theme;

    // Save settings when changed
    themeSelect.addEventListener('change', async function() {
        const selectedTheme = themeSelect.value;
        
        await chrome.storage.sync.set({ theme: selectedTheme });
        showStatus('Settings saved successfully!', 'success');
    });

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.classList.remove('hidden');
        
        // Hide status after 3 seconds
        setTimeout(() => {
            statusDiv.classList.add('hidden');
        }, 3000);
    }
});
