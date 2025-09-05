// Type definitions and interfaces (JSDoc style)

/**
 * @typedef {Object} CaptchaConfig
 * @property {string} text - The CAPTCHA text to display
 * @property {number} length - Length of the CAPTCHA
 * @property {string} theme - Theme for the CAPTCHA overlay
 */

/**
 * @typedef {Object} VideoElement
 * @property {HTMLVideoElement} element - The video DOM element
 * @property {boolean} blocked - Whether the video is currently blocked
 * @property {number} timestamp - When the video was blocked
 */

/**
 * @typedef {Object} ExtensionSettings
 * @property {string} theme - Current theme setting
 * @property {string[]} blockedSites - List of blocked sites
 * @property {boolean} enabled - Whether the extension is enabled
 */
