// Site configuration for the extension
export const SITE_CONFIG = {
  YOUTUBE: {
    domains: ['youtube.com/shorts/', 'www.youtube.com/shorts/', 'm.youtube.com/shorts/'],
    selectors: {
      video: 'video',
      player: '#movie_player, .html5-video-player',
      shorts: '[is-shorts]'
    },
    features: ['shorts']
  },
  
  TIKTOK: {
    domains: ['tiktok.com', 'www.tiktok.com'],
    selectors: {
      video: 'video',
      player: '[data-e2e="video-player"]'
    },
    features: ['shorts']
  }
};

export const getSiteConfig = (url) => {
  for (const [siteName, config] of Object.entries(SITE_CONFIG)) {
    if (config.domains.some(domain => url.includes(domain))) {
      return { siteName, ...config };
    }
  }
  return null;
};
