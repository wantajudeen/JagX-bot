const { SeenUserModel } = require('./database');

/**
 * Makes the bot's own connected number follow the configured WhatsApp Channel.
 * Requires CHANNEL_INVITE_CODE in env (the part after /channel/ in your link).
 * Only works on Baileys versions that support newsletters/channels (v6.6+).
 */
async function followChannel(sock) {
  const code = process.env.CHANNEL_INVITE_CODE;
  if (!code) return;
  try {
    const meta = await sock.newsletterMetadata('invite', code);
    if (!meta?.id) return;
    await sock.newsletterFollow(meta.id);
    console.log(`[CHANNEL] Bot account is now following the channel (${meta.name || meta.id})`);
  } catch (e) {
    console.log('[CHANNEL] Could not auto-follow channel:', e.message);
  }
}

/**
 * WhatsApp does not allow a bot to add other people to a channel automatically
 * (no public API for that, and it would be spammy/non-consensual). The closest
 * honest equivalent: the first time someone DMs the bot, send them the invite
 * link once so they can join with a single tap.
 */
async function greetFirstTimeChatter(ctx) {
  if (ctx.isGroup || !process.env.CHANNEL_LINK) return;
  try {
    const already = await SeenUserModel.findById(ctx.sender).lean();
    if (already) return;
    await SeenUserModel.create({ _id: ctx.sender });
    await ctx.sock.sendMessage(ctx.from, {
      text: `👋 Hey! Before we get started — join our official WhatsApp Channel for updates:\n${process.env.CHANNEL_LINK}`
    });
  } catch (e) {
    console.log('[CHANNEL] greet failed:', e.message);
  }
}

module.exports = { followChannel, greetFirstTimeChatter };
