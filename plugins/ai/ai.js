const axios = require('axios');

module.exports = [
  {
    pattern: 'ai',
    aliases: ['ask', 'gpt'],
    category: 'ai',
    desc: 'Ask an AI a question (requires OPENAI_API_KEY): .ai <question>',
    run: async (ctx) => {
      const q = ctx.text.split(' ').slice(1).join(' ');
      if (!q) return ctx.reply('Usage: .ai <question>');
      if (!process.env.OPENAI_API_KEY) {
        return ctx.reply('⚠️ AI chat needs OPENAI_API_KEY. Add it to your environment variables to enable this command.');
      }
      try {
        const { data } = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          { model: 'gpt-4o-mini', messages: [{ role: 'user', content: q }] },
          { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
        );
        await ctx.reply(data.choices[0].message.content.trim());
      } catch (e) {
        await ctx.reply('❌ AI request failed: ' + (e.response?.data?.error?.message || e.message));
      }
    }
  }
];
