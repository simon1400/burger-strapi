'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/festivals/:slug/ics',
      handler: 'festival.ics',
      config: {
        auth: false,
      },
    },
  ],
};
