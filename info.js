module.exports = [
  {
    pattern: 'owner',
    category: 'info',
    desc: 'Get the bot owner contact',
    run: async (ctx) => {
      const owners = (process.env.OWNER_NUMBERS || '').split(',').filter(Boolean);
      await ctx.sock.sendMessage(ctx.from, {
        contacts: { displayName: 'Bot Owner', contacts: owners.map((n) => ({ vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Owner\nTEL;type=CELL;waid=${n}:+${n}\nEND:VCARD` })) }
      });
    }
  },
  {
    pattern: 'jid',
    category: 'info',
    desc: 'Get the JID (WhatsApp ID) of this chat or a mentioned user',
    run: async (ctx) => ctx.reply(`\`\`\`${ctx.from}\`\`\``)
  },
  {
    pattern: 'botinfo',
    aliases: ['about'],
    category: 'info',
    desc: 'Info about this bot',
    run: async (ctx) =>
      ctx.reply(
        `🤖 *${process.env.BOT_NAME || 'JagX'} Bot*\nBuilt on Baileys, hosted 24/7.\nSession storage: MongoDB\nType ${process.env.PREFIX || '.'}menu to see all commands.`
      )
  },
  {
    pattern: 'report',
    category: 'info',
    desc: 'Report a bug to the owner: .report <message>',
    run: async (ctx, args) => {
      const owners = (process.env.OWNER_NUMBERS || '').split(',').filter(Boolean);
      const text = ctx.text.split(' ').slice(1).join(' ');
      if (!text) return ctx.reply('Usage: .report <describe the bug>');
      for (const o of owners) {
        await ctx.sock.sendMessage(`${o}@s.whatsapp.net`, { text: `📩 *Bug report* from @${ctx.sender.split('@')[0]}:\n${text}`, mentions: [ctx.sender] });
      }
      await ctx.reply('✅ Report sent to the owner.');
    }
  }
];
