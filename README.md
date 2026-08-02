# Pikus Squeeze (Netlify edition)

A real link shortener on your own domain — unlimited, free, and with a true
instant redirect (no in-between page, no flash) because a serverless
function handles it before any HTML ever loads.

## How it works
- `index.html` — the shortening tool.
- `netlify/functions/create.js` — creates a new short code and stores the
  mapping in Netlify Blobs (Netlify's built-in key-value store — no
  external database needed).
- `netlify/functions/redirect.js` — looks up a code and responds with a
  real HTTP 301 redirect. The browser never renders a page in between.
- `netlify.toml` — routes any URL that isn't a real file (i.e. a short
  code) to the redirect function.

## Deploy

### 1. Push these files to GitHub
Add `index.html`, `netlify.toml`, `package.json`, and the `netlify/functions/`
folder to your repo (replacing the old GitHub-Pages version).

### 2. Create a Netlify site from that repo
1. Go to **app.netlify.com** → **Add new site → Import an existing project**
2. Connect GitHub, pick your repo
3. Build settings can stay at their defaults — click **Deploy**

### 3. Set your passphrase
1. In your new Netlify site, go to **Site configuration → Environment variables**
2. Add a variable: key `SHORTEN_SECRET`, value = any password you choose
3. Redeploy (Deploys tab → **Trigger deploy**) so the function picks it up

### 4. Connect the site
Open your live Netlify URL, click the ⚙ icon, paste the same passphrase you
set in step 3, and **Save**.

### 5. Shorten away
Paste a link, hit Shorten. You'll get back something like:
```
https://your-site-name.netlify.app/a1b2c3
```
Click it — it redirects immediately, no visible middle step.

## Custom domain (optional)
Netlify lets you attach your own domain for free under **Domain management**
in site settings — then your links look like `https://yourdomain.com/a1b2c3`.

## Notes
- History shown on the page is a local convenience list in your browser;
  the real links live in Netlify Blobs.
- The passphrase only gates *creating* new links — anyone can still click
  and follow a link you've already made, same as any shortener.
- Free Netlify accounts include a generous serverless function and Blobs
  allowance, more than enough for personal daily use.
