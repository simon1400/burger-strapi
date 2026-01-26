module.exports = {
  apps: [{
    name: 'burger-strapi',
    cwd: '/opt/burger/strapi',
    script: 'node_modules/@strapi/strapi/bin/strapi.js',
    args: 'start',
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '400M',
    env: {
      NODE_ENV: 'production',
      HOST: '0.0.0.0',
      PORT: 1333
    },
    error_file: '/var/log/pm2/burger-strapi-error.log',
    out_file: '/var/log/pm2/burger-strapi-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    time: true
  }]
};
