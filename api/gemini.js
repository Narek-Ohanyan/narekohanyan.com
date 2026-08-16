/* Vercel serverless adapter. Deployed automatically at /api/gemini. */
const { handle, ALLOWED } = require('./_gemini-core.js');

module.exports = async function (req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  let raw = '';
  if (req.method === 'POST') {
    raw = await new Promise(resolve => {
      let b = ''; req.on('data', c => { b += c; }); req.on('end', () => resolve(b));
    });
  }

  const { status, body } = await handle({
    method: req.method,
    headers: { origin, referer: req.headers.referer || '' },
    rawBody: raw,
    ip: (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
  });

  res.status(status);
  if (body === null) return res.end();
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};
