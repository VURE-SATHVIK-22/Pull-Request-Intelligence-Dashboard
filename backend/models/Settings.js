import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  githubToken: { 
    type: String, 
    default: '' 
  },
  geminiApiKey: { 
    type: String, 
    default: '' 
  }
}, {
  timestamps: true
});

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
