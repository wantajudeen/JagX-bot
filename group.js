async function requireGroupAdmin(ctx) {
  if (!ctx.isGroup) {
    await ctx.reply('This command only works in groups.');
    return false;
  }
  const meta = await ctx.sock.groupMetadata(ctx.from);
  const participant = meta.participants.find((p) => p.id === ctx.sender);
  const botId = ctx.sock.user.id.split(':')[0] + '@s.whatsapp.net';
  const botIsAdmin = meta.participants.find((p) => p.id === botId)?.admin;
  if (!participant?.admin) {
    await ctx.reply('❌ Only group admins can use this command.');
    return false;
  }
  if (!botIsAdmin) {
    await ctx.reply('❌ I need to be an admin to do that.');
    return false;
  }
  return meta;
}

function targetFromCtx(ctx) {
  const mentioned = ctx.message?.[ctx.type]?.contextInfo?.mentionedJid;
  if (mentioned?.length) return mentioned[0];
  if (ctx.quoted) return ctx.quoted.key.participant;
  return null;
}

module.exports = [
  {
    pattern: 'kick',
    aliases: ['remove'],
    category: 'group',
    desc: 'Remove a member: reply/mention + .kick',
    run: async (ctx) => {
      const meta = await requireGroupAdmin(ctx);
      if (!meta) return;
      const target = targetFromCtx(ctx);
      if (!target) return ctx.reply('Mention or reply to the person you want to kick.');
      await ctx.sock.groupParticipantsUpdate(ctx.from, [target], 'remove');
      await ctx.reply(`✅ Removed @${target.split('@')[0]}`, );
    }
  },
  {
    pattern: 'add',
    category: 'group',
    desc: 'Add a member: .add 234xxxxxxxxx',
    run: async (ctx) => {
      const meta = await requireGroupAdmin(ctx);
      if (!meta) return;
      const num = ctx.text.split(' ')[1]?.replace(/\D/g, '');
      if (!num) return ctx.reply('Usage: .add 234xxxxxxxxx');
      await ctx.sock.groupParticipantsUpdate(ctx.from, [`${num}@s.whatsapp.net`], 'add');
      await ctx.reply('✅ Invite sent.');
    }
  },
  {
    pattern: 'promote',
    category: 'group',
    desc: 'Make a member admin',
    run: async (ctx) => {
      const meta = await requireGroupAdmin(ctx);
      if (!meta) return;
      const target = targetFromCtx(ctx);
      if (!target) return ctx.reply('Mention or reply to the person you want to promote.');
      await ctx.sock.groupParticipantsUpdate(ctx.from, [target], 'promote');
      await ctx.reply(`✅ @${target.split('@')[0]} is now admin`);
    }
  },
  {
    pattern: 'demote',
    category: 'group',
    desc: 'Remove admin status from a member',
    run: async (ctx) => {
      const meta = await requireGroupAdmin(ctx);
      if (!meta) return;
      const target = targetFromCtx(ctx);
      if (!target) return ctx.reply('Mention or reply to the person you want to demote.');
      await ctx.sock.groupParticipantsUpdate(ctx.from, [target], 'demote');
      await ctx.reply(`✅ @${target.split('@')[0]} is no longer admin`);
    }
  },
  {
    pattern: 'tagall',
    category: 'group',
    desc: 'Mention every member of the group',
    run: async (ctx) => {
      if (!ctx.isGroup) return ctx.reply('Groups only.');
      const meta = await ctx.sock.groupMetadata(ctx.from);
      const ids = meta.participants.map((p) => p.id);
      const text = ids.map((id) => `@${id.split('@')[0]}`).join(' ');
      await ctx.sock.sendMessage(ctx.from, { text, mentions: ids });
    }
  },
  {
    pattern: 'hidetag',
    category: 'group',
    desc: 'Send a message that pings everyone without showing @ list: .hidetag <text>',
    run: async (ctx) => {
      if (!ctx.isGroup) return ctx.reply('Groups only.');
      const meta = await ctx.sock.groupMetadata(ctx.from);
      const ids = meta.participants.map((p) => p.id);
      const text = ctx.text.split(' ').slice(1).join(' ') || '📢';
      await ctx.sock.sendMessage(ctx.from, { text, mentions: ids });
    }
  },
  {
    pattern: 'groupopen',
    aliases: ['unlock'],
    category: 'group',
    desc: 'Allow all members to send messages',
    run: async (ctx) => {
      const meta = await requireGroupAdmin(ctx);
      if (!meta) return;
      await ctx.sock.groupSettingUpdate(ctx.from, 'not_announcement');
      await ctx.reply('🔓 Group opened - everyone can chat.');
    }
  },
  {
    pattern: 'groupclose',
    aliases: ['lock'],
    category: 'group',
    desc: 'Only admins can send messages',
    run: async (ctx) => {
      const meta = await requireGroupAdmin(ctx);
      if (!meta) return;
      await ctx.sock.groupSettingUpdate(ctx.from, 'announcement');
      await ctx.reply('🔒 Group closed - only admins can chat.');
    }
  },
  {
    pattern: 'setgdesc',
    category: 'group',
    desc: 'Set the group description: .setgdesc <text>',
    run: async (ctx) => {
      const meta = await requireGroupAdmin(ctx);
      if (!meta) return;
      const desc = ctx.text.split(' ').slice(1).join(' ');
      if (!desc) return ctx.reply('Usage: .setgdesc <text>');
      await ctx.sock.groupUpdateDescription(ctx.from, desc);
      await ctx.reply('✅ Description updated.');
    }
  },
  {
    pattern: 'linkgroup',
    aliases: ['grouplink'],
    category: 'group',
    desc: 'Get the group invite link',
    run: async (ctx) => {
      const meta = await requireGroupAdmin(ctx);
      if (!meta) return;
      const code = await ctx.sock.groupInviteCode(ctx.from);
      await ctx.reply(`🔗 https://chat.whatsapp.com/${code}`);
    }
  },
  {
    pattern: 'revokelink',
    category: 'group',
    desc: 'Reset the group invite link (invalidates the old one)',
    run: async (ctx) => {
      const meta = await requireGroupAdmin(ctx);
      if (!meta) return;
      await ctx.sock.groupRevokeInvite(ctx.from);
      await ctx.reply('✅ Old invite link revoked. Use .linkgroup to get the new one.');
    }
  },
  {
    pattern: 'groupinfo',
    category: 'group',
    desc: 'Show group stats',
    run: async (ctx) => {
      if (!ctx.isGroup) return ctx.reply('Groups only.');
      const meta = await ctx.sock.groupMetadata(ctx.from);
      await ctx.reply(
        `📛 ${meta.subject}\n👥 Members: ${meta.participants.length}\n🆔 ${meta.id}\n📝 ${meta.desc || 'No description'}`
      );
    }
  }
];
