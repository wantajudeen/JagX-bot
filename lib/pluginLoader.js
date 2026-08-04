const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * Every plugin file must module.exports an object (or array of objects):
 * {
 *   pattern: 'ping',              // command name, no prefix
 *   aliases: ['p'],                // optional extra names
 *   category: 'core',              // used for the .menu grouping
 *   desc: 'Check if bot is alive', // shown in .menu
 *   ownerOnly: false,               // restrict to OWNER_NUMBERS
 *   groupOnly: false,               // restrict to groups
 *   run: async (ctx) => { ... }     // handler, see ctx shape in messageHandler.js
 * }
 */
function loadPlugins() {
  const commands = new Map();
  const pluginsDir = path.join(__dirname, '..', 'plugins');

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('.js')) {
        try {
          delete require.cache[require.resolve(full)];
          const mod = require(full);
          const list = Array.isArray(mod) ? mod : [mod];
          for (const plugin of list) {
            if (!plugin || !plugin.pattern || !plugin.run) continue;
            commands.set(plugin.pattern.toLowerCase(), plugin);
            (plugin.aliases || []).forEach((a) => commands.set(a.toLowerCase(), plugin));
          }
        } catch (err) {
          console.log(chalk.red(`[PLUGIN] Failed to load ${full}: ${err.message}`));
        }
      }
    }
  }

  walk(pluginsDir);
  console.log(chalk.cyan(`[PLUGIN] Loaded ${commands.size} command aliases`));
  return commands;
}

module.exports = { loadPlugins };
