const ytdl = require('@distube/ytdl-core');
const yts = require('yt-search');
const axios = require('axios');

async function searchYoutube(query) {
  const r = await yts(query);
  return r.videos[0];
}

module.exports = [
  {
    pattern: 'ytmp3',
    category: 'downloader',
    desc: 'Download YouTube audio: .ytmp3 <url or search term>',
    run: async (ctx) => {
      const q = ctx.text.split(' ').slice(1).join(' ');
      if (!q) return ctx.reply('Usage: .ytmp3 <url or search term>');
      const url = q.startsWith('http') ? q : (await searchYoutube(q))?.url;
      if (!url) return ctx.reply('No results found.');
      await ctx.reply('⬇️ Downloading audio...');
      const stream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' });
      await ctx.sock.sendMessage(ctx.from, { audio: { stream }, mimetype: 'audio/mp4' }, { quoted: ctx.raw });
    }
  },
  {
    pattern: 'ytmp4',
    category: 'downloader',
    desc: 'Download YouTube video: .ytmp4 <url or search term>',
    run: async (ctx) => {
      const q = ctx.text.split(' ').slice(1).join(' ');
      if (!q) return ctx.reply('Usage: .ytmp4 <url or search term>');
      const url = q.startsWith('http') ? q : (await searchYoutube(q))?.url;
      if (!url) return ctx.reply('No results found.');
      await ctx.reply('⬇️ Downloading video...');
      const stream = ytdl(url, { filter: 'audioandvideo', quality: 'highest' });
      await ctx.sock.sendMessage(ctx.from, { video: { stream }, mimetype: 'video/mp4' }, { quoted: ctx.raw });
    }
  },
  {
    pattern: 'play',
    aliases: ['song'],
    category: 'downloader',
    desc: 'Search + send a song from YouTube: .play <song name>',
    run: async (ctx) => {
      const q = ctx.text.split(' ').slice(1).join(' ');
      if (!q) return ctx.reply('Usage: .play <song name>');
      const vid = await searchYoutube(q);
      if (!vid) return ctx.reply('No results found.');
      await ctx.reply(`🎵 ${vid.title}\n⏱️ ${vid.timestamp}\n⬇️ Downloading...`);
      const stream = ytdl(vid.url, { filter: 'audioonly', quality: 'highestaudio' });
      await ctx.sock.sendMessage(ctx.from, { audio: { stream }, mimetype: 'audio/mp4' }, { quoted: ctx.raw });
    }
  },
  {
    pattern: 'video',
    category: 'downloader',
    desc: 'Search + send a video from YouTube: .video <name>',
    run: async (ctx) => {
      const q = ctx.text.split(' ').slice(1).join(' ');
      if (!q) return ctx.reply('Usage: .video <name>');
      const vid = await searchYoutube(q);
      if (!vid) return ctx.reply('No results found.');
      const stream = ytdl(vid.url, { filter: 'audioandvideo', quality: 'highest' });
      await ctx.sock.sendMessage(ctx.from, { video: { stream }, caption: vid.title }, { quoted: ctx.raw });
    }
  },
  {
    pattern: 'tiktok',
    aliases: ['tt'],
    category: 'downloader',
    desc: 'Download a TikTok video without watermark: .tiktok <url>',
    run: async (ctx) => {
      const url = ctx.text.split(' ')[1];
      if (!url) return ctx.reply('Usage: .tiktok <url>');
      try {
        const { data } = await axios.get('https://www.tikwm.com/api/', { params: { url } });
        const videoUrl = data?.data?.play;
        if (!videoUrl) return ctx.reply('Could not fetch that TikTok video.');
        await ctx.sock.sendMessage(ctx.from, { video: { url: videoUrl }, caption: data.data.title || '' }, { quoted: ctx.raw });
      } catch (e) {
        await ctx.reply('❌ TikTok download failed: ' + e.message);
      }
    }
  }
];
