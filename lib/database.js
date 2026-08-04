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

// --- Batch 2 models: moderation warnings, virtual economy, saved notes ---

const WarnSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // `${groupId}::${userId}`
  count: { type: Number, default: 0 }
}, { collection: 'jagx_warns', versionKey: false });
const WarnModel = mongoose.models.JagxWarn || mongoose.model('JagxWarn', WarnSchema);

const EconomySchema = new mongoose.Schema({
  _id: { type: String, required: true }, // userId
  balance: { type: Number, default: 0 },
  lastDaily: { type: Date, default: null },
  lastWork: { type: Date, default: null }
}, { collection: 'jagx_economy', versionKey: false });
const EconomyModel = mongoose.models.JagxEconomy || mongoose.model('JagxEconomy', EconomySchema);

const NoteSchema = new mongoose.Schema({
  owner: { type: String, required: true },
  title: { type: String, required: true },
  body: String,
  createdAt: { type: Date, default: Date.now }
}, { collection: 'jagx_notes', versionKey: false });
const NoteModel = mongoose.models.JagxNote || mongoose.model('JagxNote', NoteSchema);

const GroupConfigSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // groupId
  antibadword: { type: Boolean, default: false },
  antilink: { type: Boolean, default: false },
  rules: { type: String, default: '' },
  welcome: { type: Boolean, default: false },
  welcomeText: { type: String, default: '👋 Welcome @user to the group!' },
  goodbyeText: { type: String, default: '👋 @user left the group.' }
}, { collection: 'jagx_group_config', versionKey: false });
const GroupConfigModel = mongoose.models.JagxGroupConfig || mongoose.model('JagxGroupConfig', GroupConfigSchema);

// Tracks private chats that have already been greeted with the channel invite,
// so we only send it once per person.
const SeenUserSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // userId
  firstSeen: { type: Date, default: Date.now }
}, { collection: 'jagx_seen_users', versionKey: false });
const SeenUserModel = mongoose.models.JagxSeenUser || mongoose.model('JagxSeenUser', SeenUserSchema);

module.exports = { connectDB, AuthModel, CacheModel, WarnModel, EconomyModel, NoteModel, GroupConfigModel, SeenUserModel };
