# Video CAPTCHA Blocker

A Chrome extension (Manifest V3) that blocks video playback on YouTube Shorts, TikTok, and other supported sites until the user solves a CAPTCHA overlay.

## Features

- 🔒 **Automatic Video Blocking**: Detects and pauses video elements on supported sites
- 🎨 **Customizable Themes**: Choose between dark and light themes for the CAPTCHA overlay
- ⚡ **Real-time Detection**: Uses MutationObserver to catch dynamically loaded videos
- 🎯 **Targeted Sites**: Currently supports YouTube and TikTok
- 💾 **Persistent Settings**: Theme preferences saved with Chrome storage sync

## Supported Sites

- YouTube (youtube.com and all subdomains)
- TikTok (tiktok.com and all subdomains)

## Installation

### Development Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd video-captcha-blocker
   npm install
   ```

2. **Build the extension:**
   ```bash
   npm run build
   ```

3. **Load in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension/` folder
   - The extension should now appear in your extensions list

### Production Installation

1. Build the extension: `npm run build`
2. Zip the entire project folder (excluding `node_modules` and `dist`)
3. Upload to Chrome Web Store (requires developer account)

## Project Structure

```
├── extension/             # Extension files (load this folder in Chrome)
│   ├── manifest.json     # Extension manifest (Manifest V3)
│   ├── background.js     # Service worker
│   ├── options.html      # Options page
│   ├── options.js        # Options page logic
│   ├── popup.html        # Extension popup
│   ├── popup.js          # Popup logic
│   ├── content.js        # Built content script
│   └── captcha-overlay.js # Built React overlay
├── src/                  # Source code
│   ├── components/       # React components
│   │   ├── CaptchaOverlay.jsx
│   │   └── CaptchaGenerator.js
│   ├── content/          # Content script source
│   │   └── content.js
│   ├── utils/            # Utility functions
│   │   ├── storage.js    # Chrome storage utilities
│   │   └── constants.js  # App constants
│   ├── config/           # Configuration files
│   │   └── sites.js      # Site-specific configs
│   └── types/            # Type definitions
│       └── index.js
├── package.json          # Dependencies and build scripts
├── vite.config.js        # Vite configuration for bundling
└── README.md
```

## How It Works

1. **Content Script**: The `content.js` script runs on supported websites and:
   - Detects existing `<video>` elements
   - Monitors for new videos added to the page
   - Pauses videos immediately when detected
   - Injects the CAPTCHA overlay

2. **CAPTCHA Overlay**: A React component that:
   - Generates random text-based CAPTCHAs
   - Provides a user-friendly interface
   - Validates user input
   - Sends success message to unblock videos

3. **Options Page**: Allows users to:
   - Choose between dark/light themes
   - View extension information
   - Settings are saved with `chrome.storage.sync`

## Development

### Available Scripts

- `npm run build` - Build the extension for production
- `npm run dev` - Build in watch mode for development

### Adding New Sites

To support additional video sites:

1. Add the domain to `manifest.json` under `content_scripts.matches`
2. Add the domain to `host_permissions`
3. Test the extension on the new site

### Customizing the CAPTCHA

The CAPTCHA logic is in `src/CaptchaOverlay.jsx`. You can:
- Modify the CAPTCHA generation algorithm
- Change the visual appearance
- Add different types of challenges
- Implement more complex validation

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
- Ensure you're on a supported site (YouTube/TikTok)
- Check that the extension is enabled in `chrome://extensions/`
- Try refreshing the page after installing

### Build Issues
- Make sure Node.js 16+ is installed
- Run `npm install` to ensure all dependencies are installed
- Check that the `dist/` folder is created after building

### CAPTCHA Not Appearing
- Check browser console for errors
- Ensure the React overlay script is loading correctly
- Verify content script permissions in manifest.json
