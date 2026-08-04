const { EconomyModel } = require('../../lib/database');

async function getWallet(userId) {
  let doc = await EconomyModel.findById(userId);
  if (!doc) doc = await EconomyModel.create({ _id: userId, balance: 0 });
  return doc;
}

module.exports = [
  {
    pattern: 'balance',
    aliases: ['bal', 'wallet'],
    category: 'economy',
    desc: 'Check your virtual coin balance',
    run: async (ctx) => {
      const doc = await getWallet(ctx.sender);
      await ctx.reply(`💰 Balance: ${doc.balance} coins`);
    }
  },
  {
    pattern: 'daily',
    category: 'economy',
    desc: 'Claim your daily coin reward',
    run: async (ctx) => {
      const doc = await getWallet(ctx.sender);
      const now = Date.now();
      if (doc.lastDaily && now - doc.lastDaily.getTime() < 24 * 60 * 60 * 1000) {
        const remaining = 24 * 60 * 60 * 1000 - (now - doc.lastDaily.getTime());
        const hrs = Math.floor(remaining / 3600000);
        const mins = Math.floor((remaining % 3600000) / 60000);
        return ctx.reply(`⏳ You already claimed today's reward. Try again in ${hrs}h ${mins}m.`);
      }
      const reward = 200;
      doc.balance += reward;
      doc.lastDaily = new Date();
      await doc.save();
      await ctx.reply(`✅ Claimed your daily reward: +${reward} coins!\n💰 New balance: ${doc.balance}`);
    }
  },
  {
    pattern: 'work',
    category: 'economy',
    desc: 'Work to earn coins (1 hour cooldown)',
    run: async (ctx) => {
      const doc = await getWallet(ctx.sender);
      const now = Date.now();
      if (doc.lastWork && now - doc.lastWork.getTime() < 60 * 60 * 1000) {
        const remaining = Math.ceil((60 * 60 * 1000 - (now - doc.lastWork.getTime())) / 60000);
        return ctx.reply(`⏳ You're tired. Try again in ${remaining}m.`);
      }
      const earned = 20 + Math.floor(Math.random() * 80);
      doc.balance += earned;
      doc.lastWork = new Date();
      await doc.save();
      await ctx.reply(`💼 You worked and earned ${earned} coins!\n💰 New balance: ${doc.balance}`);
    }
  },
  {
    pattern: 'gamble',
    aliases: ['bet'],
    category: 'economy',
    desc: 'Gamble coins on a coin flip: .gamble 100',
    run: async (ctx) => {
      const amount = parseInt(ctx.text.split(' ')[1]);
      if (!amount || amount <= 0) return ctx.reply('Usage: .gamble <amount>');
      const doc = await getWallet(ctx.sender);
      if (doc.balance < amount) return ctx.reply('❌ Not enough coins.');
      const win = Math.random() < 0.5;
      doc.balance += win ? amount : -amount;
      await doc.save();
      await ctx.reply(`${win ? '🎉 You won' : '💸 You lost'} ${amount} coins!\n💰 New balance: ${doc.balance}`);
    }
  },
  {
    pattern: 'transfer',
    aliases: ['pay'],
    category: 'economy',
    desc: 'Send coins to another member: reply/mention + .transfer <amount>',
    run: async (ctx) => {
      const mentioned = ctx.message?.[ctx.type]?.contextInfo?.mentionedJid?.[0];
      const target = mentioned || ctx.quoted?.key?.participant;
      const amount = parseInt(ctx.text.split(' ').slice(-1)[0]);
      if (!target || !amount || amount <= 0) return ctx.reply('Usage: mention/reply + .transfer <amount>');
      const from = await getWallet(ctx.sender);
      if (from.balance < amount) return ctx.reply('❌ Not enough coins.');
      const to = await getWallet(target);
      from.balance -= amount;
      to.balance += amount;
      await from.save();
      await to.save();
      await ctx.reply(`✅ Sent ${amount} coins to @${target.split('@')[0]}`);
    }
  },
  {
    pattern: 'leaderboard',
    aliases: ['richest'],
    category: 'economy',
    desc: 'Show the top 10 richest users',
    run: async (ctx) => {
      const top = await EconomyModel.find().sort({ balance: -1 }).limit(10).lean();
      if (!top.length) return ctx.reply('No data yet.');
      const text = top.map((u, i) => `${i + 1}. @${u._id.split('@')[0]} - ${u.balance} coins`).join('\n');
      await ctx.sock.sendMessage(ctx.from, { text: `🏆 *Leaderboard*\n\n${text}`, mentions: top.map((u) => u._id) });
    }
  }
];
