const { downloadMediaMessage } = require('@whiskeysockets/baileys');
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
    pattern: 'setgpp',
    category: 'group',
    desc: 'Set the group profile picture: reply to an image with .setgpp',
    run: async (ctx) => {
      if (!(await requireAdmin(ctx))) return;
      if (ctx.quoted?.type !== 'imageMessage') return ctx.reply('Reply to an image with .setgpp');
      const buf = await downloadMediaMessage({ key: ctx.quoted.key, message: ctx.quoted.message }, 'buffer', {});
      await ctx.sock.updateProfilePicture(ctx.from, buf);
      await ctx.reply('✅ Group picture updated.');
    }
  },
  {
    pattern: 'listadmins',
    aliases: ['admins'],
    category: 'group',
    desc: 'List all admins in this group',
    run: async (ctx) => {
      if (!ctx.isGroup) return ctx.reply('Groups only.');
      const meta = await ctx.sock.groupMetadata(ctx.from);
      const admins = meta.participants.filter((p) => p.admin);
      if (!admins.length) return ctx.reply('No admins found.');
      await ctx.sock.sendMessage(ctx.from, {
        text: `👑 *Admins*\n\n${admins.map((a) => `@${a.id.split('@')[0]}`).join('\n')}`,
        mentions: admins.map((a) => a.id)
      });
    }
  },
  {
    pattern: 'grouprules',
    aliases: ['rules'],
    category: 'group',
    desc: 'Set or view group rules: .grouprules <text> to set, .grouprules to view',
    run: async (ctx) => {
      if (!ctx.isGroup) return ctx.reply('Groups only.');
      const text = ctx.text.split(' ').slice(1).join(' ');
      if (text) {
        if (!(await requireAdmin(ctx))) return;
        await GroupConfigModel.findByIdAndUpdate(ctx.from, { rules: text }, { upsert: true });
        return ctx.reply('✅ Group rules updated.');
      }
      const cfg = await GroupConfigModel.findById(ctx.from).lean();
      await ctx.reply(cfg?.rules ? `📜 *Group Rules*\n\n${cfg.rules}` : 'No rules set yet. Admins: .grouprules <text>');
    }
  }
];
