// Anti-delete itself runs globally for every chat by default (see lib/antidelete.js).
// These commands let an owner check status / are placeholders for future
// per-chat opt-out logic.

module.exports = [
  {
    pattern: 'antidelete',
    category: 'antidelete',
    desc: 'Show anti-delete status (currently always ON globally)',
    run: async (ctx) => ctx.reply('🗑️ Anti-delete is *ON* for all chats. Deleted messages will be reposted automatically.')
  },
  {
    pattern: 'vvinfo',
    category: 'antidelete',
    desc: 'Explain how the view-once revealer works',
    run: async (ctx) =>
      ctx.reply('👁️ Every view-once photo/video/voice note sent to the bot is cached the moment it arrives. Reply to it with *.vv* to reveal and resend it.')
  }
];
