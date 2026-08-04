const mongoose = require('mongoose');
const chalk = require('chalk');

// Generic key/value document used to store Baileys auth creds + signal keys.
// _id = the auth key name (e.g. "creds", "app-state-sync-key-XXXX")
// value = JSON-stringified data (Baileys' own BufferJSON replacer/reviver handles Buffers)
const AuthSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  value: { type: String, required: true }
}, { collection: 'jagx_auth', versionKey: false });

const AuthModel = mongoose.models.JagxAuth || mongoose.model('JagxAuth', AuthSchema);

// Simple store used by anti-delete / view-once to persist a short-lived cache
// so it survives bot restarts (Render can restart your dyno at any time).
const CacheSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // message key id
  type: { type: String, enum: ['antidelete', 'viewonce'], required: true },
  chatId: String,
  sender: String,
  payload: String, // JSON stringified message content / base64 media ref
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 2 } // auto-expire after 2 days
}, { collection: 'jagx_cache', versionKey: false });

const CacheModel = mongoose.models.JagxCache || mongoose.model('JagxCache', CacheSchema);

async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in your environment variables.');
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(chalk.green('[DB] Connected to MongoDB'));
}

module.exports = { connectDB, AuthModel, CacheModel };
