const axios = require('axios');

function targetMention(ctx) {
  const mentioned = ctx.message?.[ctx.type]?.contextInfo?.mentionedJid?.[0];
  return mentioned || ctx.quoted?.key?.participant;
}

// All of these hit waifu.pics' public SFW ("sfw") category endpoints - safe,
// no key needed, returns a gif URL. Common "anime reaction" feature seen in
// most Discord/WhatsApp community bots.
const reactions = [
  ['hug', 'Send a hug gif'],
  ['pat', 'Pat someone'],
  ['cuddle', 'Cuddle someone'],
  ['poke', 'Poke someone'],
  ['wave', 'Wave hello'],
  ['dance', 'Random dance gif'],
  ['highfive', 'High-five someone'],
  ['cry', 'Random crying gif'],
  ['blush', 'Random blush gif'],
  ['smile', 'Random smile gif'],
  ['wink', 'Wink at someone'],
  ['bonk', 'Bonk someone'],
  ['slap', 'Slap someone (playful)'],
  ['nom', 'Random nom/eating gif'],
  ['bite', 'Playfully bite someone']
];

module.exports = reactions.map(([name, desc]) => ({
  pattern: name,
  category: 'anime',
  desc: `${desc} (anime reaction gif)`,
  run: async (ctx) => {
    try {
      const { data } = await axios.get(`https://api.waifu.pics/sfw/${name}`);
      const target = targetMention(ctx);
      const caption = target ? `@${ctx.sender.split('@')[0]} → @${target.split('@')[0]}` : undefined;
      await ctx.sock.sendMessage(
        ctx.from,
        { video: { url: data.url }, gifPlayback: true, caption, mentions: target ? [ctx.sender, target] : [ctx.sender] },
        { quoted: ctx.raw }
      );
    } catch (e) {
      await ctx.reply('❌ Could not fetch that right now, try again.');
    }
  }
}));
