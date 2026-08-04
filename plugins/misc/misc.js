const axios = require('axios');
const moment = require('moment-timezone');

module.exports = [
  {
    pattern: 'shorturl',
    aliases: ['short'],
    category: 'misc',
    desc: 'Shorten a URL: .shorturl <url>',
    run: async (ctx) => {
      const url = ctx.text.split(' ')[1];
      if (!url) return ctx.reply('Usage: .shorturl <url>');
      const { data } = await axios.get('https://tinyurl.com/api-create.php', { params: { url } });
      await ctx.reply(`🔗 ${data}`);
    }
  },
  {
    pattern: 'time',
    category: 'misc',
    desc: 'Current time in a timezone: .time Africa/Lagos',
    run: async (ctx) => {
      const tz = ctx.text.split(' ')[1] || 'UTC';
      if (!moment.tz.zone(tz)) return ctx.reply('Unknown timezone. Example: .time Africa/Lagos or .time America/New_York');
      await ctx.reply(`🕒 ${tz}: ${moment().tz(tz).format('YYYY-MM-DD HH:mm:ss')}`);
    }
  },
  {
    pattern: 'meme',
    category: 'misc',
    desc: 'Random meme',
    run: async (ctx) => {
      try {
        const { data } = await axios.get('https://meme-api.com/gimme');
        await ctx.sock.sendMessage(ctx.from, { image: { url: data.url }, caption: data.title }, { quoted: ctx.raw });
      } catch {
        await ctx.reply('❌ Could not fetch a meme right now.');
      }
    }
  },
  {
    pattern: 'horoscope',
    category: 'misc',
    desc: 'Daily horoscope: .horoscope leo',
    run: async (ctx) => {
      const sign = ctx.text.split(' ')[1]?.toLowerCase();
      const valid = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
      if (!valid.includes(sign)) return ctx.reply(`Usage: .horoscope <sign>\nSigns: ${valid.join(', ')}`);
      try {
        const { data } = await axios.get(`https://ohmanda.com/api/horoscope/${sign}`);
        await ctx.reply(`🔮 *${sign.toUpperCase()}*\n\n${data.horoscope}`);
      } catch {
        await ctx.reply('❌ Could not fetch horoscope right now.');
      }
    }
  }
];
