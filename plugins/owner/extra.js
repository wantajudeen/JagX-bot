function isOwner(ctx) {
  const owners = (process.env.OWNER_NUMBERS || '').split(',').filter(Boolean).map((n) => `${n}@s.whatsapp.net`);
  return owners.includes(ctx.sender);
}

module.exports = [
  {
    pattern: 'setbio',
    category: 'owner',
    desc: "[Owner] Set the bot's status/bio: .setbio <text>",
    ownerOnly: true,
    run: async (ctx) => {
      if (!isOwner(ctx)) return ctx.reply('❌ Owner only.');
      const text = ctx.text.split(' ').slice(1).join(' ');
      if (!text) return ctx.reply('Usage: .setbio <text>');
      await ctx.sock.updateProfileStatus(text);
      await ctx.reply('✅ Bio updated.');
    }
  },
  {
    pattern: 'listgroups',
    category: 'owner',
    desc: '[Owner] List every group the bot is in',
    ownerOnly: true,
    run: async (ctx) => {
      if (!isOwner(ctx)) return ctx.reply('❌ Owner only.');
      const groups = await ctx.sock.groupFetchAllParticipating();
      const list = Object.values(groups).map((g) => `• ${g.subject} (${g.participants?.length || '?'} members)`);
      await ctx.reply(`👥 *Groups (${list.length})*\n\n${list.join('\n') || 'None yet.'}`);
    }
  },
  {
    pattern: 'join',
    category: 'owner',
    desc: '[Owner] Join a group via invite link: .join <link>',
    ownerOnly: true,
    run: async (ctx) => {
      if (!isOwner(ctx)) return ctx.reply('❌ Owner only.');
      const link = ctx.text.split(' ')[1];
      const code = link?.split('/').pop();
      if (!code) return ctx.reply('Usage: .join <chat.whatsapp.com link>');
      await ctx.sock.groupAcceptInvite(code);
      await ctx.reply('✅ Joined the group.');
    }
  }
];
