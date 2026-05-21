'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const ics = require('ics');

const FESTIVAL_START_HOUR = 14;
const FESTIVAL_END_HOUR = 20;

const SITE_URL_BY_LOCALE = {
  en: 'https://burgerstreetfestival.cz',
  pl: 'https://burgerfestival.pl',
};

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<\/(p|div|h[1-6]|li|br)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function toIcsDateArray(dateStr, hour) {
  const d = new Date(dateStr);
  return [d.getFullYear(), d.getMonth() + 1, d.getDate(), hour, 0];
}

module.exports = createCoreController('api::festival.festival', ({ strapi }) => ({
  async ics(ctx) {
    const { slug } = ctx.params;
    const locale = ctx.query.locale || 'en';

    const results = await strapi.entityService.findMany('api::festival.festival', {
      filters: { slug },
      locale,
      fields: ['title', 'slug', 'place', 'from', 'to', 'content'],
    });

    const festival = Array.isArray(results) ? results[0] : results;
    if (!festival) {
      return ctx.notFound('Festival not found');
    }

    const start = toIcsDateArray(festival.from, FESTIVAL_START_HOUR);
    const end = toIcsDateArray(festival.to, FESTIVAL_END_HOUR);
    const siteUrl = SITE_URL_BY_LOCALE[locale] || SITE_URL_BY_LOCALE.en;
    const url = `${siteUrl}/${festival.slug}`;

    const { error, value } = ics.createEvent({
      uid: `${festival.slug}-${locale}@burgerstreetfestival.cz`,
      productId: 'burgerstreetfestival/ics',
      start,
      end,
      startInputType: 'local',
      startOutputType: 'local',
      endInputType: 'local',
      endOutputType: 'local',
      title: `Burger Street Festival — ${festival.title}`,
      description: stripHtml(festival.content),
      location: [festival.place, festival.title].filter(Boolean).join(', '),
      url,
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
      alarms: [
        {
          action: 'display',
          description: 'Reminder',
          trigger: { hours: 24, minutes: 0, before: true },
        },
        {
          action: 'display',
          description: 'Reminder',
          trigger: { hours: 0, minutes: 0, before: true },
        },
      ],
    });

    if (error) {
      strapi.log.error('ICS generation failed', error);
      return ctx.internalServerError('Failed to generate ICS');
    }

    ctx.set('Content-Type', 'text/calendar; charset=utf-8');
    ctx.set('Content-Disposition', `attachment; filename="burger-${festival.slug}.ics"`);
    ctx.body = value;
  },
}));
