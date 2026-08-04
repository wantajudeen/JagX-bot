const sharp = require('sharp');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

async function getImage(ctx) {
  if (ctx.type === 'imageMessage') return downloadMediaMessage({ key: ctx.key, message: ctx.message }, 'buffer', {});
  if (ctx.quoted?.type === 'imageMessage') return downloadMediaMessage({ key: ctx.quoted.key, message: ctx.quoted.message }, 'buffer', {});
  return null;
}

function effect(pattern, desc, transform) {
  return {
    pattern,
    category: 'media',
    desc,
    run: async (ctx) => {
      const buf = await getImage(ctx);
      if (!buf) return ctx.reply(`Send/reply to an image with *.${pattern}*`);
      const out = await transform(sharp(buf)).toBuffer();
      await ctx.sock.sendMessage(ctx.from, { image: out }, { quoted: ctx.raw });
    }
  };
}

module.exports = [
  effect('blur', 'Blur an image', (img) => img.blur(8)),
  effect('grayscale', 'Convert an image to grayscale', (img) => img.grayscale()),
  effect('invert', 'Invert image colors', (img) => img.negate()),
  effect('rotate', 'Rotate an image 90°', (img) => img.rotate(90)),
  effect('flip', 'Flip an image vertically', (img) => img.flip()),
  effect('mirror', 'Mirror an image horizontally', (img) => img.flop()),
  effect('sharpen', 'Sharpen an image', (img) => img.sharpen()),
  {
    pattern: 'resize',
    category: 'media',
    desc: 'Resize an image: .resize 300 300',
    run: async (ctx) => {
      const buf = await getImage(ctx);
      if (!buf) return ctx.reply('Send/reply to an image with *.resize <width> <height>*');
      const [, w, h] = ctx.text.split(' ');
      const width = parseInt(w) || 300;
      const height = parseInt(h) || 300;
      const out = await sharp(buf).resize(width, height).toBuffer();
      await ctx.sock.sendMessage(ctx.from, { image: out }, { quoted: ctx.raw });
    }
  }
];
