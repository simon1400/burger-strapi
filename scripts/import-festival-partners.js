/* eslint-disable no-console */
/**
 * One-off import script: pulls partner entries from prod GraphQL
 * (still using the OLD component-based schema), de-duplicates them by
 * full URL (sans trailing slash), and creates records in the new
 * `festival-partner` collection on the local Strapi.
 *
 * Usage:
 *   node strapi/scripts/import-festival-partners.js
 *
 * Required env:
 *   LOCAL_STRAPI_URL      e.g. http://localhost:1333
 *   LOCAL_STRAPI_TOKEN    Full-access API token from local Strapi admin
 *
 * Optional env:
 *   PROD_GRAPHQL_URL      defaults to https://burger-strapi.hardart.cz/graphql
 *   DRY_RUN=1             list what would be created without writing
 */

const https = require('https')
const http = require('http')
const { URL } = require('url')

const PROD_GRAPHQL = process.env.PROD_GRAPHQL_URL || 'https://burger-strapi.hardart.cz/graphql'
const LOCAL_URL = process.env.LOCAL_STRAPI_URL || 'http://localhost:1333'
const TOKEN = process.env.LOCAL_STRAPI_TOKEN
const DRY_RUN = process.env.DRY_RUN === '1'

if (!TOKEN && !DRY_RUN) {
  console.error('LOCAL_STRAPI_TOKEN env var is required (or set DRY_RUN=1).')
  process.exit(1)
}

const PROD_QUERY = `{
  partner(locale: "en") {
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
          } catch (e) {
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

function normaliseUrl(link) {
  if (!link) return null
  return link.trim().replace(/\/+$/, '')
}

function nameFromLink(link) {
  if (!link) return 'partner'
  try {
    const u = new URL(link)
    const host = u.hostname.replace(/^www\./, '')
    const second = host.split('.').slice(-2, -1)[0] || host
    return second
  } catch {
    return link.replace(/[^a-z0-9-]/gi, '_').slice(0, 60) || 'partner'
  }
}

async function fetchProdPartners() {
  const res = await httpJson('POST', PROD_GRAPHQL, { query: PROD_QUERY })
  if (res.errors) throw new Error('GraphQL errors: ' + JSON.stringify(res.errors))
  const attrs = res.data?.partner?.data?.attributes
  if (!attrs) throw new Error('No partner data on prod')
  const sections = ['topPartners', 'partners', 'supported', 'partners2']
  const all = []
  for (const section of sections) {
    const items = attrs[section] || []
    for (const it of items) {
      const url = it?.image?.data?.attributes?.url
      const link = it?.link
      if (!url) continue
      all.push({ url, link })
    }
  }
  return all
}

function dedupe(items) {
  const seen = new Map()
  for (const it of items) {
    const key = normaliseUrl(it.link) || `__img:${it.url}`
    if (!seen.has(key)) seen.set(key, it)
  }
  return [...seen.values()]
}

async function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const lib = u.protocol === 'https:' ? https : http
    lib.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`GET ${url} -> ${res.statusCode}`))
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
    }).on('error', reject)
  })
}

async function uploadLogo(buffer, filename, mime) {
  const boundary = '----burger-import-' + Date.now()
  const head =
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="files"; filename="${filename}"\r\n` +
    `Content-Type: ${mime}\r\n\r\n`
  const tail = `\r\n--${boundary}--\r\n`
  const body = Buffer.concat([Buffer.from(head, 'utf8'), buffer, Buffer.from(tail, 'utf8')])

  return new Promise((resolve, reject) => {
    const u = new URL(LOCAL_URL + '/api/upload')
    const lib = u.protocol === 'https:' ? https : http
    const req = lib.request(
      {
        method: 'POST',
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname,
        headers: {
          'content-type': `multipart/form-data; boundary=${boundary}`,
          'content-length': body.length,
          authorization: `Bearer ${TOKEN}`,
        },
      },
      (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8')
          if (res.statusCode >= 400) return reject(new Error(`upload ${filename}: ${raw}`))
          try {
            const parsed = JSON.parse(raw)
            resolve(parsed[0])
          } catch (e) {
            reject(new Error(`upload bad json: ${raw}`))
          }
        })
      },
    )
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

function mimeFromUrl(url) {
  const lower = url.toLowerCase()
  if (lower.endsWith('.svg')) return 'image/svg+xml'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.webp')) return 'image/webp'
  return 'application/octet-stream'
}

async function createPartner(name, link, logoId) {
  const body = {
    data: {
      name,
      link: link || null,
      logo: logoId,
      publishedAt: new Date().toISOString(),
    },
  }
  const res = await httpJson('POST', `${LOCAL_URL}/api/festival-partners`, body, {
    authorization: `Bearer ${TOKEN}`,
  })
  return res.data
}

;(async () => {
  console.log('Source:', PROD_GRAPHQL)
  console.log('Target:', LOCAL_URL, DRY_RUN ? '(DRY RUN)' : '')

  const raw = await fetchProdPartners()
  console.log(`Fetched ${raw.length} partner entries (incl. duplicates across sections).`)
  const unique = dedupe(raw)
  console.log(`After dedupe by URL: ${unique.length}`)

  const PROD_FILES_BASE = 'https://burger-strapi.hardart.cz'

  let ok = 0
  let fail = 0
  for (const item of unique) {
    const name = nameFromLink(item.link)
    const link = item.link && /^https?:\/\//.test(item.link) ? item.link : null
    console.log(`  → ${name}  link=${link || '(no url)'}  img=${item.url}`)
    if (DRY_RUN) {
      ok++
      continue
    }
    try {
      const fileUrl = PROD_FILES_BASE + item.url
      const buf = await downloadFile(fileUrl)
      const filename = item.url.split('/').pop()
      const uploaded = await uploadLogo(buf, filename, mimeFromUrl(item.url))
      await createPartner(name, link, uploaded.id)
      ok++
    } catch (e) {
      console.error(`    FAIL: ${e.message}`)
      fail++
    }
  }
  console.log(`\nDone. created=${ok} failed=${fail}`)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
