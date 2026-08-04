const { serialize } = require('./serialize');
const { handleUpsertForAntiDelete, handleRevoke } = require('./antidelete');
const { cacheIfViewOnce } = require('./viewonce');
const { GroupConfigModel } = require('./database');
const { greetFirstTimeChatter } = require('./channel');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const BAD_WORDS = ['badword1', 'badword2']; // extend this list as needed

async function handleAutoStatus(msg, sock) {
  if (!global.AUTO_STATUS || msg.key.remoteJid !== 'status@broadcast' || !msg.message) return;
  try {
    const owner = (process.env.OWNER_NUMBERS || '').split(',')[0];
    if (!owner) return;
    const type = Object.keys(msg.message)[0];
    if (type !== 'imageMessage' && type !== 'videoMessage') return;
    const buf = await downloadMediaMessage(msg, 'buffer', {});
    const caption = `📥 Status from @${(msg.key.participant || '').split('@')[0]}`;
    const target = `${owner}@s.whatsapp.net`;
    if (type === 'imageMessage') await sock.sendMessage(target, { image: buf, caption, mentions: [msg.key.participant] });
    else await sock.sendMessage(target, { video: buf, caption, mentions: [msg.key.participant] });
  } catch (e) {
    console.log('[AUTOSTATUS] failed:', e.message);
  }
}

async function handleAntiBadWord(ctx) {
  if (!ctx.isGroup || !ctx.text) return false;
  try {
    const cfg = await GroupConfigModel.findById(ctx.from).lean();
    if (!cfg?.antibadword) return false;
    const lower = ctx.text.toLowerCase();
    if (BAD_WORDS.some((w) => lower.includes(w))) {
      await ctx.sock.sendMessage(ctx.from, { delete: ctx.key });
      await ctx.reply(`🚫 @${ctx.sender.split('@')[0]}, that language isn't allowed here.`);
      return true;
    }
  } catch {}
  return false;
}

function isOwnerJid(jid) {
  const owners = (process.env.OWNER_NUMBERS || '').split(',').filter(Boolean).map((n) => `${n}@s.whatsapp.net`);
  return owners.includes(jid);
}

async function handleMessagesUpsert({ messages }, sock, commands) {
  for (const msg of messages) {
    if (!msg.message) continue;

    // Anti-delete: is this a "delete for everyone" event?
    if (msg.message.protocolMessage?.type === 0 /* REVOKE */) {
      await handleRevoke(sock, msg);
      continue;
    }

    // Cache every real message for potential future anti-delete lookup.
    await handleUpsertForAntiDelete(msg);
    // If it's a view-once, silently cache the decrypted media.
    await cacheIfViewOnce(msg, sock);
    // Optional: auto-save contacts' statuses to the owner's DM.
    await handleAutoStatus(msg, sock);

    if (msg.key.remoteJid === 'status@broadcast') continue;
    if (msg.key.fromMe) continue; // don't respond to our own messages (except via commands sent by owner from linked device, still fine)

    const ctx = serialize(msg, sock);
    ctx.commands = commands;

    if (await handleAntiBadWord(ctx)) continue;

    await greetFirstTimeChatter(ctx);

    const prefix = process.env.PREFIX || '.';
    if (!ctx.text.startsWith(prefix)) continue;

    const [cmdName, ...rest] = ctx.text.slice(prefix.length).trim().split(/\s+/);
    const plugin = commands.get(cmdName.toLowerCase());
    if (!plugin) continue;

    if (global.BOT_MODE === 'private' && !isOwnerJid(ctx.sender)) continue;
    if (plugin.groupOnly && !ctx.isGroup) {
      await ctx.reply('This command only works in groups.');
      continue;
    }
    if (plugin.ownerOnly && !isOwnerJid(ctx.sender)) {
      await ctx.reply('❌ This command is restricted to the bot owner.');
      continue;
    }

    try {
      await plugin.run(ctx, rest);
    } catch (err) {
      console.log(`[CMD:${cmdName}] error:`, err);
      await ctx.reply(`❌ Something went wrong running that command:\n${err.message}`);
    }
  }
}

module.exports = { handleMessagesUpsert };
