module.exports = {
  graphql: {
    enabled: true,
    config: {
      defaultLimit: 100,
      depthLimit: 100,
      maxLimit: 100,
    }
  },
  upload: {
    config: {
      providerOptions: {
        localServer: {
          maxage: 300000
        },
      },
      sizeLimit: 5 * 1024 * 1024 // 256mb in bytes
    },
  },
}
