const { startServer, PORT } = require('./server')

module.exports = {
  // Uncomment to route through the legacy proxy path and make the hang go away.
  // forceHttp1: true,
  e2e: {
    setupNodeEvents(on, config) {
      startServer()
      config.baseUrl = `http://localhost:${PORT}`
      return config
    },
  },
}
