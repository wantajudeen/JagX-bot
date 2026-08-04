const { WarnModel, GroupConfigModel } = require('../../lib/database');

function targetFromCtx(ctx) {
  const mentioned = ctx.message?.[ctx.type]?.contextInfo?.mentionedJid;
  if (mentioned?.length) return mentioned[0];
  if (ctx.quoted) return ctx.quoted.key.participant;
  return null;
}

async function requireAdmin(ctx) {
  if (!ctx.isGroup) {
    await ctx.reply('This command only works in groups.');
    return false;
  }
  const meta = await ctx.sock.groupMetadata(ctx.from);
  const isAdmin = meta.participants.find((p) => p.id === ctx.sender)?.admin;
  if (!isAdmin) {
    await ctx.reply('❌ Only group admins can use this command.');
    return false;
  }
  return true;
}

module.exports = [
  {
    pattern: 'warn',
    category: 'moderation',
    desc: 'Warn a member (3 warnings = suggested kick): reply/mention + .warn',
    run: async (ctx) => {
      if (!(await requireAdmin(ctx))) return;
      const target = targetFromCtx(ctx);
      if (!target) return ctx.reply('Mention or reply to the person to warn.');
      const key = `${ctx.from}::${target}`;
      const doc = await WarnModel.findByIdAndUpdate(key, { $inc: { count: 1 } }, { upsert: true, new: true });
      await ctx.reply(`⚠️ @${target.split('@')[0]} has been warned (${doc.count}/3)${doc.count >= 3 ? '\n🚨 Consider kicking this member.' : ''}`);
    }
  },
  {
    pattern: 'warnings',
    category: 'moderation',
    desc: 'Check how many warnings a member has',
    run: async (ctx) => {
      if (!ctx.isGroup) return ctx.reply('Groups only.');
      const target = targetFromCtx(ctx) || ctx.sender;
      const doc = await WarnModel.findById(`${ctx.from}::${target}`).lean();
      await ctx.reply(`⚠️ @${target.split('@')[0]} has ${doc?.count || 0}/3 warnings`);
    }
  },
  {
    pattern: 'resetwarn',
    category: 'moderation',
    desc: 'Reset warnings for a member',
    run: async (ctx) => {
      if (!(await requireAdmin(ctx))) return;
      const target = targetFromCtx(ctx);
      if (!target) return ctx.reply('Mention or reply to the person.');
      await WarnModel.findByIdAndDelete(`${ctx.from}::${target}`);
      await ctx.reply(`✅ Warnings reset for @${target.split('@')[0]}`);
    }
  },
  {
    pattern: 'antibadword',
    category: 'moderation',
    desc: 'Toggle bad-word auto-delete: .antibadword on / off',
    run: async (ctx) => {
      if (!(await requireAdmin(ctx))) return;
      const mode = ctx.text.split(' ')[1];
      if (!['on', 'off'].includes(mode)) return ctx.reply('Usage: .antibadword on | off');
      await GroupConfigModel.findByIdAndUpdate(ctx.from, { antibadword: mode === 'on' }, { upsert: true });
      await ctx.reply(`✅ Anti-badword is now *${mode.toUpperCase()}*`);
    }
  },
  {
    pattern: 'setwelcome',
    category: 'moderation',
    desc: 'Set the welcome message (@user is replaced with the new member): .setwelcome <text>',
    run: async (ctx) => {
      if (!(await requireAdmin(ctx))) return;
      const text = ctx.text.split(' ').slice(1).join(' ');
      if (!text) return ctx.reply('Usage: .setwelcome <text with @user>');
      await GroupConfigModel.findByIdAndUpdate(ctx.from, { welcome: true, welcomeText: text }, { upsert: true });
      await ctx.reply('✅ Welcome message updated and enabled.');
    }
  },
  {
    pattern: 'setgoodbye',
    category: 'moderation',
    desc: 'Set the goodbye message: .setgoodbye <text>',
    run: async (ctx) => {
      if (!(await requireAdmin(ctx))) return;
      const text = ctx.text.split(' ').slice(1).join(' ');
      if (!text) return ctx.reply('Usage: .setgoodbye <text with @user>');
      await GroupConfigModel.findByIdAndUpdate(ctx.from, { goodbyeText: text }, { upsert: true });
      await ctx.reply('✅ Goodbye message updated.');
    }
  },
  {
    pattern: 'poll',
    category: 'moderation',
    desc: 'Create a poll: .poll Question? | option1 | option2 | option3',
    run: async (ctx) => {
      const parts = ctx.text.split(' ').slice(1).join(' ').split('|').map((s) => s.trim()).filter(Boolean);
      if (parts.length < 3) return ctx.reply('Usage: .poll Question? | option1 | option2');
      const [name, ...values] = parts;
      await ctx.sock.sendMessage(ctx.from, { poll: { name, values, selectableCount: 1 } });
    }
  },
  {
    pattern: 'del',
    aliases: ['delete'],
    category: 'moderation',
    desc: "Delete the bot's own replied message: reply to it with .del",
    run: async (ctx) => {
      if (!ctx.quoted) return ctx.reply('Reply to a message from the bot with .del');
      await ctx.sock.sendMessage(ctx.from, { delete: ctx.quoted.key });
    }
  }
];
