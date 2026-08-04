const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const truths = [
  "What's the most embarrassing thing you've ever done?",
  "What's a secret you've never told anyone?",
  "Who was your first crush?",
  "What's the biggest lie you've ever told?",
  "What's something you're insecure about?"
];
const dares = [
  'Send the last photo in your gallery.',
  'Text your crush "I miss you".',
  'Speak in an accent for the next 5 messages.',
  'Change your profile picture to something silly for an hour.',
  'Do 10 push-ups right now.'
];
const jokes = [
  "Why don't scientists trust atoms? Because they make up everything.",
  'I told my computer I needed a break, and it said no problem — it froze immediately.',
  "Why did the scarecrow win an award? He was outstanding in his field."
];
const facts = [
  'Honey never spoils — archaeologists have found 3000-year-old honey that is still edible.',
  'Octopuses have three hearts.',
  'Bananas are berries, but strawberries are not.'
];
const flirts = [
  'Are you a magician? Because whenever I look at you, everyone else disappears.',
  'Do you have a map? I keep getting lost in your eyes.',
  'If being sexy was a crime, you would be guilty as charged.'
];
const eightballAnswers = ['Yes, definitely.', 'No way.', 'Ask again later.', 'Absolutely!', 'Very doubtful.', "I can't tell right now."];

module.exports = [
  { pattern: 'truth', category: 'fun', desc: 'Get a random truth question', run: async (ctx) => ctx.reply(`❓ ${pick(truths)}`) },
  { pattern: 'dare', category: 'fun', desc: 'Get a random dare', run: async (ctx) => ctx.reply(`🎯 ${pick(dares)}`) },
  { pattern: 'joke', category: 'fun', desc: 'Get a random joke', run: async (ctx) => ctx.reply(`😂 ${pick(jokes)}`) },
  { pattern: 'fact', category: 'fun', desc: 'Get a random fun fact', run: async (ctx) => ctx.reply(`💡 ${pick(facts)}`) },
  { pattern: 'flirt', category: 'fun', desc: 'Get a random pickup line', run: async (ctx) => ctx.reply(`😏 ${pick(flirts)}`) },
  {
    pattern: 'ship',
    category: 'fun',
    desc: 'Ship two names together: .ship name1 & name2',
    run: async (ctx) => {
      const parts = ctx.text.split(' ').slice(1).join(' ').split('&').map((s) => s.trim());
      if (parts.length < 2) return ctx.reply('Usage: .ship name1 & name2');
      const percent = Math.floor(Math.random() * 101);
      await ctx.reply(`💘 ${parts[0]} x ${parts[1]} = ${percent}% compatible`);
    }
  },
  {
    pattern: '8ball',
    aliases: ['eightball'],
    category: 'fun',
    desc: 'Ask the magic 8-ball a question',
    run: async (ctx) => ctx.reply(`🎱 ${pick(eightballAnswers)}`)
  },
  {
    pattern: 'dice',
    aliases: ['roll'],
    category: 'fun',
    desc: 'Roll a 6-sided die',
    run: async (ctx) => ctx.reply(`🎲 You rolled a ${1 + Math.floor(Math.random() * 6)}`)
  },
  {
    pattern: 'coinflip',
    aliases: ['flip'],
    category: 'fun',
    desc: 'Flip a coin',
    run: async (ctx) => ctx.reply(`🪙 ${Math.random() < 0.5 ? 'Heads' : 'Tails'}`)
  },
  {
    pattern: 'quote',
    category: 'fun',
    desc: 'Get an inspirational quote',
    run: async (ctx) =>
      ctx.reply(
        pick([
          '"The only way to do great work is to love what you do." - Steve Jobs',
          '"Success is not final, failure is not fatal." - Winston Churchill',
          '"Believe you can and you\'re halfway there." - Theodore Roosevelt'
        ])
      )
  }
];
