const { downloadMediaMessage } = require('@whiskeysockets/baileys');

function isOwner(ctx) {
  const owners = (process.env.OWNER_NUMBERS || '').split(',').filter(Boolean).map((n) => `${n}@s.whatsapp.net`);
  return owners.includes(ctx.sender);
}

module.exports = [
  {
    pattern: 'savestatus',
    aliases: ['save'],
    category: 'status',
    desc: 'Save a forwarded status/media: reply to it with .savestatus',
    run: async (ctx) => {
      if (!ctx.quoted) return ctx.reply('Reply to the forwarded status/media with .savestatus');
      const buf = await downloadMediaMessage({ key: ctx.quoted.key, message: ctx.quoted.message }, 'buffer', {});
      const type = ctx.quoted.type;
      if (type === 'imageMessage') await ctx.sock.sendMessage(ctx.from, { image: buf }, { quoted: ctx.raw });
      else if (type === 'videoMessage') await ctx.sock.sendMessage(ctx.from, { video: buf }, { quoted: ctx.raw });
      else if (type === 'audioMessage') await ctx.sock.sendMessage(ctx.from, { audio: buf, mimetype: 'audio/mp4' }, { quoted: ctx.raw });
      else await ctx.reply('Unsupported media type.');
    }
  },
  {
    pattern: 'autostatus',
    category: 'status',
    desc: "[Owner] Toggle auto-saving contacts' statuses to your DM: .autostatus on/off",
    ownerOnly: true,
    run: async (ctx) => {
      if (!isOwner(ctx)) return ctx.reply('❌ Owner only.');
      const mode = ctx.text.split(' ')[1];
      if (!['on', 'off'].includes(mode)) return ctx.reply('Usage: .autostatus on | off');
      global.AUTO_STATUS = mode === 'on';
      await ctx.reply(`✅ Auto status-save is now *${mode.toUpperCase()}*.`);
    }
  }
];
