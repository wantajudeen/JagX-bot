const { getViewOnce } = require('../../lib/viewonce');

module.exports = {
  pattern: 'vv',
  aliases: ['reveal', 'unvv'],
  category: 'viewonce',
  desc: 'Reply .vv to a view-once photo/video/voice note to reveal & resend it',
  run: async (ctx) => {
    if (!ctx.quoted) {
      return ctx.reply('Reply to the view-once message with *.vv*');
    }
    const data = await getViewOnce(ctx.from, ctx.quoted.key.id);
    if (!data) {
      return ctx.reply('❌ Could not find a cached view-once for that message (it may be too old, or was not a view-once).');
    }

    const captionLine = data.caption ? `\n\n📝 ${data.caption}` : '';
    if (data.kind === 'imageMessage') {
      await ctx.sock.sendMessage(ctx.from, { image: data.buffer, caption: `👁️ *View-once revealed*${captionLine}` }, { quoted: ctx.raw });
    } else if (data.kind === 'videoMessage') {
      await ctx.sock.sendMessage(ctx.from, { video: data.buffer, caption: `👁️ *View-once revealed*${captionLine}` }, { quoted: ctx.raw });
    } else if (data.kind === 'audioMessage') {
      await ctx.sock.sendMessage(ctx.from, { audio: data.buffer, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: ctx.raw });
    } else {
      await ctx.reply('Unsupported view-once media type.');
    }
  }
};
