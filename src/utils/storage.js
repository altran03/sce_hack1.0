// Storage utilities for Chrome extension
export const Storage = {
  // Get theme setting
  async getTheme() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['theme'], (result) => {
        resolve(result.theme || 'dark');
      });
    });
  },

  // Set theme setting
  async setTheme(theme) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ theme }, () => {
        resolve();
      });
    });
  },

  // Get all settings
  async getAllSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['theme'], (result) => {
        resolve(result);
      });
    });
  }
};
