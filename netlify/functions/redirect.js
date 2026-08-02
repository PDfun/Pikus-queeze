import { getStore, connectLambda } from '@netlify/blobs';

export const handler = async (event) => {
  try {
    connectLambda(event);

    // event.path looks like /.netlify/functions/redirect/jxybay
    const parts = event.path.split('/').filter(Boolean);
    const code = parts[parts.length - 1];

    if (!code || code === 'redirect') {
      return { statusCode: 404, body: 'No short code given.' };
    }

    const store = getStore('links');

    // A link created a split second ago may not be visible yet under
    // default (eventual) consistency. A couple of quick retries covers
    // that gap without needing the "strong" consistency mode, which
    // isn't available in this function's execution context.
    let raw = null;
    for (let i = 0; i < 4; i++) {
      raw = await store.get(code);
      if (raw) break;
      await new Promise((r) => setTimeout(r, 250));
    }

    if (!raw) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/html' },
        body: `<!DOCTYPE html><html><body style="background:#15171A;color:#8A8D85;font-family:monospace;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;"><p>This link doesn't exist.</p></body></html>`
      };
    }

    let dest;
    try {
      dest = JSON.parse(raw).url;
    } catch (e) {
      dest = raw; // fallback if it was ever stored as a plain string
    }

    return {
      statusCode: 301,
      headers: { Location: dest, 'Cache-Control': 'no-store' }
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Server error: ' + (err && err.message ? err.message : String(err))
    };
  }
};
