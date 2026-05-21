/* eslint-disable no-console */
/**
 * Fills the new `partnersFooter` relation on the local `global` singleType,
 * matching prod's old `logoPartners` media list (by image URL) to local
 * festival-partner records.
 *
 * Usage:
 *   LOCAL_STRAPI_URL=http://localhost:1333
 *   LOCAL_STRAPI_TOKEN=<full-access token>
 *   node strapi/scripts/link-global-partners-footer.js
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

function basenameFromImageUrl(url) {
  if (!url) return null
  return url.split('/').pop()
}

function stripStrapiHash(basename) {
  if (!basename) return null
  return basename.replace(/_[a-f0-9]{8,}\./, '.')
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

// Manual mapping for prod-footer-only image filenames that don't fuzzy-match
// any local partner (e.g. the footer carries an entirely different file).
const MANUAL_IMAGE_TO_NAME = {
  krizakovi: 'pekarstvikrizak',
  krizakovilogo: 'pekarstvikrizak',
  nextbike: 'nextbikeczech',
  lok_lok: 'loklok',
  loklok: 'loklok',
}

function normaliseStem(stem) {
  return stem
    .toLowerCase()
    .replace(/_web$/, '')
    .replace(/[_\-\s]/g, '')
}

function buildImageIndex(localPartners) {
  const byImage = new Map()
  const byStem = new Map() // normalised stem -> id
  const byName = new Map()
  for (const p of localPartners) {
    const imgUrl = p.attributes.logo?.data?.attributes?.url
    if (imgUrl) {
      byImage.set(imgUrl, p.id)
      const basename = basenameFromImageUrl(imgUrl)
      if (basename) {
        byImage.set(basename, p.id)
        const stripped = stripStrapiHash(basename)
        if (stripped && stripped !== basename) byImage.set(stripped, p.id)
        const stem = basename.replace(/_[a-f0-9]{8,}\..+$/, '')
        if (stem) {
          byStem.set(normaliseStem(stem), p.id)
        }
      }
    }
    const name = p.attributes.name
    if (name) {
      byName.set(name.toLowerCase(), p.id)
      byName.set(normaliseStem(name), p.id)
    }
  }
  return { byImage, byStem, byName }
}

function matchImage(prodUrl, idx) {
  if (!prodUrl) return null
  if (idx.byImage.has(prodUrl)) return idx.byImage.get(prodUrl)
  const basename = basenameFromImageUrl(prodUrl)
  if (basename && idx.byImage.has(basename)) return idx.byImage.get(basename)
  if (basename) {
    const stripped = stripStrapiHash(basename)
    if (idx.byImage.has(stripped)) return idx.byImage.get(stripped)
    const stem = basename.replace(/_[a-f0-9]{8,}\..+$/, '')
    if (stem) {
      const normStem = normaliseStem(stem)
      if (idx.byStem.has(normStem)) return idx.byStem.get(normStem)
      if (idx.byName.has(normStem)) return idx.byName.get(normStem)
      const manualName = MANUAL_IMAGE_TO_NAME[normStem]
      if (manualName) {
        if (idx.byName.has(manualName)) return idx.byName.get(manualName)
        if (idx.byName.has(normaliseStem(manualName))) return idx.byName.get(normaliseStem(manualName))
      }
    }
  }
  return null
}

async function fetchProdLogoPartners(locale) {
  const res = await httpJson('POST', PROD_GRAPHQL, {
    query: `query($locale: I18NLocaleCode!) {
      global(locale: $locale) {
        data { attributes { logoPartners { data { attributes { url } } } } }
      }
    }`,
    variables: { locale },
  })
  if (res.errors) throw new Error('GraphQL errors: ' + JSON.stringify(res.errors))
  return res.data?.global?.data?.attributes?.logoPartners?.data || []
}

;(async () => {
  console.log('Source:', PROD_GRAPHQL, 'locale=', LOCALE)
  console.log('Target:', LOCAL_URL, DRY_RUN ? '(DRY RUN)' : '')

  const localPartners = await fetchAllLocalPartners()
  console.log(`Local catalog: ${localPartners.length} festival-partner records.`)
  const idx = buildImageIndex(localPartners)

  const prodLogos = await fetchProdLogoPartners(LOCALE)
  console.log(`Prod logoPartners (${LOCALE}): ${prodLogos.length}`)

  const ids = []
  const unmatched = []
  for (const file of prodLogos) {
    const url = file?.attributes?.url
    const id = matchImage(url, idx)
    if (id) {
      if (!ids.includes(id)) ids.push(id)
    } else {
      unmatched.push(url)
    }
  }

  console.log(`Matched: ${ids.length} / ${prodLogos.length}  ids=${ids.join(', ')}`)
  if (unmatched.length) {
    console.log('UNMATCHED:')
    for (const u of unmatched) console.log('  ' + u)
  }

  if (DRY_RUN) {
    console.log('\nDRY RUN — not writing.')
    return
  }

  const res = await httpJson(
    'PUT',
    `${LOCAL_URL}/api/global?locale=${encodeURIComponent(LOCALE)}`,
    { data: { partnersFooter: ids } },
    { authorization: `Bearer ${TOKEN}` },
  )

  // verify
  const verify = await httpJson(
    'GET',
    `${LOCAL_URL}/api/global?locale=${encodeURIComponent(LOCALE)}&populate[partnersFooter]=true`,
    null,
    { authorization: `Bearer ${TOKEN}` },
  )
  const after = verify.data?.attributes?.partnersFooter?.data?.length
  console.log(`\nUpdated. global.partnersFooter now has ${after} relations.`)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
