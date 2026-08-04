const sharp = require('sharp');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

async function getTargetMedia(ctx, kind) {
  if (ctx.type === kind) return downloadMediaMessage({ key: ctx.key, message: ctx.message }, 'buffer', {});
  if (ctx.quoted?.type === kind) return downloadMediaMessage({ key: ctx.quoted.key, message: ctx.quoted.message }, 'buffer', {});
  return null;
}

module.exports = [
  {
    pattern: 'sticker',
    aliases: ['s'],
    category: 'sticker',
    desc: 'Convert a replied/sent image or short video into a sticker',
    run: async (ctx) => {
      const imgBuf = (await getTargetMedia(ctx, 'imageMessage')) || (await getTargetMedia(ctx, 'videoMessage'));
      if (!imgBuf) return ctx.reply('Send/reply to an image or short video with *.sticker*');
      const webp = await sharp(imgBuf).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp().toBuffer();
      await ctx.sock.sendMessage(ctx.from, { sticker: webp }, { quoted: ctx.raw });
    }
  },
  {
    pattern: 'toimg',
    category: 'sticker',
    desc: 'Convert a sticker back into an image: reply to a sticker with .toimg',
    run: async (ctx) => {
      const buf = await getTargetMedia(ctx, 'stickerMessage');
      if (!buf) return ctx.reply('Reply to a sticker with *.toimg*');
      const png = await sharp(buf).png().toBuffer();
      await ctx.sock.sendMessage(ctx.from, { image: png }, { quoted: ctx.raw });
    }
  },
  {
    pattern: 'take',
    category: 'sticker',
    desc: 'Re-pack a sticker with new pack/author name: .take PackName|Author',
    run: async (ctx) => {
      const buf = await getTargetMedia(ctx, 'stickerMessage');
      if (!buf) return ctx.reply('Reply to a sticker with *.take PackName|Author*');
      const [pack, author] = ctx.text.split(' ').slice(1).join(' ').split('|').map((s) => s?.trim());
      // Re-encode as a plain sticker; full EXIF pack/author editing needs node-webpmux (see lib for extension).
      const webp = await sharp(buf).webp().toBuffer();
      await ctx.sock.sendMessage(ctx.from, { sticker: webp, packname: pack || 'JagX', author: author || 'JagX Bot' }, { quoted: ctx.raw });
    }
  },
  {
    pattern: 'stickertext',
    aliases: ['qc'],
    category: 'sticker',
    desc: 'Create a text sticker: .stickertext <text>',
    run: async (ctx) => {
      const text = ctx.text.split(' ').slice(1).join(' ');
      if (!text) return ctx.reply('Usage: .stickertext <text>');
      const svg = `<svg width="512" height="512"><rect width="100%" height="100%" fill="transparent"/>
        <text x="50%" y="50%" font-size="48" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">${text}</text></svg>`;
      const webp = await sharp(Buffer.from(svg)).webp().toBuffer();
      await ctx.sock.sendMessage(ctx.from, { sticker: webp }, { quoted: ctx.raw });
    }
  }
];
