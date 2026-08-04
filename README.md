# JagX WhatsApp Bot

A 24/7 WhatsApp bot built on [Baileys](https://github.com/WhiskeySockets/Baileys), connected via an
**8-digit pairing code**, with session data stored in **MongoDB** so it survives restarts/redeploys.

Currently ships with **92 commands** across 17 categories (core, info, anti-delete, group, moderation,
sticker, media, text, downloader, search, fun, economy, reminder, tools, ai, status, owner) — including
anti-delete, `.vv` (view-once revealer), a virtual economy, image effects, and a warning system.

Some commands need a free API key to unlock (all optional, bot works fine without them):
- `.weather` → `OPENWEATHER_API_KEY` (openweathermap.org)
- `.movie` → `OMDB_API_KEY` (omdbapi.com)
- `.ai` → `OPENAI_API_KEY` (platform.openai.com)

Add whichever ones you want to your `.env` / Render environment variables.

## 1. Local setup

```bash
npm install
cp .env.example .env
# edit .env: set MONGODB_URI, BOT_NUMBER, OWNER_NUMBERS
npm start
```

On first run, the bot requests a pairing code. You'll see it printed in the terminal, e.g. `ABCD-1234`.
Open WhatsApp on the number in `BOT_NUMBER` → **Settings → Linked Devices → Link a Device → Link with
phone number instead** → enter the code.

You can also open `http://localhost:3000` to see the code on a simple web page (useful once deployed).

## 2. MongoDB Atlas (free tier is enough)

1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Create a database user + allow network access from anywhere (0.0.0.0/0) for Render.
3. Copy the connection string into `MONGODB_URI` in your `.env`.

This is what makes the bot **not need to re-scan/re-pair every time it restarts** — Render can restart
your service (deploys, sleep/wake, crashes) and the session is reloaded straight from Mongo.

## 3. Deploy to Render

1. Push this project to a GitHub repo.
2. On Render: **New → Web Service** → connect the repo.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add the environment variables from `.env.example` in Render's dashboard (Environment tab).
6. Deploy. Once live, visit your Render URL to grab the pairing code and link your number.
7. Use Render's **free health check** against `/health` and consider a paid instance (or an uptime
   pinger hitting `/health` every few minutes) so the service doesn't spin down — free-tier services
   sleep after inactivity, which would disconnect the bot.

## 4. Adding more commands

Drop a new file in `plugins/<category>/`, exporting one command object or an array of them:

```js
module.exports = {
  pattern: 'hello',
  category: 'fun',
  desc: 'Say hello',
  run: async (ctx) => ctx.reply('👋 Hello!')
};
```

The loader picks it up automatically on the next restart — no other wiring needed. This is how we'll
grow from 58 → 150 features: keep adding plugin files in small batches so each one stays easy to test.

## 5. Good to know

- **Unofficial API**: Baileys connects the same way WhatsApp Web does, but it isn't WhatsApp's official
  Business API. Automating a personal number this way is against WhatsApp's Terms of Service and the
  number can get banned/rate-limited, especially with heavy group management or broadcast use. Consider
  a dedicated number rather than your main one, and go easy on `.broadcast`/mass messaging.
- **Anti-delete & `.vv`**: these re-show content the sender tried to remove or intended to disappear.
  Use them thoughtfully in chats/groups where people are aware the bot is present — it's a meaningful
  privacy trade-off for anyone in that chat, not just you.
- **Website**: `index.js` already serves a minimal pairing page (`/`) showing bot status and the current
  pairing code — good enough for a single self-hosted bot. If you want a multi-tenant site where *other
  people* connect their own numbers to their own bot instance, that's a bigger project (needs per-user
  sessions/instances) — happy to help design that next once this core is solid.

## 6. Command list

Run `.menu` in WhatsApp any time to see the live, categorized list.
