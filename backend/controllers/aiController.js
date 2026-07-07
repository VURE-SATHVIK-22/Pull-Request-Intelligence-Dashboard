import PR from '../models/PR.js';
import Settings from '../models/Settings.js';
import { isDBConnected } from '../config/db.js';
import { memoryPRs } from '../config/memoryDb.js';
import { summarizePRDiff } from '../utils/ai.js';

// Trigger Gemini API code summarization for a specific PR
export const generatePRSummary = async (req, res) => {
  const { id } = req.params;
  
  try {
    let pr;
    let apiKey = '';

    if (!isDBConnected) {
      pr = memoryPRs.find(p => p._id.toString() === id.toString());
    } else {
      pr = await PR.findById(id);
      
      const settings = await Settings.findOne();
      apiKey = settings ? settings.geminiApiKey : '';
    }

    if (!pr) {
      return res.status(404).json({ message: 'Pull request not found' });
    }

    if (!pr.diffText) {
      return res.status(400).json({ message: 'No code diff text found for this pull request' });
    }

    // Call summarizer (will auto-mock if apiKey is missing)
    const summaryData = await summarizePRDiff(pr.title, pr.diffText, apiKey);
    
    // Save AI findings
    const aiSummary = {
      summary: summaryData.summary,
      bulletPoints: summaryData.bulletPoints,
      impactScore: summaryData.impactScore,
      rawDiffAnalysis: summaryData.rawDiffAnalysis,
      generatedAt: new Date()
    };

    if (!isDBConnected) {
      pr.aiSummary = aiSummary;
    } else {
      pr.aiSummary = aiSummary;
      await pr.save();
    }

    res.status(200).json({
      message: 'AI code summarization generated successfully',
      aiSummary
    });
  } catch (error) {
    res.status(500).json({ message: `AI Summarization Error: ${error.message}` });
  }
};
