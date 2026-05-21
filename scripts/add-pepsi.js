/* eslint-disable no-console */
const https = require('https')
const http = require('http')
const { URL } = require('url')

const LOCAL_URL = process.env.LOCAL_STRAPI_URL || 'http://localhost:1333'
const TOKEN = process.env.LOCAL_STRAPI_TOKEN
const SRC = 'https://burger-strapi.hardart.cz/uploads/Pepsi_web_400x400_bc246af3c9.png'

if (!TOKEN) {
  console.error('LOCAL_STRAPI_TOKEN required')
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
        headers: { 'content-type': 'application/json', ...(payload ? { 'content-length': payload.length } : {}), ...headers },
      },
      (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8')
          let parsed
          try { parsed = raw ? JSON.parse(raw) : null } catch { return reject(new Error(`Non-JSON from ${urlStr}: ${raw.slice(0,200)}`)) }
          if (res.statusCode >= 400) return reject(new Error(`${method} ${urlStr} -> ${res.statusCode}: ${JSON.stringify(parsed)}`))
          resolve(parsed)
        })
      },
    )
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`GET ${url} -> ${res.statusCode}`))
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
    }).on('error', reject)
  })
}

function upload(buffer, filename, mime) {
  const boundary = '----burger-import-' + Date.now()
  const head = `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${filename}"\r\nContent-Type: ${mime}\r\n\r\n`
  const tail = `\r\n--${boundary}--\r\n`
  const body = Buffer.concat([Buffer.from(head, 'utf8'), buffer, Buffer.from(tail, 'utf8')])
  return new Promise((resolve, reject) => {
    const u = new URL(LOCAL_URL + '/api/upload')
    const lib = u.protocol === 'https:' ? https : http
    const req = lib.request(
      { method: 'POST', hostname: u.hostname, port: u.port || 80, path: u.pathname, headers: { 'content-type': `multipart/form-data; boundary=${boundary}`, 'content-length': body.length, authorization: `Bearer ${TOKEN}` } },
      (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8')
          if (res.statusCode >= 400) return reject(new Error(`upload: ${raw}`))
          try { resolve(JSON.parse(raw)[0]) } catch (e) { reject(new Error(`upload bad json: ${raw}`)) }
        })
      },
    )
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

;(async () => {
  // First, delete the empty pepsi record (id 35) created in the previous bad attempt.
  console.log('Deleting empty pepsi record (id 35)...')
  try {
    await httpJson('DELETE', `${LOCAL_URL}/api/festival-partners/35`, null, { authorization: `Bearer ${TOKEN}` })
    console.log('Deleted.')
  } catch (e) {
    console.log('(could not delete 35, maybe already gone) ' + e.message)
  }

  console.log('Downloading Pepsi logo from prod...')
  const buf = await download(SRC)
  const uploaded = await upload(buf, 'Pepsi_web_400x400.png', 'image/png')
  console.log('Uploaded logo id:', uploaded.id)

  const res = await httpJson('POST', `${LOCAL_URL}/api/festival-partners`, {
    data: { name: 'pepsi', link: null, logo: uploaded.id, publishedAt: new Date().toISOString() },
  }, { authorization: `Bearer ${TOKEN}` })
  console.log('Created pepsi catalog record id:', res.data.id)
})().catch((e) => { console.error(e); process.exit(1) })
