const { serialize } = require('./serialize');
const { handleUpsertForAntiDelete, handleRevoke } = require('./antidelete');
const { cacheIfViewOnce } = require('./viewonce');

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

    if (msg.key.fromMe) continue; // don't respond to our own messages (except via commands sent by owner from linked device, still fine)

    const ctx = serialize(msg, sock);
    ctx.commands = commands;

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
