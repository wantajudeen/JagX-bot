const axios = require('axios');

async function getPrice(id) {
  const { data } = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
    params: { ids: id, vs_currencies: 'usd', include_24hr_change: 'true' }
  });
  return data[id];
}

module.exports = [
  {
    pattern: 'btc',
    category: 'crypto',
    desc: 'Current Bitcoin price',
    run: async (ctx) => {
      const p = await getPrice('bitcoin');
      if (!p) return ctx.reply('Could not fetch price.');
      await ctx.reply(`₿ Bitcoin: $${p.usd.toLocaleString()} (${p.usd_24h_change?.toFixed(2)}% 24h)`);
    }
  },
  {
    pattern: 'eth',
    category: 'crypto',
    desc: 'Current Ethereum price',
    run: async (ctx) => {
      const p = await getPrice('ethereum');
      if (!p) return ctx.reply('Could not fetch price.');
      await ctx.reply(`Ξ Ethereum: $${p.usd.toLocaleString()} (${p.usd_24h_change?.toFixed(2)}% 24h)`);
    }
  },
  {
    pattern: 'cryptoprice',
    aliases: ['cp'],
    category: 'crypto',
    desc: 'Price of any coin: .cryptoprice dogecoin',
    run: async (ctx) => {
      const id = ctx.text.split(' ')[1]?.toLowerCase();
      if (!id) return ctx.reply('Usage: .cryptoprice <coingecko-id>  e.g. .cryptoprice dogecoin');
      const p = await getPrice(id);
      if (!p) return ctx.reply('Coin not found. Use the CoinGecko ID (e.g. "dogecoin", not "DOGE").');
      await ctx.reply(`💰 ${id}: $${p.usd} (${p.usd_24h_change?.toFixed(2)}% 24h)`);
    }
  }
];
