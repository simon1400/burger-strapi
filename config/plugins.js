module.exports = {
  graphql: {
    enabled: true,
    config: {
      defaultLimit: 1000,
      depthLimit: 1000,
      maxLimit: 1000,
    }
  },
  'import-export-entries': {
    enabled: true,
    config: {
      serverPublicHostname: 'https://burgerfestival.cz'
    },
  },
}
