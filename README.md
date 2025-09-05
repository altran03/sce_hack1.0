# Video Demo
https://youtu.be/BCy8jym2-sg 

# Video CAPTCHA Blocker

A Chrome extension (Manifest V3) that blocks video playback on YouTube, TikTok, and Instagram Reels until the user solves a CAPTCHA overlay.

## Features

- 🔒 **Automatic Video Blocking**: Detects and pauses video elements on supported sites
- 🎨 **Customizable Themes**: Choose between dark and light themes for the CAPTCHA overlay
- ⚡ **Real-time Detection**: Uses MutationObserver to catch dynamically loaded videos
- 🎯 **Multi-Platform Support**: Works on YouTube, TikTok, and Instagram Reels
- 💾 **Persistent Settings**: Theme preferences saved with Chrome storage sync
- 🎮 **Smart Video Control**: Uses spacebar simulation for natural pause/resume
- 🔄 **One CAPTCHA Per Video**: Each video requires only one CAPTCHA solution
- 📱 **Site-Specific Behavior**: TikTok videos play behind CAPTCHA, others pause completely

## Supported Sites

- **YouTube** (youtube.com and all subdomains)
- **TikTok** (tiktok.com and all subdomains) - Videos play behind CAPTCHA
- **Instagram Reels** (instagram.com) - Videos pause completely

## Installation

### Development Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd video-captcha-blocker
   ```

2. **Load in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension/` folder
   - The extension should now appear in your extensions list

3. **Development workflow:**
   - Edit files directly in the `extension/` folder
   - Reload the extension in Chrome to test changes
   - No build process required!

### Production Installation

1. Zip the `extension/` folder
2. Upload to Chrome Web Store (requires developer account)

## Project Structure

```
├── extension/             # Extension files (load this folder in Chrome)
│   ├── manifest.json     # Extension manifest (Manifest V3)
│   ├── background/       # Background script
│   │   └── background.js
│   ├── content/          # Content scripts
│   │   └── content.js    # Main CAPTCHA logic
│   ├── popup/            # Extension popup
│   │   ├── popup.html
│   │   └── popup.js
│   ├── options/          # Options page
│   │   ├── options.html
│   │   └── options.js
│   ├── assets/           # Static assets
│   │   ├── icons/        # Extension icons
│   │   └── styles/       # CSS files
│   └── utils/            # Utility files
│       └── constants.js
├── package.json          # Minimal dependencies
├── package-lock.json     # Dependency lock file
└── README.md
```

**Note**: This project uses a clean, organized structure with no build process. All extension files are directly editable in the `extension/` folder.

## How It Works

1. **Content Script**: The `content.js` script runs on supported websites and:
   - Detects existing `<video>` elements
   - Monitors for new videos added to the page using MutationObserver
   - Tracks URL changes for single-page applications (Instagram Reels)
   - Pauses videos immediately when detected (except TikTok)
   - Injects the CAPTCHA overlay

2. **CAPTCHA Overlay**: A native HTML/JavaScript interface that:
   - Generates random text-based CAPTCHAs
   - Provides a user-friendly interface with autoselect input
   - Validates user input (case-insensitive, whitespace-tolerant)
   - Automatically unblocks videos upon successful completion
   - Tracks solved videos to prevent re-blocking

3. **Site-Specific Behavior**:
   - **TikTok**: Videos continue playing behind the CAPTCHA overlay
   - **Instagram Reels**: Videos pause completely until CAPTCHA is solved
   - **YouTube**: Videos pause completely until CAPTCHA is solved

4. **Options Page**: Allows users to:
   - Choose between dark/light themes
   - View extension information
   - Settings are saved with `chrome.storage.sync`

## Development

### Development Workflow

1. **Edit files directly** in the `extension/` folder
2. **Reload the extension** in Chrome (`chrome://extensions/` → click reload)
3. **Test changes** on supported sites
4. **No build process required!**

### Adding New Sites

To support additional video sites:

1. Add the domain to `manifest.json` under `content_scripts.matches`
2. Add the domain to `host_permissions`
3. Test the extension on the new site

### Customizing the CAPTCHA

The CAPTCHA logic is in `extension/content/content.js`. You can:
- Modify the CAPTCHA generation algorithm in the `generateCaptcha()` function
- Change the visual appearance in the `injectOverlay()` function
- Add different types of challenges
- Implement more complex validation
- Add AI-generated CAPTCHAs using external APIs

### File Organization

- **Background Script**: `extension/background/background.js`
- **Content Script**: `extension/content/content.js`
- **Popup**: `extension/popup/popup.html` and `extension/popup/popup.js`
- **Options**: `extension/options/options.html` and `extension/options/options.js`
- **Utilities**: `extension/utils/constants.js`
- **Assets**: `extension/assets/icons/` and `extension/assets/styles/`

## Browser Compatibility

- Chrome 88+ (Manifest V3 support required)
- Other Chromium-based browsers (Edge, Brave, etc.)

## Privacy

- No data is sent to external servers
- All settings stored locally using Chrome's storage API
- No tracking or analytics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Troubleshooting

### Extension Not Working
- Ensure you're on a supported site (YouTube/TikTok/Instagram)
- Check that the extension is enabled in `chrome://extensions/`
- Try refreshing the page after installing
- Check browser console for any error messages

### CAPTCHA Not Appearing
- Check browser console for errors
- Verify content script permissions in manifest.json
- Ensure the extension is reloaded after making changes
- Try scrolling to a new video on TikTok/Instagram

### Videos Not Pausing
- Check if you're on TikTok (videos play behind CAPTCHA by design)
- Verify the extension is active on the current site
- Check browser console for JavaScript errors

### CAPTCHA Persisting After Solving
- This should not happen with the current implementation
- If it does, check browser console for errors
- Try reloading the extension
