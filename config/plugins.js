module.exports = {
  graphql: {
    enabled: true,
    config: {
      defaultLimit: 1000,
      depthLimit: 1000,
      maxLimit: 1000,
    }
  },
  upload: {
    config: {
      sizeLimit: 10 * 1024 * 1024, // 10MB max file size
      breakpoints: {
        xlarge: 1920,
        large: 1000,
        medium: 750,
        small: 500,
        xsmall: 64
      },
      provider: 'local',
      providerOptions: {},
    },
  },
};
