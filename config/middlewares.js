module.exports = [
  "strapi::errors",
  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "connect-src": ["'self'", "https:"],
          "img-src": ["'self'", "data:", "blob:", "https://market-assets.strapi.io"],
          "media-src": ["'self'", "data:", "blob:"],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: "strapi::cors",
    config: {
      origin: [
        "https://burger.hardart.cz",
        "https://burgerfestival.pl",
        "https://www.burgerfestival.pl",
        "https://burgerfestival.cz",
        "https://www.burgerfestival.cz",
        "https://burgerstreetfestival.cz",
        "https://www.burgerstreetfestival.cz",
        "http://localhost:3000"
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
      headers: ["Content-Type", "Authorization", "Origin", "Accept", "X-Requested-With"],
      keepHeaderOnError: true,
    },
  },
  "strapi::poweredBy",
  "strapi::logger",
  "strapi::query",
  "strapi::body",
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
];
