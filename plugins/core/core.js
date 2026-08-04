const moment = require('moment-timezone');

module.exports = [
  {
    pattern: 'menu',
    aliases: ['help', 'commands'],
    category: 'core',
    desc: 'Show all available commands',
    run: async (ctx) => {
      const prefix = process.env.PREFIX || '.';
      const byCategory = {};
      for (const plugin of new Set(ctx.commands.values())) {
        (byCategory[plugin.category] ||= new Set()).add(plugin.pattern);
      }
      let text = `╭───「 *${process.env.BOT_NAME || 'JagX'} BOT* 」\n`;
      text += `│ Prefix: ${prefix}\n│ Commands: ${new Set(ctx.commands.values()).size}\n╰────────────\n\n`;
      for (const [cat, cmds] of Object.entries(byCategory)) {
        text += `▢ *${cat.toUpperCase()}*\n`;
        text += [...cmds].map((c) => `   ${prefix}${c}`).join('\n');
        text += '\n\n';
      }
      await ctx.reply(text.trim());
    }
  },
  {
    pattern: 'ping',
    category: 'core',
    desc: 'Check bot response speed',
    run: async (ctx) => {
      const start = Date.now();
      const sent = await ctx.reply('Pinging...');
      const ms = Date.now() - start;
      await ctx.sock.sendMessage(ctx.from, { text: `🏓 Pong! ${ms}ms`, edit: sent.key });
    }
  },
  {
    pattern: 'alive',
    category: 'core',
    desc: 'Check if the bot is online',
    run: async (ctx) => ctx.reply(`✅ ${process.env.BOT_NAME || 'JagX'} is alive and running 24/7.`)
  },
  {
    pattern: 'uptime',
    category: 'core',
    desc: 'Show how long the bot has been running',
    run: async (ctx) => {
      const dur = moment.duration(process.uptime(), 'seconds');
      await ctx.reply(`⏱️ Uptime: ${dur.days()}d ${dur.hours()}h ${dur.minutes()}m ${Math.floor(dur.seconds())}s`);
    }
  },
  {
    pattern: 'prefix',
    category: 'core',
    desc: 'Show the current command prefix',
    run: async (ctx) => ctx.reply(`Current prefix: *${process.env.PREFIX || '.'}*`)
  }
];
