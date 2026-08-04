const axios = require('axios');

function arg(ctx) {
  return ctx.text.split(' ').slice(1).join(' ');
}

module.exports = [
  {
    pattern: 'wiki',
    category: 'search',
    desc: 'Search Wikipedia: .wiki <topic>',
    run: async (ctx) => {
      const q = arg(ctx);
      if (!q) return ctx.reply('Usage: .wiki <topic>');
      const { data } = await axios.get('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(q));
      if (!data.extract) return ctx.reply('No Wikipedia article found.');
      await ctx.reply(`📖 *${data.title}*\n\n${data.extract}\n\n🔗 ${data.content_urls?.desktop?.page || ''}`);
    }
  },
  {
    pattern: 'urban',
    category: 'search',
    desc: 'Look up a slang term on Urban Dictionary: .urban <word>',
    run: async (ctx) => {
      const q = arg(ctx);
      if (!q) return ctx.reply('Usage: .urban <word>');
      const { data } = await axios.get('https://api.urbandictionary.com/v0/define', { params: { term: q } });
      const def = data.list?.[0];
      if (!def) return ctx.reply('No definition found.');
      await ctx.reply(`📘 *${def.word}*\n\n${def.definition.replace(/[\[\]]/g, '')}\n\n💬 _${def.example.replace(/[\[\]]/g, '')}_`);
    }
  },
  {
    pattern: 'github',
    aliases: ['gh'],
    category: 'search',
    desc: 'Look up a GitHub user: .github <username>',
    run: async (ctx) => {
      const q = arg(ctx);
      if (!q) return ctx.reply('Usage: .github <username>');
      const { data } = await axios.get(`https://api.github.com/users/${q}`);
      if (data.message === 'Not Found') return ctx.reply('User not found.');
      await ctx.reply(
        `👤 *${data.login}*\n${data.name || ''}\n📦 Repos: ${data.public_repos}\n👥 Followers: ${data.followers}\n🔗 ${data.html_url}`
      );
    }
  },
  {
    pattern: 'npm',
    category: 'search',
    desc: 'Look up an npm package: .npm <package>',
    run: async (ctx) => {
      const q = arg(ctx);
      if (!q) return ctx.reply('Usage: .npm <package name>');
      const { data } = await axios.get(`https://registry.npmjs.org/${q}`);
      const latest = data['dist-tags']?.latest;
      await ctx.reply(`📦 *${data.name}* v${latest}\n${data.description || ''}\n🔗 https://www.npmjs.com/package/${q}`);
    }
  },
  {
    pattern: 'lyrics',
    category: 'search',
    desc: 'Get song lyrics: .lyrics <artist> - <song>',
    run: async (ctx) => {
      const q = arg(ctx);
      if (!q || !q.includes('-')) return ctx.reply('Usage: .lyrics <artist> - <song>');
      const [artist, song] = q.split('-').map((s) => s.trim());
      try {
        const { data } = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`);
        if (!data.lyrics) return ctx.reply('Lyrics not found.');
        await ctx.reply(`🎤 *${song}* - ${artist}\n\n${data.lyrics.slice(0, 3500)}`);
      } catch {
        await ctx.reply('Lyrics not found for that artist/song.');
      }
    }
  },
  {
    pattern: 'movie',
    category: 'search',
    desc: 'Look up a movie (requires OMDB_API_KEY): .movie <title>',
    run: async (ctx) => {
      const q = arg(ctx);
      if (!q) return ctx.reply('Usage: .movie <title>');
      if (!process.env.OMDB_API_KEY) {
        return ctx.reply('⚠️ Movie search needs OMDB_API_KEY. Get a free key at omdbapi.com and add it to your environment variables.');
      }
      const { data } = await axios.get('https://www.omdbapi.com/', { params: { apikey: process.env.OMDB_API_KEY, t: q } });
      if (data.Response === 'False') return ctx.reply('Movie not found.');
      await ctx.reply(`🎬 *${data.Title}* (${data.Year})\n⭐ ${data.imdbRating}/10\n${data.Plot}`);
    }
  }
];
