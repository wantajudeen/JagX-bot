function getContentType(message) {
  if (!message) return null;
  const keys = Object.keys(message);
  return keys.find((k) => k.endsWith('Message') || k === 'conversation') || keys[0];
}

function extractText(message) {
  if (!message) return '';
  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    message.buttonsResponseMessage?.selectedButtonId ||
    message.listResponseMessage?.singleSelectReply?.selectedRowId ||
    ''
  );
}

/**
 * Turns a raw Baileys upsert message into a friendlier "ctx" object
 * that plugins can work with.
 */
function serialize(msg, sock) {
  const message = msg.message?.ephemeralMessage?.message || msg.message;
  const type = getContentType(message);
  const from = msg.key.remoteJid;
  const isGroup = from?.endsWith('@g.us');
  const sender = isGroup ? (msg.key.participant || msg.participant) : from;
  const text = extractText(message);

  const quoted = message?.[type]?.contextInfo?.quotedMessage || null;
  const quotedType = quoted ? getContentType(quoted) : null;

  return {
    raw: msg,
    sock,
    key: msg.key,
    id: msg.key.id,
    from,
    isGroup,
    sender,
    pushName: msg.pushName || 'Unknown',
    type,
    text: text.trim(),
    message,
    quoted: quoted
      ? {
          message: quoted,
          type: quotedType,
          key: {
            remoteJid: from,
            id: message[type].contextInfo.stanzaId,
            participant: message[type].contextInfo.participant,
            fromMe: message[type].contextInfo.participant === sock.user.id
          }
        }
      : null,
    reply: (content) => sock.sendMessage(from, typeof content === 'string' ? { text: content } : content, { quoted: msg })
  };
}

module.exports = { serialize, getContentType, extractText };
