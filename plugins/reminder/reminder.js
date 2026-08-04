const { NoteModel } = require('../../lib/database');

module.exports = [
  {
    pattern: 'remind',
    category: 'reminder',
    desc: 'Set a reminder: .remind 10m Take a break  (units: s/m/h)',
    run: async (ctx) => {
      const parts = ctx.text.split(' ');
      const durationStr = parts[1];
      const text = parts.slice(2).join(' ');
      const match = durationStr?.match(/^(\d+)(s|m|h)$/);
      if (!match || !text) return ctx.reply('Usage: .remind 10m Take a break  (s = seconds, m = minutes, h = hours)');
      const [, num, unit] = match;
      const ms = { s: 1000, m: 60000, h: 3600000 }[unit] * parseInt(num);
      if (ms > 24 * 3600000) return ctx.reply('❌ Max reminder length is 24h (bot restarts would lose longer timers).');
      await ctx.reply(`⏰ Reminder set for ${num}${unit} from now.`);
      setTimeout(() => {
        ctx.sock.sendMessage(ctx.from, { text: `⏰ *Reminder:* ${text}`, mentions: [ctx.sender] }).catch(() => {});
      }, ms);
    }
  },
  {
    pattern: 'note',
    aliases: ['addnote'],
    category: 'reminder',
    desc: 'Save a note: .note <title> | <content>',
    run: async (ctx) => {
      const [title, ...bodyParts] = ctx.text.split(' ').slice(1).join(' ').split('|');
      if (!title?.trim()) return ctx.reply('Usage: .note <title> | <content>');
      await NoteModel.create({ owner: ctx.sender, title: title.trim(), body: bodyParts.join('|').trim() });
      await ctx.reply(`✅ Note saved: "${title.trim()}"`);
    }
  },
  {
    pattern: 'notes',
    category: 'reminder',
    desc: 'List your saved notes',
    run: async (ctx) => {
      const notes = await NoteModel.find({ owner: ctx.sender }).lean();
      if (!notes.length) return ctx.reply('You have no saved notes. Use .note <title> | <content>');
      await ctx.reply(notes.map((n, i) => `${i + 1}. *${n.title}*\n${n.body || ''}`).join('\n\n'));
    }
  },
  {
    pattern: 'delnote',
    category: 'reminder',
    desc: 'Delete a note by its number (from .notes): .delnote 2',
    run: async (ctx) => {
      const idx = parseInt(ctx.text.split(' ')[1]) - 1;
      const notes = await NoteModel.find({ owner: ctx.sender }).lean();
      if (isNaN(idx) || !notes[idx]) return ctx.reply('Usage: .delnote <number>  (see .notes for the list)');
      await NoteModel.findByIdAndDelete(notes[idx]._id);
      await ctx.reply('✅ Note deleted.');
    }
  }
];
