'use strict';

/**
 * festival service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::festival.festival');
