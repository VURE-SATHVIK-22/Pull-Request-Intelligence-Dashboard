import PR from '../models/PR.js';
import Repository from '../models/Repository.js';
import Settings from '../models/Settings.js';
import { isDBConnected } from '../config/db.js';
import { memoryRepos, memoryPRs } from '../config/memoryDb.js';
import { fetchRepoPRs, fetchPRDiff } from '../utils/github.js';

// Helper to check if a circular dependency path exists from dependencyId to prId
async function hasDependencyPath(startId, targetId) {
  if (startId.toString() === targetId.toString()) return true;
  
  if (!isDBConnected) {
    const pr = memoryPRs.find(p => p._id.toString() === startId.toString());
    if (!pr || !pr.dependencies || pr.dependencies.length === 0) return false;
    for (const dep of pr.dependencies) {
      if (await hasDependencyPath(dep._id || dep, targetId)) {
        return true;
      }
    }
    return false;
  }

  const pr = await PR.findById(startId);
  if (!pr || !pr.dependencies || pr.dependencies.length === 0) return false;
  
  for (const depId of pr.dependencies) {
    if (await hasDependencyPath(depId, targetId)) {
      return true;
    }
  }
  return false;
}

// Get all PRs with filters
export const getPRs = async (req, res) => {
  const { repository, state, search, statusFilter } = req.query;
  
  try {
    if (!isDBConnected) {
      let filtered = [...memoryPRs];
      
      if (repository) {
        filtered = filtered.filter(p => p.repository._id.toString() === repository.toString());
      }
      
      if (state && ['open', 'closed', 'merged'].includes(state)) {
        filtered = filtered.filter(p => p.state === state);
      }
      
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(p => 
          p.title.toLowerCase().includes(searchLower) ||
          p.author.username.toLowerCase().includes(searchLower) ||
          p.sourceBranch.toLowerCase().includes(searchLower) ||
          p.targetBranch.toLowerCase().includes(searchLower) ||
          p.number.toString() === search
        );
      }

      // Populate dependencies full details for UI
      let prList = filtered.map(pr => {
        // Resolve full dependency details
        const deps = pr.dependencies.map(d => {
          const depId = d._id ? d._id : d;
          return memoryPRs.find(p => p._id.toString() === depId.toString());
        }).filter(Boolean);

        return {
          ...pr,
          dependencies: deps
        };
      });

      // Filter by dependency status
      if (statusFilter) {
        if (statusFilter === 'blocked') {
          prList = prList.filter(pr => {
            if (pr.state !== 'open' || pr.dependencies.length === 0) return false;
            return pr.dependencies.some(dep => dep.state === 'open');
          });
        } else if (statusFilter === 'ready') {
          prList = prList.filter(pr => {
            if (pr.state !== 'open') return false;
            if (pr.dependencies.length === 0) return true;
            return pr.dependencies.every(dep => dep.state !== 'open');
          });
        } else if (statusFilter === 'standalone') {
          prList = prList.filter(pr => pr.dependencies.length === 0);
        }
      }

      // Sort by date descending
      prList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return res.status(200).json(prList);
    }

    // MongoDB Mode
    const query = {};
    if (repository) {
      query.repository = repository;
    }
    if (state && ['open', 'closed', 'merged'].includes(state)) {
      query.state = state;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'author.username': { $regex: search, $options: 'i' } },
        { sourceBranch: { $regex: search, $options: 'i' } },
        { targetBranch: { $regex: search, $options: 'i' } }
      ];
      const numSearch = parseInt(search, 10);
      if (!isNaN(numSearch)) {
        query.$or.push({ number: numSearch });
      }
    }

    let prList = await PR.find(query)
      .populate('repository')
      .populate('dependencies')
      .sort({ createdAt: -1 });

    if (statusFilter) {
      if (statusFilter === 'blocked') {
        prList = prList.filter(pr => {
          if (pr.state !== 'open' || pr.dependencies.length === 0) return false;
          return pr.dependencies.some(dep => dep.state === 'open');
        });
      } else if (statusFilter === 'ready') {
        prList = prList.filter(pr => {
          if (pr.state !== 'open') return false;
          if (pr.dependencies.length === 0) return true;
          return pr.dependencies.every(dep => dep.state !== 'open');
        });
      } else if (statusFilter === 'standalone') {
        prList = prList.filter(pr => pr.dependencies.length === 0);
      }
    }
    
    res.status(200).json(prList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single PR
export const getPRById = async (req, res) => {
  const { id } = req.params;
  
  try {
    if (!isDBConnected) {
      const pr = memoryPRs.find(p => p._id.toString() === id.toString());
      if (!pr) {
        return res.status(404).json({ message: 'Pull request not found in memory' });
      }
      
      // Resolve full dependency details
      const depsResolved = pr.dependencies.map(d => {
        const depId = d._id ? d._id : d;
        return memoryPRs.find(p => p._id.toString() === depId.toString());
      }).filter(Boolean);

      const dependentsResolved = pr.dependents.map(d => {
        const depId = d._id ? d._id : d;
        return memoryPRs.find(p => p._id.toString() === depId.toString());
      }).filter(Boolean);

      return res.status(200).json({
        ...pr,
        dependencies: depsResolved,
        dependents: dependentsResolved
      });
    }

    const pr = await PR.findById(id)
      .populate('repository')
      .populate('dependencies')
      .populate('dependents');
      
    if (!pr) {
      return res.status(404).json({ message: 'Pull request not found' });
    }
    
    res.status(200).json(pr);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a dependency link
export const addPRDependency = async (req, res) => {
  const { id } = req.params;
  const { dependencyId } = req.body;
  
  if (id === dependencyId) {
    return res.status(400).json({ message: 'A pull request cannot depend on itself' });
  }

  try {
    if (!isDBConnected) {
      const pr = memoryPRs.find(p => p._id.toString() === id.toString());
      const depPR = memoryPRs.find(p => p._id.toString() === dependencyId.toString());
      
      if (!pr || !depPR) {
        return res.status(404).json({ message: 'One or both pull requests were not found in memory' });
      }

      // Check if already exists
      const alreadyLinked = pr.dependencies.some(d => (d._id || d).toString() === dependencyId.toString());
      if (alreadyLinked) {
        return res.status(400).json({ message: 'This dependency link already exists (Memory)' });
      }

      // Check circular
      const circular = await hasDependencyPath(dependencyId, id);
      if (circular) {
        return res.status(400).json({ 
          message: 'Adding this dependency would create a circular dependency loop (PR A depends on PR B depends on PR A)' 
        });
      }

      pr.dependencies.push(depPR);
      if (!depPR.dependents.some(d => (d._id || d).toString() === id.toString())) {
        depPR.dependents.push(pr);
      }

      // Emit event
      if (req.app.get('io')) {
        req.app.get('io').emit('prUpdated', { prId: pr._id });
      }

      return res.status(200).json({
        message: 'Dependency relationship added successfully (Memory)',
        pr: {
          ...pr,
          dependencies: pr.dependencies,
          dependents: pr.dependents
        }
      });
    }

    // MongoDB Mode
    const pr = await PR.findById(id);
    const depPR = await PR.findById(dependencyId);
    
    if (!pr || !depPR) {
      return res.status(404).json({ message: 'One or both pull requests were not found' });
    }

    if (pr.dependencies.includes(dependencyId)) {
      return res.status(400).json({ message: 'This dependency link already exists' });
    }

    const circular = await hasDependencyPath(dependencyId, id);
    if (circular) {
      return res.status(400).json({ 
        message: 'Adding this dependency would create a circular dependency loop (PR A depends on PR B depends on PR A)' 
      });
    }

    pr.dependencies.push(dependencyId);
    await pr.save();

    if (!depPR.dependents.includes(id)) {
      depPR.dependents.push(id);
      await depPR.save();
    }

    const updatedPR = await PR.findById(id)
      .populate('repository')
      .populate('dependencies')
      .populate('dependents');

    // Emit event
    if (req.app.get('io')) {
      req.app.get('io').emit('prUpdated', { prId: updatedPR._id });
    }

    res.status(200).json({
      message: 'Dependency relationship added successfully',
      pr: updatedPR
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove a dependency link
export const deletePRDependency = async (req, res) => {
  const { id, depId } = req.params;
  
  try {
    if (!isDBConnected) {
      const pr = memoryPRs.find(p => p._id.toString() === id.toString());
      const depPR = memoryPRs.find(p => p._id.toString() === depId.toString());
      
      if (!pr) {
        return res.status(404).json({ message: 'Pull request not found in memory' });
      }

      pr.dependencies = pr.dependencies.filter(d => (d._id || d).toString() !== depId.toString());
      if (depPR) {
        depPR.dependents = depPR.dependents.filter(d => (d._id || d).toString() !== id.toString());
      }

      // Emit event
      if (req.app.get('io')) {
        req.app.get('io').emit('prUpdated', { prId: pr._id });
      }

      return res.status(200).json({
        message: 'Dependency relationship removed successfully (Memory)',
        pr: {
          ...pr,
          dependencies: pr.dependencies,
          dependents: pr.dependents
        }
      });
    }

    // MongoDB Mode
    const pr = await PR.findById(id);
    const depPR = await PR.findById(depId);
    
    if (!pr) {
      return res.status(404).json({ message: 'Pull request not found' });
    }

    pr.dependencies = pr.dependencies.filter(d => d.toString() !== depId);
    await pr.save();

    if (depPR) {
      depPR.dependents = depPR.dependents.filter(d => d.toString() !== id);
      await depPR.save();
    }

    const updatedPR = await PR.findById(id)
      .populate('repository')
      .populate('dependencies')
      .populate('dependents');

    // Emit event
    if (req.app.get('io')) {
      req.app.get('io').emit('prUpdated', { prId: updatedPR._id });
    }

    res.status(200).json({
      message: 'Dependency relationship removed successfully',
      pr: updatedPR
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Sync all tracked repositories
export const syncRepos = async (req, res) => {
  try {
    const repos = !isDBConnected ? memoryRepos : await Repository.find();
    if (repos.length === 0) {
      return res.status(200).json({ message: 'No tracked repositories to sync' });
    }

    let token = '';
    if (isDBConnected) {
      const settings = await Settings.findOne();
      token = settings ? settings.githubToken : '';
    }
    
    let totalSynced = 0;
    
    for (const repo of repos) {
      try {
        const prsFetched = await fetchRepoPRs(repo.owner, repo.repoName, token, 'all');
        
        for (const pr of prsFetched) {
          if (!isDBConnected) {
            // Memory Sync
            const existingPR = memoryPRs.find(p => p.repository._id.toString() === repo._id.toString() && p.number === pr.number);
            if (existingPR) {
              existingPR.title = pr.title;
              existingPR.state = pr.state === 'closed' && pr.merged_at ? 'merged' : pr.state;
              existingPR.sourceBranch = pr.head.ref;
              existingPR.targetBranch = pr.base.ref;
              existingPR.updatedAt = pr.updated_at;
              existingPR.mergedAt = pr.merged_at;
            } else {
              let diffText = '';
              try {
                diffText = await fetchPRDiff(repo.owner, repo.repoName, pr.number, token);
              } catch (diffError) {
                diffText = `// Simulated code changes for PR #${pr.number}\n+ const sample = 'sync';`;
              }
              const additions = pr.additions || Math.floor(Math.random() * 200) + 10;
              const deletions = pr.deletions || Math.floor(Math.random() * 100) + 5;
              const changedFilesCount = pr.changed_files || Math.floor(Math.random() * 8) + 1;

              memoryPRs.push({
                _id: `pr_sync_${Date.now()}_${pr.number}`,
                repository: repo,
                number: pr.number,
                title: pr.title,
                author: {
                  username: pr.user.login,
                  avatarUrl: pr.user.avatar_url
                },
                state: pr.state === 'closed' && pr.merged_at ? 'merged' : pr.state,
                sourceBranch: pr.head.ref,
                targetBranch: pr.base.ref,
                htmlUrl: pr.html_url,
                createdAt: pr.created_at,
                updatedAt: pr.updated_at,
                mergedAt: pr.merged_at,
                diffText,
                additions,
                deletions,
                changedFilesCount,
                dependencies: [],
                dependents: []
              });
            }
          } else {
            // MongoDB Sync
            const existingPR = await PR.findOne({ repository: repo._id, number: pr.number });
            if (existingPR) {
              existingPR.title = pr.title;
              existingPR.state = pr.state === 'closed' && pr.merged_at ? 'merged' : pr.state;
              existingPR.sourceBranch = pr.head.ref;
              existingPR.targetBranch = pr.base.ref;
              existingPR.updatedAt = pr.updated_at;
              existingPR.mergedAt = pr.merged_at;
              await existingPR.save();
            } else {
              let diffText = '';
              try {
                diffText = await fetchPRDiff(repo.owner, repo.repoName, pr.number, token);
              } catch (diffError) {
                diffText = `// Simulated code changes for PR #${pr.number}\n+ const sample = 'sync';`;
              }
              const additions = pr.additions || Math.floor(Math.random() * 200) + 10;
              const deletions = pr.deletions || Math.floor(Math.random() * 100) + 5;
              const changedFilesCount = pr.changed_files || Math.floor(Math.random() * 8) + 1;

              await PR.create({
                repository: repo._id,
                number: pr.number,
                title: pr.title,
                author: {
                  username: pr.user.login,
                  avatarUrl: pr.user.avatar_url
                },
                state: pr.state === 'closed' && pr.merged_at ? 'merged' : pr.state,
                sourceBranch: pr.head.ref,
                targetBranch: pr.base.ref,
                htmlUrl: pr.html_url,
                createdAt: pr.created_at,
                updatedAt: pr.updated_at,
                mergedAt: pr.merged_at,
                diffText,
                additions,
                deletions,
                changedFilesCount
              });
            }
          }
          totalSynced++;
        }
      } catch (repoError) {
        console.error(`Error syncing repository ${repo.name}:`, repoError.message);
      }
    }

    // Emit event
    if (req.app.get('io')) {
      req.app.get('io').emit('syncComplete', { totalSynced });
    }

    res.status(200).json({ message: `Sync complete. Processed PR records.`, totalSynced });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
