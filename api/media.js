// GET /api/media?s=<slug>&k=<token>&id=<media id>
// Film and photos live in a PRIVATE Cloudflare R2 bucket. Nothing in it has a public URL.
// This checks the recruit link, then redirects to a signed URL that expires in a few minutes
// and only points at that recruit's own folder (keys are <slug>/<file>). Forwarding the media
// URL to someone else gets them an expired link.
const { check } = require('../lib/recruits');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

let s3;
function client() {
  if (!s3) s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
  });
  return s3;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  const { s: slug, k: token, id } = req.query;
  const result = check(slug, token);
  if (!result.ok) return res.status(404).end();
  if (!/^[A-Za-z0-9._-]{1,120}$/.test(id || '')) return res.status(400).end();
  if (!process.env.R2_BUCKET) return res.status(503).end('media storage not configured');

  const Key = `${slug}/${id}`;
  try {
    const url = await getSignedUrl(client(), new GetObjectCommand({ Bucket: process.env.R2_BUCKET, Key }), { expiresIn: 600 });
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.status(302).setHeader('Location', url).end();
  } catch (e) {
    console.error('media sign failed', e && e.message);
    res.status(500).end();
  }
};
