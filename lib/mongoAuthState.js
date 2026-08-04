const { proto } = require('@whiskeysockets/baileys');
const { initAuthCreds, BufferJSON } = require('@whiskeysockets/baileys');
const { AuthModel } = require('./database');

// Mirrors Baileys' useMultiFileAuthState, but reads/writes each key as a
// document in MongoDB instead of a file on disk. This is what lets the bot
// stay logged in across Render restarts/redeploys, since Render's disk is
// not guaranteed to persist.

async function readData(key) {
  const doc = await AuthModel.findById(key).lean();
  if (!doc) return null;
  return JSON.parse(doc.value, BufferJSON.reviver);
}

async function writeData(key, value) {
  const json = JSON.stringify(value, BufferJSON.replacer);
  await AuthModel.findByIdAndUpdate(key, { _id: key, value: json }, { upsert: true });
}

async function removeData(key) {
  await AuthModel.findByIdAndDelete(key);
}

async function useMongoAuthState() {
  const creds = (await readData('creds')) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              if (type === 'app-state-sync-key' && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data) => {
          const tasks = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              tasks.push(value ? writeData(key, value) : removeData(key));
            }
          }
          await Promise.all(tasks);
        }
      }
    },
    saveCreds: async () => {
      await writeData('creds', creds);
    }
  };
}

module.exports = { useMongoAuthState };
