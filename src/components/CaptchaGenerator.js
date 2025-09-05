// CAPTCHA generation utilities
import { CAPTCHA_LENGTH, CAPTCHA_CHARS } from '../utils/constants.js';

export class CaptchaGenerator {
  static generate() {
    let result = '';
    for (let i = 0; i < CAPTCHA_LENGTH; i++) {
      result += CAPTCHA_CHARS.charAt(Math.floor(Math.random() * CAPTCHA_CHARS.length));
    }
    return result;
  }

  static validate(userInput, captchaText) {
    return userInput.toUpperCase() === captchaText;
  }
}
