const { CacheModel } = require('./database');
const { serialize } = require('./serialize');

// In-memory cache for speed; every entry is mirrored to MongoDB (with a 2-day
// TTL, see database.js) so a restart doesn't wipe out very recent messages.
const store = new Map();

function cacheKey(remoteJid, id) {
  return `${remoteJid}::${id}`;
}

async function cacheMessage(msg) {
  if (!msg.message || msg.key.fromMe) return; // don't bother caching our own messages
  const k = cacheKey(msg.key.remoteJid, msg.key.id);
  store.set(k, msg);
  try {
    await CacheModel.findByIdAndUpdate(
      k,
      {
        _id: k,
        type: 'antidelete',
        chatId: msg.key.remoteJid,
        sender: msg.key.participant || msg.key.remoteJid,
        payload: JSON.stringify(msg)
      },
      { upsert: true }
    );
  } catch (e) {
    /* non-fatal */
  }
}

async function getCached(remoteJid, id) {
  const k = cacheKey(remoteJid, id);
  if (store.has(k)) return store.get(k);
  const doc = await CacheModel.findById(k).lean();
  if (!doc) return null;
  return JSON.parse(doc.payload);
}

/**
 * Call this from the 'messages.upsert' handler for every incoming message
 * (before running commands) so we have a copy in case it gets deleted later.
 */
async function handleUpsertForAntiDelete(msg) {
  await cacheMessage(msg);
}

/**
 * Call this from the 'messages.upsert' handler whenever a protocolMessage
 * of type REVOKE comes through - that's WhatsApp's "delete for everyone" event.
 */
async function handleRevoke(sock, revokeMsg) {
  const stanzaId = revokeMsg.message?.protocolMessage?.key?.id;
  const chatId = revokeMsg.key.remoteJid;
  if (!stanzaId) return;

  const original = await getCached(chatId, stanzaId);
  if (!original) return;

  const ctx = serialize(original, sock);
  const deleterJid = revokeMsg.key.participant || revokeMsg.key.remoteJid;

  const header =
    `🗑️ *Anti-Delete*\n` +
    `👤 Sender: @${ctx.sender.split('@')[0]}\n` +
    `🚮 Deleted by: @${deleterJid.split('@')[0]}\n` +
    `💬 Chat: ${ctx.isGroup ? 'Group' : 'Private'}\n` +
    (ctx.text ? `\n📝 *Content:*\n${ctx.text}` : '');

  try {
    await sock.sendMessage(chatId, {
      text: header,
      mentions: [ctx.sender, deleterJid]
    });
    // If it was media, re-send the media itself too.
    if (ctx.type && ctx.type !== 'conversation' && ctx.type !== 'extendedTextMessage') {
      await sock.sendMessage(chatId, { forward: original });
    }
  } catch (e) {
    console.log('[ANTIDELETE] failed to resend:', e.message);
  }
}

module.exports = { handleUpsertForAntiDelete, handleRevoke };
