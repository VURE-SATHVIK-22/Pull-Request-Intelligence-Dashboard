import mongoose from 'mongoose';

const repositorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true // e.g., "facebook/react"
  },
  owner: { 
    type: String, 
    required: true 
  },
  repoName: { 
    type: String, 
    required: true 
  },
  url: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const Repository = mongoose.model('Repository', repositorySchema);
export default Repository;
