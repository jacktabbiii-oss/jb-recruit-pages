#!/usr/bin/env node
// Upload a clip or photo into the recruit's private folder in R2 and print the id to put in the JSON.
//   node scripts/upload-media.js eli-finley ./clip1.mp4
//   node scripts/upload-media.js eli-finley ./photo.jpg --cutout   (removes the background first; needs `pip install rembg onnxruntime`)
// Needs R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET in the environment (.env works with `vercel env pull`).
const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const args = process.argv.slice(2); const cutout = args.includes('--cutout');
let [slug, file] = args.filter(a => a !== '--cutout');
if (cutout && file) { const { execFileSync } = require('child_process'); const out = file.replace(/\.[^.]+$/, '') + '-cutout.png';
  execFileSync('python3', ['-c', `from rembg import remove; from PIL import Image; Image.open(${JSON.stringify(file)}).convert('RGBA'); remove(Image.open(${JSON.stringify(file)})).save(${JSON.stringify(out)})`], { stdio: 'inherit' }); file = out; }
if (!slug || !file) { console.error('usage: upload-media.js <slug> <file>'); process.exit(1); }
const ext = path.extname(file).toLowerCase();
const type = { '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.m4v': 'video/mp4', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }[ext];
if (!type) { console.error('unsupported file type'); process.exit(1); }
const id = `${path.basename(file, ext).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${crypto.randomBytes(4).toString('hex')}${ext}`;
const s3 = new S3Client({ region: 'auto', endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } });
s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: `${slug}/${id}`, Body: fs.createReadStream(file), ContentType: type }))
  .then(() => console.log(`uploaded. In recruits/${slug}.json use:  "clip": "${id}"   (or "src": "${id}" for a photo${cutout ? ', with "cutout": true' : ''})`))
  .catch(e => { console.error(e.message); process.exit(1); });
