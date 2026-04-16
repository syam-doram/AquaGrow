/**
 * apply-cors.mjs — AquaGrow Firebase Storage CORS Configurator
 * Run: node apply-cors.mjs
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { createSign } from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Try both bucket name formats ─────────────────────────────────────────────
const PROJECT_ID = 'aquagrow-37a3e';
const BUCKETS_TO_TRY = [
  `${PROJECT_ID}.appspot.com`,              // legacy (most common in GCS API)
  `${PROJECT_ID}.firebasestorage.app`,      // new format
];

const CORS_CONFIG = [
  {
    origin: [
      'https://aqua-grow.vercel.app',
      'http://localhost:3000',
      'http://localhost:5173',
      'capacitor://localhost',
      'https://localhost',
    ],
    method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    maxAgeSeconds: 3600,
    responseHeader: [
      'Content-Type',
      'Authorization',
      'Content-Length',
      'x-goog-resumable',
    ],
  },
];

console.log('\n🔧  AquaGrow — Firebase Storage CORS Configurator\n');

// ─── Find service account ──────────────────────────────────────────────────────
const candidates = [
  path.join(__dirname, 'serviceAccountKey.json'),
  path.join(__dirname, 'server', 'serviceAccountKey.json'),
  process.env.GOOGLE_APPLICATION_CREDENTIALS,
].filter(Boolean);

let serviceAccount;
for (const p of candidates) {
  if (p && fs.existsSync(p)) {
    try {
      serviceAccount = JSON.parse(fs.readFileSync(p, 'utf-8'));
      console.log(`✅  Service account: ${serviceAccount.client_email}`);
      console.log(`    File: ${p}\n`);
      break;
    } catch {}
  }
}

if (!serviceAccount) {
  console.error(`❌  No service account key found!
  → Firebase Console → Project Settings → Service Accounts
  → "Generate new private key" → save as serviceAccountKey.json in project root
  → Run: node apply-cors.mjs`);
  process.exit(1);
}

// ─── JWT + Token ───────────────────────────────────────────────────────────────
function makeJWT(sa) {
  const now = Math.floor(Date.now() / 1000);
  const h = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/devstorage.full_control',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  })).toString('base64url');
  const unsigned = `${h}.${p}`;
  const sign = createSign('RSA-SHA256');
  sign.update(unsigned);
  return `${unsigned}.${sign.sign(sa.private_key, 'base64url')}`;
}

function post(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path, method: 'POST', headers }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

function patch(token, bucket, cors) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ cors });
    const bucketEncoded = encodeURIComponent(bucket);
    const req = https.request({
      hostname: 'storage.googleapis.com',
      path: `/storage/v1/b/${bucketEncoded}?fields=name,cors`,
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

// ─── Main ──────────────────────────────────────────────────────────────────────
console.log('🔑  Getting access token...');
const jwtToken = makeJWT(serviceAccount);
const tokenBody = new URLSearchParams({
  grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
  assertion: jwtToken,
}).toString();

const tokenResp = await post(
  'oauth2.googleapis.com',
  '/token',
  { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': tokenBody.length },
  tokenBody,
);

if (!tokenResp.body.access_token) {
  console.error('❌  Failed to get access token:', JSON.stringify(tokenResp.body, null, 2));
  process.exit(1);
}
const accessToken = tokenResp.body.access_token;
console.log('✅  Access token obtained.\n');

// Try each bucket name
let success = false;
for (const bucket of BUCKETS_TO_TRY) {
  console.log(`📡  Trying bucket: ${bucket}`);
  const result = await patch(accessToken, bucket, CORS_CONFIG);
  if (result.status >= 200 && result.status < 300) {
    const parsed = JSON.parse(result.body);
    console.log(`\n✅  CORS applied to bucket: ${parsed.name}`);
    console.log(`   Origins: ${CORS_CONFIG[0].origin.join(', ')}`);
    console.log('\n🚀  Photo uploads from aqua-grow.vercel.app will now work!\n');
    success = true;
    break;
  } else {
    const err = JSON.parse(result.body);
    console.log(`   ⚠️  HTTP ${result.status}: ${err?.error?.message || result.body}`);
  }
}

if (!success) {
  console.error(`
❌  Could not find the storage bucket.

Your Firebase Storage may not be initialized yet.
→ Go to Firebase Console → Storage → click "Get Started"
→ Choose a region → Done
→ Then run: node apply-cors.mjs again
`);
  process.exit(1);
}
