module.exports = {
  apps : [{
    name   : "Burger strapi",
    script : "npm start",
    env_production: {}
  }],

  deploy : {
    production : {
      user : 'dimi',
      host : ['89.221.216.23'],
      ref  : 'origin/main',
      repo : 'git@github.com:simon1400/burger-strapi.git',
      path : '/home/dimi/app/burger/strapi',
      'post-deploy' : 'npm i && npm run build && pm2 reload ecosystem.config.js --env production',
    }
  }
};
