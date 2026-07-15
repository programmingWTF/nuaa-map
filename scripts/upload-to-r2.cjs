#!/usr/bin/env node
"use strict";
/**
 * 批量上传建筑图片到 Cloudflare R2
 * 用法: node scripts/upload-to-r2.cjs
 */
const { readFileSync } = require('fs');
const { join, relative } = require('path');
const { readdir } = require('fs/promises');
const { createHash, createHmac } = require('crypto');

const ENDPOINT = 'https://dd4e32d8d75f86ffafa61a30836ab510.r2.cloudflarestorage.com';
const BUCKET = 'nuaamap-buildings';
const ACCESS_KEY = 'a4e2fee404a223e4526af0d432ac32d5';
const SECRET_KEY = 'c3b0726e2da5ed2f5720dc3c708c0bbc60c0ee8b80279c123e5f17b9c596bbbb';
const IMAGES_DIR = join(__dirname, '..', 'frontend', 'public', 'buildings');

function sha256(data) { return createHash('sha256').update(data).digest('hex'); }

function sign(key, msg) { return createHmac('sha256', key).update(msg).digest('hex'); }

function getSignatureKey(key, dateStamp, region) {
  const kDate = createHmac('sha256', 'AWS4' + key).update(dateStamp).digest();
  const kRegion = createHmac('sha256', kDate).update(region).digest();
  const kService = createHmac('sha256', kRegion).update('s3').digest();
  return createHmac('sha256', kService).update('aws4_request').digest();
}

async function uploadFile(filePath, objectKey) {
  const fileBuffer = readFileSync(filePath);
  const contentHash = sha256(fileBuffer);
  const ct = filePath.endsWith('.png') ? 'image/png' : filePath.endsWith('.webp') ? 'image/webp' : 'image/jpeg';

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const region = 'auto';
  const host = new URL(ENDPOINT).host;

  const canonicalReq = [
    'PUT', '/' + BUCKET + '/' + objectKey, '',
    'content-type:' + ct, 'host:' + host,
    'x-amz-content-sha256:' + contentHash, 'x-amz-date:' + amzDate,
    '', 'content-type;host;x-amz-content-sha256;x-amz-date', contentHash
  ].join('\n');

  const scope = dateStamp + '/' + region + '/s3/aws4_request';
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256(canonicalReq)].join('\n');
  const signingKey = getSignatureKey(SECRET_KEY, dateStamp, region);
  const signature = sign(signingKey, stringToSign);
  const auth = 'AWS4-HMAC-SHA256 Credential=' + ACCESS_KEY + '/' + scope + ', SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=' + signature;

  const resp = await fetch(ENDPOINT + '/' + BUCKET + '/' + objectKey, {
    method: 'PUT',
    headers: { 'Content-Type': ct, 'Host': host, 'x-amz-content-sha256': contentHash, 'x-amz-date': amzDate, 'Authorization': auth },
    body: fileBuffer,
  });
  return resp.status;
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const fp = join(dir, entry.name);
    if (entry.isDirectory()) { yield* walk(fp); }
    else if (/\.(jpg|jpeg|png|webp)$/i.test(entry.name)) { yield fp; }
  }
}

async function main() {
  console.log('源: ' + IMAGES_DIR);
  console.log('目标: ' + ENDPOINT + '/' + BUCKET + '/buildings/\n');
  let ok = 0, bad = 0;
  const errs = [];
  for await (const fp of walk(IMAGES_DIR)) {
    const key = 'buildings/' + relative(IMAGES_DIR, fp).replace(/\\/g, '/');
    try {
      const st = await uploadFile(fp, key);
      if (st === 200) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + key.replace('buildings/', '')); }
      else { bad++; console.log('  \x1b[31m✗\x1b[0m ' + key.replace('buildings/', '') + ' HTTP ' + st); errs.push(key); }
    } catch (e) { bad++; console.log('  \x1b[31m✗\x1b[0m ' + key + ' ' + e.message); errs.push(key); }
  }
  console.log('\n成功: ' + ok + '  失败: ' + bad);
  if (errs.length) { console.log('失败文件:'); errs.forEach(f => console.log('  - ' + f)); }
}

main().catch(e => { console.error(e); process.exit(1); });
