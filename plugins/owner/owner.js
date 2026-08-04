function isOwner(ctx) {
  const owners = (process.env.OWNER_NUMBERS || '').split(',').filter(Boolean).map((n) => `${n}@s.whatsapp.net`);
  return owners.includes(ctx.sender);
}

module.exports = [
  {
    pattern: 'broadcast',
    aliases: ['bc'],
    category: 'owner',
    desc: '[Owner] Send a message to every chat the bot has seen',
    ownerOnly: true,
    run: async (ctx) => {
      if (!isOwner(ctx)) return ctx.reply('❌ Owner only.');
      const text = ctx.text.split(' ').slice(1).join(' ');
      if (!text) return ctx.reply('Usage: .broadcast <message>');
      const chats = await ctx.sock.groupFetchAllParticipating();
      let count = 0;
      for (const id of Object.keys(chats)) {
        try {
          await ctx.sock.sendMessage(id, { text: `📢 *Broadcast*\n\n${text}` });
          count++;
        } catch {}
      }
      await ctx.reply(`✅ Broadcast sent to ${count} group(s).`);
    }
  },
  {
    pattern: 'block',
    category: 'owner',
    desc: '[Owner] Block a user: reply/mention + .block',
    ownerOnly: true,
    run: async (ctx) => {
      if (!isOwner(ctx)) return ctx.reply('❌ Owner only.');
      const target = ctx.quoted?.key?.participant || ctx.message?.[ctx.type]?.contextInfo?.mentionedJid?.[0];
      if (!target) return ctx.reply('Mention or reply to the user to block.');
      await ctx.sock.updateBlockStatus(target, 'block');
      await ctx.reply('✅ Blocked.');
    }
  },
  {
    pattern: 'unblock',
    category: 'owner',
    desc: '[Owner] Unblock a user: .unblock 234xxxxxxxxx',
    ownerOnly: true,
    run: async (ctx) => {
      if (!isOwner(ctx)) return ctx.reply('❌ Owner only.');
      const num = ctx.text.split(' ')[1]?.replace(/\D/g, '');
      if (!num) return ctx.reply('Usage: .unblock 234xxxxxxxxx');
      await ctx.sock.updateBlockStatus(`${num}@s.whatsapp.net`, 'unblock');
      await ctx.reply('✅ Unblocked.');
    }
  },
  {
    pattern: 'restart',
    category: 'owner',
    desc: '[Owner] Restart the bot process (Render will auto-restart it)',
    ownerOnly: true,
    run: async (ctx) => {
      if (!isOwner(ctx)) return ctx.reply('❌ Owner only.');
      await ctx.reply('♻️ Restarting...');
      process.exit(0);
    }
  },
  {
    pattern: 'setpp',
    category: 'owner',
    desc: "[Owner] Set the bot's profile picture: reply to an image with .setpp",
    ownerOnly: true,
    run: async (ctx) => {
      if (!isOwner(ctx)) return ctx.reply('❌ Owner only.');
      if (ctx.quoted?.type !== 'imageMessage') return ctx.reply('Reply to an image with .setpp');
      const { downloadMediaMessage } = require('@whiskeysockets/baileys');
      const buf = await downloadMediaMessage({ key: ctx.quoted.key, message: ctx.quoted.message }, 'buffer', {});
      await ctx.sock.updateProfilePicture(ctx.sock.user.id, buf);
      await ctx.reply('✅ Profile picture updated.');
    }
  },
  {
    pattern: 'mode',
    category: 'owner',
    desc: '[Owner] .mode public / .mode private - controls who can use the bot',
    ownerOnly: true,
    run: async (ctx) => {
      if (!isOwner(ctx)) return ctx.reply('❌ Owner only.');
      const mode = ctx.text.split(' ')[1];
      if (!['public', 'private'].includes(mode)) return ctx.reply('Usage: .mode public | .mode private');
      global.BOT_MODE = mode;
      await ctx.reply(`✅ Bot mode set to *${mode}*.`);
    }
  }
];
