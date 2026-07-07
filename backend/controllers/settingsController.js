import Settings from '../models/Settings.js';
import { isDBConnected } from '../config/db.js';

// Local memory fallback
let memorySettings = {
  githubToken: '',
  geminiApiKey: ''
};

const maskKey = (key) => {
  if (!key) return '';
  if (key.length <= 8) return '********';
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
};

// Get current configuration
export const getSettings = async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(200).json({
        githubTokenMasked: maskKey(memorySettings.githubToken),
        geminiApiKeyMasked: maskKey(memorySettings.geminiApiKey),
        hasGithubToken: !!memorySettings.githubToken,
        hasGeminiApiKey: !!memorySettings.geminiApiKey,
        mode: 'memory'
      });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ githubToken: '', geminiApiKey: '' });
    }
    
    res.status(200).json({
      githubTokenMasked: maskKey(settings.githubToken),
      geminiApiKeyMasked: maskKey(settings.geminiApiKey),
      hasGithubToken: !!settings.githubToken,
      hasGeminiApiKey: !!settings.geminiApiKey,
      mode: 'mongodb'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update configuration
export const updateSettings = async (req, res) => {
  const { githubToken, geminiApiKey } = req.body;
  try {
    if (!isDBConnected) {
      if (githubToken !== undefined && !githubToken.includes('...')) {
        memorySettings.githubToken = githubToken;
      }
      if (geminiApiKey !== undefined && !geminiApiKey.includes('...')) {
        memorySettings.geminiApiKey = geminiApiKey;
      }
      return res.status(200).json({
        message: 'Settings updated successfully (In-Memory)',
        githubTokenMasked: maskKey(memorySettings.githubToken),
        geminiApiKeyMasked: maskKey(memorySettings.geminiApiKey),
        hasGithubToken: !!memorySettings.githubToken,
        hasGeminiApiKey: !!memorySettings.geminiApiKey,
        mode: 'memory'
      });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    if (githubToken !== undefined && !githubToken.includes('...')) {
      settings.githubToken = githubToken;
    }
    if (geminiApiKey !== undefined && !geminiApiKey.includes('...')) {
      settings.geminiApiKey = geminiApiKey;
    }

    await settings.save();
    
    res.status(200).json({
      message: 'Settings updated successfully',
      githubTokenMasked: maskKey(settings.githubToken),
      geminiApiKeyMasked: maskKey(settings.geminiApiKey),
      hasGithubToken: !!settings.githubToken,
      hasGeminiApiKey: !!settings.geminiApiKey,
      mode: 'mongodb'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Internal getter to fetch actual settings (unmasked) for controllers
export const getActiveTokens = async () => {
  if (!isDBConnected) {
    return memorySettings;
  }
  try {
    let settings = await Settings.findOne();
    return settings || { githubToken: '', geminiApiKey: '' };
  } catch (e) {
    return { githubToken: '', geminiApiKey: '' };
  }
};
