import Repository from '../models/Repository.js';
import PR from '../models/PR.js';
import Settings from '../models/Settings.js';
import { isDBConnected } from '../config/db.js';
import { memoryRepos, memoryPRs } from '../config/memoryDb.js';
import { fetchRepoInfo, fetchRepoPRs, fetchPRDiff } from '../utils/github.js';

// Get all repositories with PR counts
export const getRepos = async (req, res) => {
  try {
    if (!isDBConnected) {
      const reposWithCounts = memoryRepos.map((repo) => {
        const prCount = memoryPRs.filter(p => p.repository._id.toString() === repo._id.toString()).length;
        const openPrCount = memoryPRs.filter(
          p => p.repository._id.toString() === repo._id.toString() && p.state === 'open'
        ).length;
        return {
          ...repo,
          prCount,
          openPrCount,
          mode: 'memory'
        };
      });
      return res.status(200).json(reposWithCounts);
    }

    const repos = await Repository.find();
    
    // Add PR counts
    const reposWithCounts = await Promise.all(
      repos.map(async (repo) => {
        const prCount = await PR.countDocuments({ repository: repo._id });
        const openPrCount = await PR.countDocuments({ repository: repo._id, state: 'open' });
        return {
          ...repo.toObject(),
          prCount,
          openPrCount,
          mode: 'mongodb'
        };
      })
    );
    
    res.status(200).json(reposWithCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a repository and sync its pull requests
export const addRepo = async (req, res) => {
  const { name } = req.body;
  
  if (!name || !name.includes('/')) {
    return res.status(400).json({ message: 'Invalid repository name. Format: owner/repoName' });
  }

  const [owner, repoName] = name.split('/');

  try {
    // Check if repo already exists
    if (!isDBConnected) {
      const existing = memoryRepos.find(r => r.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        return res.status(400).json({ message: 'Repository is already tracked (Memory)' });
      }
    } else {
      const existingRepo = await Repository.findOne({ name: name.toLowerCase() });
      if (existingRepo) {
        return res.status(400).json({ message: 'Repository is already tracked' });
      }
    }

    // Get GitHub Token
    let token = '';
    if (isDBConnected) {
      const settings = await Settings.findOne();
      token = settings ? settings.githubToken : '';
    }

    let repoData;
    let fallbackMock = false;

    try {
      repoData = await fetchRepoInfo(owner, repoName, token);
    } catch (apiError) {
      console.warn('Could not fetch from GitHub API. Falling back to mock details:', apiError.message);
      fallbackMock = true;
      repoData = {
        name: repoName,
        full_name: `${owner}/${repoName}`,
        html_url: `https://github.com/${owner}/${repoName}`,
        owner: { login: owner }
      };
    }

    // Prepare repo object
    const newRepoData = {
      name: repoData.full_name.toLowerCase(),
      owner: repoData.owner.login,
      repoName: repoData.name,
      url: repoData.html_url
    };

    let savedRepo;

    if (!isDBConnected) {
      savedRepo = {
        _id: `repo_${Date.now()}`,
        ...newRepoData,
        createdAt: new Date()
      };
      memoryRepos.push(savedRepo);
    } else {
      const newRepo = new Repository(newRepoData);
      savedRepo = await newRepo.save();
    }

    // Pull PRs
    let prsFetched = [];
    if (!fallbackMock) {
      try {
        prsFetched = await fetchRepoPRs(owner, repoName, token, 'all');
      } catch (prError) {
        console.warn('Could not fetch PRs from GitHub. Generating mock PRs.', prError.message);
        fallbackMock = true;
      }
    }

    if (fallbackMock || prsFetched.length === 0) {
      // Generate some mock PRs for demo
      const mockPrs = generateMockPRsForRepo(savedRepo);
      if (!isDBConnected) {
        memoryPRs.push(...mockPrs);
      } else {
        await PR.insertMany(mockPrs);
      }
    } else {
      // Save fetched PRs
      for (const pr of prsFetched) {
        let diffText = '';
        try {
          diffText = await fetchPRDiff(owner, repoName, pr.number, token);
        } catch (diffError) {
          diffText = `// Simulated code changes for PR #${pr.number}\n+ const mockCode = 'example';\n- const oldCode = 'obsolete';`;
        }

        const additions = pr.additions || Math.floor(Math.random() * 200) + 10;
        const deletions = pr.deletions || Math.floor(Math.random() * 100) + 5;
        const changedFilesCount = pr.changed_files || Math.floor(Math.random() * 8) + 1;

        const prObj = {
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
        };

        if (!isDBConnected) {
          memoryPRs.push({
            _id: `pr_${Date.now()}_${pr.number}`,
            repository: savedRepo,
            ...prObj
          });
        } else {
          await PR.create({
            repository: savedRepo._id,
            ...prObj
          });
        }
      }
    }

    res.status(201).json({
      message: `Repository ${savedRepo.name} successfully added and synced`,
      repository: savedRepo
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a repository and its PRs
export const deleteRepo = async (req, res) => {
  const { id } = req.params;
  try {
    if (!isDBConnected) {
      const idx = memoryRepos.findIndex(r => r._id.toString() === id.toString());
      if (idx === -1) {
        return res.status(404).json({ message: 'Repository not found in memory' });
      }
      
      const repoName = memoryRepos[idx].name;
      // Delete from memory arrays
      memoryPRs.forEach((pr, i) => {
        if (pr.repository._id.toString() === id.toString()) {
          // Remove dependency links from other PRs
          memoryPRs.forEach(otherPr => {
            otherPr.dependencies = otherPr.dependencies.filter(d => d._id.toString() !== pr._id.toString());
            otherPr.dependents = otherPr.dependents.filter(d => d._id.toString() !== pr._id.toString());
          });
        }
      });
      
      // Filter out PRs
      const remainingPrs = memoryPRs.filter(p => p.repository._id.toString() !== id.toString());
      memoryPRs.length = 0;
      memoryPRs.push(...remainingPrs);
      
      // Delete repo
      memoryRepos.splice(idx, 1);
      
      return res.status(200).json({ message: `Repository ${repoName} and all related PRs deleted successfully (Memory)` });
    }

    const repo = await Repository.findById(id);
    if (!repo) {
      return res.status(404).json({ message: 'Repository not found' });
    }

    // Delete all associated PRs
    await PR.deleteMany({ repository: id });
    await Repository.findByIdAndDelete(id);

    res.status(200).json({ message: `Repository ${repo.name} and all related PRs deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mock PR Generator
function generateMockPRsForRepo(repo) {
  const authorNames = ['alex_dev', 'sara_codes', 'john_doe', 'lisa_m', 'james_b'];
  const avatars = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&h=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&h=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&h=80'
  ];

  const mockTemplates = [
    {
      number: 101,
      title: 'feat: Add user authentication and JWT middleware',
      source: 'feature/auth-jwt',
      target: 'main',
      authorIdx: 0,
      state: 'open',
      diff: `diff --git a/backend/middleware/auth.js b/backend/middleware/auth.js
new file mode 100644
index 0000000..8e3fd0b
--- /dev/null
+++ b/backend/middleware/auth.js
@@ -0,0 +1,24 @@
+import jwt from 'jsonwebtoken';
+
+export const authMiddleware = (req, res, next) => {
+  const token = req.header('Authorization')?.replace('Bearer ', '');
+  if (!token) {
+    return res.status(401).json({ error: 'Authentication required. No token.' });
+  }
+  try {
+    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
+    req.user = decoded;
+    next();
+  } catch (error) {
+    res.status(401).json({ error: 'Token is invalid or expired.' });
+  }
+};
+`
    },
    {
      number: 102,
      title: 'fix: Resolve memory leak in event listener registration',
      source: 'bugfix/listener-leak',
      target: 'main',
      authorIdx: 1,
      state: 'open',
      diff: `diff --git a/frontend/src/components/PRCard.jsx b/frontend/src/components/PRCard.jsx
index b3c2004..a2cd004 100644
--- a/frontend/src/components/PRCard.jsx
+++ b/frontend/src/components/PRCard.jsx
@@ -12,4 +12,12 @@ export default function PRCard({ pr }) {
   useEffect(() => {
     window.addEventListener('resize', handleResize);
-    // Missing cleanup leading to leakage
+    return () => {
+      window.removeEventListener('resize', handleResize);
+    };
   }, []);
`
    }
  ];

  return mockTemplates.map((tpl, index) => {
    const additions = (tpl.diff.match(/^\+ /gm) || []).length;
    const deletions = (tpl.diff.match(/^\- /gm) || []).length;
    const changedFilesCount = Math.floor(Math.random() * 4) + 1;
    
    const dateOffset = index * 2;
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - dateOffset);
    
    return {
      _id: `pr_mock_${Date.now()}_${tpl.number}`,
      repository: isDBConnected ? repo._id : repo,
      number: tpl.number,
      title: tpl.title,
      author: {
        username: authorNames[tpl.authorIdx],
        avatarUrl: avatars[tpl.authorIdx]
      },
      state: tpl.state,
      sourceBranch: tpl.source,
      targetBranch: tpl.target,
      htmlUrl: `${repo.url}/pull/${tpl.number}`,
      createdAt: createdDate,
      updatedAt: createdDate,
      mergedAt: tpl.state === 'merged' ? new Date() : null,
      diffText: tpl.diff,
      additions,
      deletions,
      changedFilesCount,
      dependencies: [],
      dependents: []
    };
  });
}
