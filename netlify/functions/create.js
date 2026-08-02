import { getStore, connectLambda } from '@netlify/blobs';

function randCode(len = 6) {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export const handler = async (event) => {
  try {
    connectLambda(event);

    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const secret = process.env.SHORTEN_SECRET;
    const provided = event.headers['x-shorten-secret'] || event.headers['X-Shorten-Secret'];
    if (secret && provided !== secret) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Wrong passphrase' }) };
    }

    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
    }

    const longUrl = (body.url || '').trim();
    if (!longUrl || !/^https?:\/\//i.test(longUrl)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Please provide a valid http(s) URL' }) };
    }

    const store = getStore({ name: 'links', consistency: 'strong' });

    // Generate a code, retrying on the rare collision.
    let code;
    for (let i = 0; i < 5; i++) {
      const candidate = randCode();
      const existing = await store.get(candidate);
      if (!existing) { code = candidate; break; }
    }
    if (!code) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Could not generate a unique code, try again' }) };
    }

    await store.set(code, JSON.stringify({ url: longUrl, created: Date.now() }));

    const proto = event.headers['x-forwarded-proto'] || 'https';
    const host = event.headers['host'];
    const shortUrl = `${proto}://${host}/${code}`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, shortUrl })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server error: ' + (err && err.message ? err.message : String(err)) })
    };
  }
};
