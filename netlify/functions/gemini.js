/* Netlify Functions adapter. netlify.toml maps /api/gemini to this. */
const { handle, ALLOWED } = require('../../api/_gemini-core.js');

exports.handler = async function (event) {
  const origin = event.headers.origin || '';
  const cors = { 'Access-Control-Allow-Methods': 'POST, OPTIONS',
                 'Access-Control-Allow-Headers': 'Content-Type' };
  if (ALLOWED.includes(origin)) { cors['Access-Control-Allow-Origin'] = origin; cors.Vary = 'Origin'; }

  const { status, body } = await handle({
    method: event.httpMethod,
    headers: { origin, referer: event.headers.referer || '' },
    rawBody: event.body,
    ip: event.headers['x-nf-client-connection-ip'] ||
        (event.headers['x-forwarded-for'] || '').split(',')[0].trim()
  });

  return { statusCode: status,
           headers: { ...cors, 'Content-Type': 'application/json' },
           body: body === null ? '' : JSON.stringify(body) };
};
