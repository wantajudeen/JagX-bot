const { GroupConfigModel } = require('../../lib/database');

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
    pattern: 'antilink',
    category: 'group',
    desc: 'Auto-delete group invite links from non-admins: .antilink on/off',
    run: async (ctx) => {
      if (!(await requireAdmin(ctx))) return;
      const mode = ctx.text.split(' ')[1];
      if (!['on', 'off'].includes(mode)) return ctx.reply('Usage: .antilink on | off');
      await GroupConfigModel.findByIdAndUpdate(ctx.from, { antilink: mode === 'on' }, { upsert: true });
      await ctx.reply(`✅ Anti-link is now *${mode.toUpperCase()}*`);
    }
  }
];
