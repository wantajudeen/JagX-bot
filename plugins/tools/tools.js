const axios = require('axios');
const QRCode = require('qrcode');

module.exports = [
  {
    pattern: 'translate',
    aliases: ['tr'],
    category: 'tools',
    desc: 'Translate text: .translate <lang-code> <text>  e.g. .translate fr Hello',
    run: async (ctx) => {
      const parts = ctx.text.split(' ');
      const lang = parts[1];
      const text = parts.slice(2).join(' ');
      if (!lang || !text) return ctx.reply('Usage: .translate <lang-code> <text>  e.g. .translate fr Hello there');
      const { data } = await axios.get('https://translate.googleapis.com/translate_a/single', {
        params: { client: 'gtx', sl: 'auto', tl: lang, dt: 't', q: text }
      });
      const translated = data[0].map((chunk) => chunk[0]).join('');
      await ctx.reply(`🌐 ${translated}`);
    }
  },
  {
    pattern: 'calc',
    category: 'tools',
    desc: 'Basic calculator: .calc 2+2*5',
    run: async (ctx) => {
      const expr = ctx.text.split(' ').slice(1).join('');
      if (!expr || !/^[0-9+\-*/().\s]+$/.test(expr)) return ctx.reply('Usage: .calc <expression>  (numbers and + - * / ( ) only)');
      try {
        // eslint-disable-next-line no-new-func
        const result = Function(`"use strict"; return (${expr})`)();
        await ctx.reply(`🧮 ${expr} = ${result}`);
      } catch {
        await ctx.reply('❌ Invalid expression.');
      }
    }
  },
  {
    pattern: 'base64encode',
    aliases: ['b64e'],
    category: 'tools',
    desc: 'Encode text to base64',
    run: async (ctx) => {
      const text = ctx.text.split(' ').slice(1).join(' ');
      await ctx.reply(Buffer.from(text).toString('base64'));
    }
  },
  {
    pattern: 'base64decode',
    aliases: ['b64d'],
    category: 'tools',
    desc: 'Decode base64 to text',
    run: async (ctx) => {
      const text = ctx.text.split(' ').slice(1).join(' ');
      try {
        await ctx.reply(Buffer.from(text, 'base64').toString('utf8'));
      } catch {
        await ctx.reply('❌ Invalid base64.');
      }
    }
  },
  {
    pattern: 'qrcode',
    aliases: ['qr'],
    category: 'tools',
    desc: 'Generate a QR code: .qrcode <text>',
    run: async (ctx) => {
      const text = ctx.text.split(' ').slice(1).join(' ');
      if (!text) return ctx.reply('Usage: .qrcode <text or url>');
      const buffer = await QRCode.toBuffer(text, { width: 512 });
      await ctx.sock.sendMessage(ctx.from, { image: buffer, caption: `QR for: ${text}` }, { quoted: ctx.raw });
    }
  },
  {
    pattern: 'currency',
    aliases: ['conv'],
    category: 'tools',
    desc: 'Convert currency: .currency 100 USD NGN',
    run: async (ctx) => {
      const [, amount, from, to] = ctx.text.split(' ');
      if (!amount || !from || !to) return ctx.reply('Usage: .currency <amount> <from> <to>  e.g. .currency 100 USD NGN');
      try {
        const { data } = await axios.get('https://api.exchangerate.host/convert', { params: { from, to, amount } });
        await ctx.reply(`💱 ${amount} ${from.toUpperCase()} = ${data.result?.toFixed(2)} ${to.toUpperCase()}`);
      } catch {
        await ctx.reply('❌ Conversion failed, try again.');
      }
    }
  },
  {
    pattern: 'weather',
    category: 'tools',
    desc: 'Get weather for a city (requires OPENWEATHER_API_KEY env var): .weather Lagos',
    run: async (ctx) => {
      const city = ctx.text.split(' ').slice(1).join(' ');
      if (!city) return ctx.reply('Usage: .weather <city>');
      if (!process.env.OPENWEATHER_API_KEY) {
        return ctx.reply('⚠️ Weather isn\'t configured yet. Add OPENWEATHER_API_KEY to your environment variables (free key at openweathermap.org).');
      }
      const { data } = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: { q: city, appid: process.env.OPENWEATHER_API_KEY, units: 'metric' }
      });
      await ctx.reply(`🌤️ ${data.name}: ${data.main.temp}°C, ${data.weather[0].description}`);
    }
  },
  {
    pattern: 'tts',
    category: 'tools',
    desc: 'Convert text to a voice note: .tts <text>',
    run: async (ctx) => {
      const text = ctx.text.split(' ').slice(1).join(' ');
      if (!text) return ctx.reply('Usage: .tts <text>');
      const { data } = await axios.get('https://translate.google.com/translate_tts', {
        params: { ie: 'UTF-8', q: text, tl: 'en', client: 'tw-ob' },
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      await ctx.sock.sendMessage(ctx.from, { audio: Buffer.from(data), mimetype: 'audio/mp4', ptt: true }, { quoted: ctx.raw });
    }
  }
];
