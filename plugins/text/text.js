function arg(ctx) {
  return ctx.text.split(' ').slice(1).join(' ');
}

module.exports = [
  {
    pattern: 'reverse',
    category: 'text',
    desc: 'Reverse text: .reverse hello',
    run: async (ctx) => {
      const t = arg(ctx);
      if (!t) return ctx.reply('Usage: .reverse <text>');
      await ctx.reply(t.split('').reverse().join(''));
    }
  },
  {
    pattern: 'upper',
    category: 'text',
    desc: 'Convert text to UPPERCASE',
    run: async (ctx) => ctx.reply(arg(ctx).toUpperCase() || 'Usage: .upper <text>')
  },
  {
    pattern: 'lower',
    category: 'text',
    desc: 'Convert text to lowercase',
    run: async (ctx) => ctx.reply(arg(ctx).toLowerCase() || 'Usage: .lower <text>')
  },
  {
    pattern: 'rot13',
    category: 'text',
    desc: 'ROT13 cipher encode/decode text',
    run: async (ctx) => {
      const t = arg(ctx);
      if (!t) return ctx.reply('Usage: .rot13 <text>');
      const out = t.replace(/[a-zA-Z]/g, (c) => {
        const base = c <= 'Z' ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
      });
      await ctx.reply(out);
    }
  },
  {
    pattern: 'wordcount',
    category: 'text',
    desc: 'Count words and characters in text',
    run: async (ctx) => {
      const t = arg(ctx);
      if (!t) return ctx.reply('Usage: .wordcount <text>');
      await ctx.reply(`📝 Words: ${t.trim().split(/\s+/).length}\n🔤 Characters: ${t.length}`);
    }
  },
  {
    pattern: 'palindrome',
    category: 'text',
    desc: 'Check if text is a palindrome',
    run: async (ctx) => {
      const t = arg(ctx).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!t) return ctx.reply('Usage: .palindrome <text>');
      const isPalindrome = t === t.split('').reverse().join('');
      await ctx.reply(isPalindrome ? '✅ That is a palindrome.' : '❌ Not a palindrome.');
    }
  },
  {
    pattern: 'mock',
    aliases: ['spongebob'],
    category: 'text',
    desc: 'MoCk TeXt LiKe tHiS: .mock <text>',
    run: async (ctx) => {
      const t = arg(ctx);
      if (!t) return ctx.reply('Usage: .mock <text>');
      const out = t.split('').map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase())).join('');
      await ctx.reply(out);
    }
  }
];
