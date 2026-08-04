const axios = require('axios');

const rpsChoices = ['rock', 'paper', 'scissors'];
function rpsWinner(user, bot) {
  if (user === bot) return 'draw';
  if ((user === 'rock' && bot === 'scissors') || (user === 'paper' && bot === 'rock') || (user === 'scissors' && bot === 'paper')) return 'user';
  return 'bot';
}

// in-memory number-guessing sessions per chat
const guessSessions = new Map();

const riddles = [
  { q: "What has keys but no locks, space but no room, and you can enter but not go in?", a: 'keyboard' },
  { q: "The more you take, the more you leave behind. What am I?", a: 'footsteps' },
  { q: "What has a heart that doesn't beat?", a: 'artichoke' },
  { q: "I speak without a mouth and hear without ears. What am I?", a: 'echo' }
];

module.exports = [
  {
    pattern: 'rps',
    category: 'games',
    desc: 'Play rock-paper-scissors: .rps rock',
    run: async (ctx) => {
      const choice = ctx.text.split(' ')[1]?.toLowerCase();
      if (!rpsChoices.includes(choice)) return ctx.reply('Usage: .rps rock|paper|scissors');
      const botChoice = rpsChoices[Math.floor(Math.random() * 3)];
      const result = rpsWinner(choice, botChoice);
      const line = result === 'draw' ? "It's a draw!" : result === 'user' ? 'You win! 🎉' : 'I win! 🤖';
      await ctx.reply(`You: ${choice}\nMe: ${botChoice}\n\n${line}`);
    }
  },
  {
    pattern: 'guess',
    category: 'games',
    desc: 'Number guessing game: .guess start  then .guess <number>',
    run: async (ctx) => {
      const arg = ctx.text.split(' ')[1];
      if (arg === 'start') {
        guessSessions.set(ctx.from, { target: 1 + Math.floor(Math.random() * 100), tries: 0 });
        return ctx.reply("🎯 I'm thinking of a number between 1-100. Guess with .guess <number>");
      }
      const session = guessSessions.get(ctx.from);
      if (!session) return ctx.reply('Start a game first with .guess start');
      const num = parseInt(arg);
      if (isNaN(num)) return ctx.reply('Usage: .guess <number>');
      session.tries++;
      if (num === session.target) {
        guessSessions.delete(ctx.from);
        return ctx.reply(`🎉 Correct! The number was ${num}. You got it in ${session.tries} tries.`);
      }
      await ctx.reply(num < session.target ? '📈 Higher!' : '📉 Lower!');
    }
  },
  {
    pattern: 'riddle',
    category: 'games',
    desc: 'Get a random riddle',
    run: async (ctx) => {
      const r = riddles[Math.floor(Math.random() * riddles.length)];
      await ctx.reply(`🧩 ${r.q}\n\n_Reply with .riddleanswer to reveal it._`);
      global.LAST_RIDDLE = global.LAST_RIDDLE || {};
      global.LAST_RIDDLE[ctx.from] = r.a;
    }
  },
  {
    pattern: 'riddleanswer',
    category: 'games',
    desc: 'Reveal the last riddle answer',
    run: async (ctx) => {
      const ans = global.LAST_RIDDLE?.[ctx.from];
      await ctx.reply(ans ? `✅ Answer: ${ans}` : 'No active riddle. Use .riddle first.');
    }
  },
  {
    pattern: 'trivia',
    category: 'games',
    desc: 'Get a random trivia question',
    run: async (ctx) => {
      try {
        const { data } = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
        const q = data.results?.[0];
        if (!q) return ctx.reply('No trivia found, try again.');
        const options = [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5);
        const decode = (s) => s.replace(/&#?\w+;/g, (m) => ({ '&quot;': '"', '&#039;': "'", '&amp;': '&' }[m] || m));
        const text = `🧠 *Trivia (${q.category})*\n\n${decode(q.question)}\n\n${options.map((o, i) => `${i + 1}. ${decode(o)}`).join('\n')}`;
        await ctx.reply(text);
      } catch {
        await ctx.reply('❌ Could not fetch trivia right now.');
      }
    }
  }
];
