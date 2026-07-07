import mongoose from 'mongoose';

const prSchema = new mongoose.Schema({
  repository: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Repository', 
    required: true 
  },
  number: { 
    type: Number, 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  author: {
    username: { type: String, required: true },
    avatarUrl: { type: String, default: '' }
  },
  state: { 
    type: String, 
    enum: ['open', 'closed', 'merged'], 
    default: 'open' 
  },
  sourceBranch: { 
    type: String, 
    required: true 
  },
  targetBranch: { 
    type: String, 
    required: true 
  },
  htmlUrl: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    required: true 
  },
  updatedAt: { 
    type: Date, 
    required: true 
  },
  mergedAt: { 
    type: Date 
  },
  
  // Code changes details
  diffText: { 
    type: String, 
    default: '' 
  },
  changedFilesCount: { 
    type: Number, 
    default: 0 
  },
  additions: { 
    type: Number, 
    default: 0 
  },
  deletions: { 
    type: Number, 
    default: 0 
  },

  // AI-Powered Summarization
  aiSummary: {
    summary: { type: String, default: '' },
    bulletPoints: [{ type: String }],
    impactScore: { 
      type: String, 
      enum: ['Low', 'Medium', 'High', 'Critical', 'None'], 
      default: 'None' 
    },
    rawDiffAnalysis: { type: String, default: '' },
    generatedAt: { type: Date }
  },
  
  // Dependency relationships (same-repo or cross-repo PR dependencies)
  dependencies: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PR' 
  }],
  dependents: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PR' 
  }]
}, {
  timestamps: true
});

// Compound unique index to make sure a PR number is unique within a repository
prSchema.index({ repository: 1, number: 1 }, { unique: true });

const PR = mongoose.model('PR', prSchema);
export default PR;
