const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { CacheModel } = require('./database');

// In-memory cache of decrypted view-once media buffers, mirrored to Mongo
// as base64 so it survives restarts within the TTL window.
const store = new Map();

function unwrapViewOnce(message) {
  const vo =
    message.viewOnceMessage?.message ||
    message.viewOnceMessageV2?.message ||
    message.viewOnceMessageV2Extension?.message ||
    null;
  if (!vo) return null;
  const kind = Object.keys(vo)[0]; // imageMessage | videoMessage | audioMessage
  return { kind, content: vo[kind] };
}

/**
 * Call from 'messages.upsert' for every incoming message. If it's a
 * view-once, silently decrypt + cache it (does NOT mark it as viewed).
 */
async function cacheIfViewOnce(msg, sock) {
  const unwrapped = unwrapViewOnce(msg.message || {});
  if (!unwrapped) return;

  try {
    const buffer = await downloadMediaMessage(
      { key: msg.key, message: { [unwrapped.kind]: unwrapped.content } },
      'buffer',
      {}
    );
    const key = `${msg.key.remoteJid}::${msg.key.id}`;
    const entry = { kind: unwrapped.kind, buffer, caption: unwrapped.content.caption || '' };
    store.set(key, entry);

    await CacheModel.findByIdAndUpdate(
      key,
      {
        _id: key,
        type: 'viewonce',
        chatId: msg.key.remoteJid,
        sender: msg.key.participant || msg.key.remoteJid,
        payload: JSON.stringify({ kind: entry.kind, caption: entry.caption, base64: buffer.toString('base64') })
      },
      { upsert: true }
    );
  } catch (e) {
    console.log('[VIEWONCE] cache failed:', e.message);
  }
}

/**
 * Resolves the buffer for a given quoted view-once message key, checking
 * memory first then falling back to Mongo.
 */
async function getViewOnce(remoteJid, id) {
  const key = `${remoteJid}::${id}`;
  if (store.has(key)) return store.get(key);
  const doc = await CacheModel.findById(key).lean();
  if (!doc || doc.type !== 'viewonce') return null;
  const parsed = JSON.parse(doc.payload);
  return { kind: parsed.kind, caption: parsed.caption, buffer: Buffer.from(parsed.base64, 'base64') };
}

module.exports = { cacheIfViewOnce, getViewOnce, unwrapViewOnce };
