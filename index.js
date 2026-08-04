require('dotenv').config();
const {
  default: makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const chalk = require('chalk');
const path = require('path');
const express = require('express');

const { connectDB } = require('./lib/database');
const { useMongoAuthState } = require('./lib/mongoAuthState');
const { loadPlugins } = require('./lib/pluginLoader');
const { handleMessagesUpsert } = require('./lib/messageHandler');
const { followChannel } = require('./lib/channel');

const logger = pino({ level: 'silent' });
let commands = loadPlugins();
let sock;
let pairingCodeRequested = false;
let latestPairingCode = null;

// ---- Small web server: health check + a page to view the pairing code ----
const app = express();
app.get('/', (req, res) => {
  res.send(`
    <html><body style="font-family:sans-serif;text-align:center;margin-top:60px">
      <img src="/logo.jpg" width="120" style="border-radius:20px"/>
      <h2>${process.env.BOT_NAME || 'JagX'} Bot</h2>
      <p>Status: ${sock?.user ? '🟢 Connected as ' + sock.user.id.split(':')[0] : '🟡 Waiting for pairing...'}</p>
      ${latestPairingCode ? `<h1 style="letter-spacing:4px">${latestPairingCode}</h1><p>Enter this code in WhatsApp &gt; Linked Devices &gt; Link with phone number</p>` : ''}
    </body></html>
  `);
});
app.use('/logo.jpg', express.static(path.join(__dirname, 'assets', 'logo.jpg')));
app.get('/health', (req, res) => res.json({ ok: true, connected: !!sock?.user }));

async function startBot() {
  await connectDB();
  const { state, saveCreds } = await useMongoAuthState();
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    browser: ['JagX Bot', 'Chrome', '1.0.0']
  });

  // Request an 8-digit pairing code if we're not registered yet.
  if (!sock.authState?.creds?.registered && !pairingCodeRequested && process.env.BOT_NUMBER) {
    pairingCodeRequested = true;
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(process.env.BOT_NUMBER.replace(/\D/g, ''));
        latestPairingCode = code?.match(/.{1,4}/g)?.join('-') || code;
        console.log(chalk.yellow(`\n[PAIRING] Your pairing code: ${latestPairingCode}`));
        console.log(chalk.yellow(`[PAIRING] Also visible at your web URL (PUBLIC_URL) if the server is deployed.\n`));
      } catch (e) {
        console.log(chalk.red('[PAIRING] Failed to request pairing code:'), e.message);
      }
    }, 3000);
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
      latestPairingCode = null;
      console.log(chalk.green(`[CONNECTED] Logged in as ${sock.user.id}`));
      await followChannel(sock);
      await sendSuccessMessage();
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;
      console.log(chalk.red(`[DISCONNECTED] code=${statusCode} loggedOut=${loggedOut}`));
      if (!loggedOut) {
        startBot(); // auto-reconnect, e.g. after Render restarts the dyno or network drops
      } else {
        console.log(chalk.red('[LOGGED OUT] Session invalidated. Delete Mongo auth docs and re-pair.'));
      }
    }
  });

  sock.ev.on('messages.upsert', (m) => handleMessagesUpsert(m, sock, commands));

  sock.ev.on('group-participants.update', async (update) => {
    try {
      const { GroupConfigModel } = require('./lib/database');
      const cfg = await GroupConfigModel.findById(update.id).lean();
      if (!cfg?.welcome) return;
      for (const participant of update.participants) {
        const mention = `@${participant.split('@')[0]}`;
        if (update.action === 'add') {
          const text = (cfg.welcomeText || '👋 Welcome @user!').replace('@user', mention);
          await sock.sendMessage(update.id, { text, mentions: [participant] });
        } else if (update.action === 'remove') {
          const text = (cfg.goodbyeText || '👋 @user left.').replace('@user', mention);
          await sock.sendMessage(update.id, { text, mentions: [participant] });
        }
      }
    } catch (e) {
      console.log('[WELCOME] error:', e.message);
    }
  });
}

async function sendSuccessMessage() {
  try {
    const fs = require('fs');
    const logoPath = path.join(__dirname, 'assets', 'logo.jpg');
    const owner = (process.env.OWNER_NUMBERS || '').split(',')[0];
    const target = owner ? `${owner}@s.whatsapp.net` : sock.user.id;
    const prefix = process.env.PREFIX || '.';

    const text =
      `✅ *${process.env.BOT_NAME || 'JagX'} BOT CONNECTED SUCCESSFULLY* ✅\n\n` +
      `Your bot is now online and running 24/7. 🎉\n\n` +
      `🔹 *Bot Number:* ${sock.user.id.split(':')[0]}\n` +
      `🔹 *Prefix:* ${prefix}\n` +
      `🔹 *Commands loaded:* ${new Set(commands.values()).size}\n` +
      `🔹 *Session storage:* MongoDB (survives restarts)\n\n` +
      `*Highlighted features:*\n` +
      `👁️ ${prefix}vv - reveal & resend view-once photos/videos/voice notes\n` +
      `🗑️ Anti-delete - automatically reposts deleted messages\n` +
      `🎨 ${prefix}sticker - image/video to sticker\n` +
      `⬇️ ${prefix}ytmp3 / ${prefix}ytmp4 / ${prefix}tiktok - media downloader\n` +
      `👥 ${prefix}kick / ${prefix}promote / ${prefix}tagall - group management\n` +
      `⚠️ ${prefix}warn / ${prefix}antibadword / ${prefix}poll - moderation\n` +
      `🎮 ${prefix}truth / ${prefix}dare / ${prefix}8ball - fun & games\n` +
      `💰 ${prefix}daily / ${prefix}work / ${prefix}gamble - virtual economy\n` +
      `🖼️ ${prefix}blur / ${prefix}grayscale / ${prefix}resize - image effects\n` +
      `🔍 ${prefix}wiki / ${prefix}urban / ${prefix}lyrics - search tools\n` +
      `⏰ ${prefix}remind / ${prefix}note - reminders & notes\n` +
      `🛠️ ${prefix}translate / ${prefix}calc / ${prefix}qrcode - tools\n\n` +
      `📢 Our channel: ${process.env.CHANNEL_LINK || '(not configured)'}\n\n` +
      `Type *${prefix}menu* to see the full command list.\n\n` +
      `— Powered by JagX`;

    if (fs.existsSync(logoPath)) {
      await sock.sendMessage(target, { image: fs.readFileSync(logoPath), caption: text });
    } else {
      await sock.sendMessage(target, { text });
    }
  } catch (e) {
    console.log(chalk.red('[SUCCESS MSG] failed to send:'), e.message);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(chalk.blue(`[WEB] Pairing/health server running on port ${PORT}`)));

startBot().catch((err) => {
  console.error(chalk.red('[FATAL]'), err);
  process.exit(1);
});
