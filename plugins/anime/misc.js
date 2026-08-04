const axios = require('axios');

module.exports = [
  {
    pattern: 'waifu',
    category: 'anime',
    desc: 'Random SFW anime waifu image',
    run: async (ctx) => {
      const { data } = await axios.get('https://api.waifu.pics/sfw/waifu');
      await ctx.sock.sendMessage(ctx.from, { image: { url: data.url } }, { quoted: ctx.raw });
    }
  },
  {
    pattern: 'neko',
    category: 'anime',
    desc: 'Random SFW neko (cat girl) image',
    run: async (ctx) => {
      const { data } = await axios.get('https://api.waifu.pics/sfw/neko');
      await ctx.sock.sendMessage(ctx.from, { image: { url: data.url } }, { quoted: ctx.raw });
    }
  },
  {
    pattern: 'animequote',
    aliases: ['aq'],
    category: 'anime',
    desc: 'Random anime quote',
    run: async (ctx) => {
      try {
        const { data } = await axios.get('https://animechan.io/api/v1/quotes/random');
        const q = data?.data;
        if (!q) return ctx.reply('No quote found, try again.');
        await ctx.reply(`💬 "${q.content}"\n— ${q.character?.name || 'Unknown'} (${q.anime?.name || ''})`);
      } catch {
        await ctx.reply('❌ Could not fetch a quote right now.');
      }
    }
  }
];
