/* eslint-disable no-console */
/**
 * Fills the `topPartners`, `partners`, `supported`, `partners2` relations
 * on the local `partner` singleType, based on the same lists that exist
 * on prod (still in the OLD component-based schema).
 *
 * Matches prod components -> local festival-partner records by URL.
 *
 * Usage:
 *   LOCAL_STRAPI_URL=http://localhost:1333
 *   LOCAL_STRAPI_TOKEN=<full-access token>
 *   node strapi/scripts/link-partners-page.js
 */

const https = require('https')
const http = require('http')
const { URL } = require('url')

const PROD_GRAPHQL = process.env.PROD_GRAPHQL_URL || 'https://burger-strapi.hardart.cz/graphql'
const LOCAL_URL = process.env.LOCAL_STRAPI_URL || 'http://localhost:1333'
const TOKEN = process.env.LOCAL_STRAPI_TOKEN
const DRY_RUN = process.env.DRY_RUN === '1'
const LOCALE = process.env.LOCALE || 'en'

if (!TOKEN) {
  console.error('LOCAL_STRAPI_TOKEN env var is required.')
  process.exit(1)
}

const SECTIONS = ['topPartners', 'partners', 'supported', 'partners2']

const PROD_QUERY = `query($locale: I18NLocaleCode!) {
  partner(locale: $locale) {
    data {
      attributes {
        topPartners { image { data { attributes { url } } } link }
        partners    { image { data { attributes { url } } } link }
        supported   { image { data { attributes { url } } } link }
        partners2   { image { data { attributes { url } } } link }
      }
    }
  }
}`

function httpJson(method, urlStr, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr)
    const lib = u.protocol === 'https:' ? https : http
    const payload = body ? Buffer.from(JSON.stringify(body)) : null
    const req = lib.request(
      {
        method,
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        headers: {
          'content-type': 'application/json',
          ...(payload ? { 'content-length': payload.length } : {}),
          ...headers,
        },
      },
      (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8')
          let parsed
          try {
            parsed = raw ? JSON.parse(raw) : null
          } catch {
            return reject(new Error(`Non-JSON response from ${urlStr}: ${raw.slice(0, 200)}`))
          }
          if (res.statusCode >= 400) {
            return reject(
              new Error(`${method} ${urlStr} -> ${res.statusCode}: ${JSON.stringify(parsed)}`),
            )
          }
          resolve(parsed)
        })
      },
    )
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

function normaliseLink(link) {
  if (!link) return null
  return link.trim().replace(/\/+$/, '')
}

function basenameFromImageUrl(url) {
  if (!url) return null
  return url.split('/').pop()
}

async function fetchAllLocalPartners() {
  const all = []
  let page = 1
  while (true) {
    const res = await httpJson(
      'GET',
      `${LOCAL_URL}/api/festival-partners?pagination[page]=${page}&pagination[pageSize]=100&populate=logo`,
      null,
      { authorization: `Bearer ${TOKEN}` },
    )
    all.push(...res.data)
    const { pageCount } = res.meta.pagination
    if (page >= pageCount) break
    page++
  }
  return all
}

function buildLocalIndex(localPartners) {
  // index by (a) normalised link, (b) image filename, (c) image url path,
  // (d) name, (e) prefix of uploaded filename before the strapi hash suffix.
  const byLink = new Map()
  const byImage = new Map()
  const byName = new Map()
  for (const p of localPartners) {
    const link = normaliseLink(p.attributes.link)
    if (link) byLink.set(link, p.id)
    const imgUrl = p.attributes.logo?.data?.attributes?.url
    if (imgUrl) {
      byImage.set(imgUrl, p.id)
      const basename = basenameFromImageUrl(imgUrl)
      if (basename) {
        byImage.set(basename, p.id)
        // strip strapi hash suffix:  amy_d361cf80ea.svg -> amy.svg / amy
        const stripped = basename.replace(/_[a-f0-9]{8,}\./, '.')
        if (stripped && stripped !== basename) {
          byImage.set(stripped, p.id)
          byImage.set(stripped.replace(/\.[^.]+$/, ''), p.id)
        }
      }
    }
    if (p.attributes.name) byName.set(p.attributes.name, p.id)
  }
  return { byLink, byImage, byName }
}

function matchProdToLocal(prodItem, index) {
  const link = normaliseLink(prodItem.link)
  if (link && index.byLink.has(link)) return index.byLink.get(link)
  const imgUrl = prodItem?.image?.data?.attributes?.url
  if (imgUrl && index.byImage.has(imgUrl)) return index.byImage.get(imgUrl)
  if (imgUrl) {
    const basename = basenameFromImageUrl(imgUrl)
    if (basename && index.byImage.has(basename)) return index.byImage.get(basename)
    if (basename) {
      const stripped = basename.replace(/_[a-f0-9]{8,}\./, '.')
      if (index.byImage.has(stripped)) return index.byImage.get(stripped)
    }
  }
  // last resort: prod link is not a URL but a label (e.g. "IR-GROUP") that matches a local name
  if (link && index.byName.has(link)) return index.byName.get(link)
  return null
}

async function fetchProdSections(locale) {
  const res = await httpJson('POST', PROD_GRAPHQL, { query: PROD_QUERY, variables: { locale } })
  if (res.errors) throw new Error('GraphQL errors: ' + JSON.stringify(res.errors))
  return res.data?.partner?.data?.attributes || null
}

async function updateLocalPartnerPage(locale, payload) {
  return httpJson(
    'PUT',
    `${LOCAL_URL}/api/partner?locale=${encodeURIComponent(locale)}`,
    { data: payload },
    { authorization: `Bearer ${TOKEN}` },
  )
}

;(async () => {
  console.log('Source:', PROD_GRAPHQL, 'locale=', LOCALE)
  console.log('Target:', LOCAL_URL, DRY_RUN ? '(DRY RUN)' : '')

  const localPartners = await fetchAllLocalPartners()
  console.log(`Local catalog: ${localPartners.length} festival-partner records.`)
  const index = buildLocalIndex(localPartners)

  const prodAttrs = await fetchProdSections(LOCALE)
  if (!prodAttrs) {
    console.log(`Prod has no partner data for locale=${LOCALE}. Nothing to do.`)
    return
  }

  const payload = {}
  const unmatched = []
  for (const section of SECTIONS) {
    const items = prodAttrs[section] || []
    const ids = []
    for (const it of items) {
      const id = matchProdToLocal(it, index)
      if (id) {
        if (!ids.includes(id)) ids.push(id)
      } else {
        unmatched.push({ section, link: it.link, image: it?.image?.data?.attributes?.url })
      }
    }
    payload[section] = ids
    console.log(`  ${section}: ${ids.length} / ${items.length} matched (ids: ${ids.join(', ')})`)
  }

  if (unmatched.length) {
    console.log('\nUNMATCHED:')
    for (const u of unmatched) console.log(`  [${u.section}] link=${u.link} img=${u.image}`)
  }

  if (DRY_RUN) {
    console.log('\nDRY RUN — not writing.')
    return
  }

  const result = await updateLocalPartnerPage(LOCALE, payload)
  console.log('\nUpdated local Partneři singleType. Section sizes after update:')
  for (const section of SECTIONS) {
    const arr = result?.data?.attributes?.[section]
    console.log(`  ${section}: ${Array.isArray(arr) ? arr.length : '?'}`)
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
