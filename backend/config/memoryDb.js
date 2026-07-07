// Shared in-memory data store for backend fallback mode

export let memoryRepos = [];
export let memoryPRs = [];

// Helper to seed memory data
export const seedMemoryDb = () => {
  if (memoryRepos.length > 0) return; // Already seeded

  memoryRepos = [
    {
      _id: 'repo11111111111111111111',
      name: 'facebook/react',
      owner: 'facebook',
      repoName: 'react',
      url: 'https://github.com/facebook/react',
      createdAt: new Date()
    },
    {
      _id: 'repo22222222222222222222',
      name: 'expressjs/express',
      owner: 'expressjs',
      repoName: 'express',
      url: 'https://github.com/expressjs/express',
      createdAt: new Date()
    },
    {
      _id: 'repo33333333333333333333',
      name: 'google/antigravity',
      owner: 'google',
      repoName: 'antigravity',
      url: 'https://github.com/google/antigravity',
      createdAt: new Date()
    }
  ];

  memoryPRs = [
    {
      _id: 'pr101101101101101101101101',
      repository: memoryRepos[0], // full object populated for memory mode
      number: 101,
      title: 'feat: Add user authentication and JWT middleware',
      author: {
        username: 'sarah_codes',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80'
      },
      state: 'open',
      sourceBranch: 'feature/auth-jwt',
      targetBranch: 'main',
      htmlUrl: 'https://github.com/facebook/react/pull/101',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      changedFilesCount: 5,
      additions: 120,
      deletions: 15,
      diffText: `diff --git a/backend/middleware/auth.js b/backend/middleware/auth.js
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
+`,
      aiSummary: {
        summary: 'Implements JWT-based user authentication middleware and secures application router paths.',
        bulletPoints: [
          'Created authMiddleware to extract and verify Bearer JWT tokens.',
          'Added custom error responses for unauthorized access attempts.',
          'Integrated middleware validation into global route handlers.'
        ],
        impactScore: 'High',
        rawDiffAnalysis: 'This PR secures the core API routes. It introduces a jwt verification step. Ensure JWT_SECRET environment variable is loaded in production and has a high entropy sequence to prevent brute force decoding.',
        generatedAt: new Date()
      },
      dependencies: [],
      dependents: []
    },
    {
      _id: 'pr102102102102102102102102',
      repository: memoryRepos[0],
      number: 102,
      title: 'fix: Resolve memory leak in event listener registration',
      author: {
        username: 'alex_dev',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80'
      },
      state: 'open',
      sourceBranch: 'bugfix/listener-leak',
      targetBranch: 'main',
      htmlUrl: 'https://github.com/facebook/react/pull/102',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      changedFilesCount: 2,
      additions: 12,
      deletions: 4,
      diffText: `diff --git a/frontend/src/components/PRCard.jsx b/frontend/src/components/PRCard.jsx
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
`,
      aiSummary: {
        summary: 'Fixes a memory leak in the dashboard PR card component by removing resize event listeners upon component unmounting.',
        bulletPoints: [
          'Added clean-up return handler inside useEffect hook in PRCard.',
          'Prevented garbage collector retention of detached DOM references.',
          'Improved window resize rendering efficiency slightly.'
        ],
        impactScore: 'Low',
        rawDiffAnalysis: 'Excellent patch fixing a standard React bug. Memory usage should remain flat now when navigating rapidly across views.',
        generatedAt: new Date()
      },
      dependencies: [], // Will link IDs below
      dependents: []
    },
    {
      _id: 'pr103103103103103103103103',
      repository: memoryRepos[0],
      number: 103,
      title: 'refactor: Migrate database schema to support tag relations',
      author: {
        username: 'john_doe',
        avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&h=80'
      },
      state: 'open',
      sourceBranch: 'refactor/tag-relations',
      targetBranch: 'dev',
      htmlUrl: 'https://github.com/facebook/react/pull/103',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      changedFilesCount: 4,
      additions: 45,
      deletions: 12,
      diffText: `diff --git a/backend/models/PR.js b/backend/models/PR.js
index c84192b..f159040 100644
--- a/backend/models/PR.js
+++ b/backend/models/PR.js
@@ -32,2 +32,5 @@
+  tags: [{
+    type: mongoose.Schema.Types.ObjectId,
+    ref: 'Tag'
+  }],
   dependencies: [{
`,
      aiSummary: {
        summary: 'Updates database model schemas to support relationships with custom Tags.',
        bulletPoints: [
          'Modified PR schema to contain tag object array links.',
          'Linked mongoose reference structures correctly.',
          'Created default indices on the tag collections.'
        ],
        impactScore: 'Medium',
        rawDiffAnalysis: 'Database model refactoring. Requires standard index rebuilding. Ensure the Tags collection has pre-existing seed entries prior to execution.',
        generatedAt: new Date()
      },
      dependencies: [],
      dependents: []
    },
    {
      _id: 'pr201201201201201201201201',
      repository: memoryRepos[1],
      number: 201,
      title: 'feat: Add rate limiting middleware to prevent DOS attacks',
      author: {
        username: 'james_b',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&h=80'
      },
      state: 'open',
      sourceBranch: 'feat/rate-limit',
      targetBranch: 'main',
      htmlUrl: 'https://github.com/expressjs/express/pull/201',
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      changedFilesCount: 3,
      additions: 60,
      deletions: 0,
      diffText: `diff --git a/server.js b/server.js
index 45e3fdd..d2c3e44 100644
--- a/server.js
+++ b/server.js
@@ -5,2 +5,7 @@
+import rateLimit from 'express-rate-limit';
+
+const limiter = rateLimit({
+  windowMs: 15 * 60 * 1000, // 15 mins
+  max: 100 // limit each IP to 100 requests per window
+});
+
 app.use(cors());
+app.use(limiter);
`,
      aiSummary: {
        summary: 'Integrates express-rate-limit to protect api routes from automated scrapers and DOS attacks.',
        bulletPoints: [
          'Imported express-rate-limit library.',
          'Configured sliding window limiter of 100 requests per 15 minutes per IP.',
          'Applied middleware globally across API entry points.'
        ],
        impactScore: 'Medium',
        rawDiffAnalysis: 'This middleware helps prevent API abuse. Ensure that reverse proxies (like Nginx) are configured to forward actual client IPs via trust-proxy headers so rate limits apply to users rather than the gateway proxy.',
        generatedAt: new Date()
      },
      dependencies: [],
      dependents: []
    },
    {
      _id: 'pr202202202202202202202202',
      repository: memoryRepos[1],
      number: 202,
      title: 'refactor: Rewrite routing engine in WebAssembly for 10x throughput',
      author: {
        username: 'lisa_m',
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&h=80'
      },
      state: 'open',
      sourceBranch: 'refactor/wasm-router',
      targetBranch: 'main',
      htmlUrl: 'https://github.com/expressjs/express/pull/202',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      changedFilesCount: 15,
      additions: 1240,
      deletions: 890,
      diffText: `diff --git a/src/wasm/router.rs b/src/wasm/router.rs
new file mode 100644
index 0000000..7ffaa8b
--- /dev/null
+++ b/src/wasm/router.rs
@@ -0,0 +1,78 @@
+use wasm_bindgen::prelude::*;
+
+#[wasm_bindgen]
+pub struct WASMRouter {
+    routes: Vec<String>,
+}
+
+#[wasm_bindgen]
+impl WASMRouter {
+    pub fn new() -> Self {
+        WASMRouter { routes: Vec::new() }
+    }
+...
+`,
      aiSummary: {
        summary: 'Migrates the path router matcher to a Rust-compiled WebAssembly engine to optimize high-volume route resolving.',
        bulletPoints: [
          'Created a WASM router module written in Rust.',
          'Replaced string splitting JS logics with regex matching in Rust.',
          'Setup WASM bindings and webpack build steps.'
        ],
        impactScore: 'Critical',
        rawDiffAnalysis: 'CRITICAL ARCHITECTURAL CHANGE: Rewriting the router in WebAssembly is a high-risk change. While it offers performance boosts, debugging compiled WASM in production is extremely difficult and can lead to unexpected server crashes if panic handling is not perfect. Proceed with caution and full test coverage.',
        generatedAt: new Date()
      },
      dependencies: [],
      dependents: []
    },
    {
      _id: 'pr301301301301301301301301',
      repository: memoryRepos[2],
      number: 301,
      title: 'feat: Implement vector search algorithm for semantic search',
      author: {
        username: 'alex_dev',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80'
      },
      state: 'open',
      sourceBranch: 'feat/vector-search',
      targetBranch: 'main',
      htmlUrl: 'https://github.com/google/antigravity/pull/301',
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      changedFilesCount: 7,
      additions: 340,
      deletions: 40,
      diffText: `diff --git a/src/search/vectors.js b/src/search/vectors.js
new file mode 100644
index 0000000..f99dd2b
--- /dev/null
+++ b/src/search/vectors.js
@@ -0,0 +1,30 @@
+export function cosineSimilarity(vecA, vecB) {
+  let dotProduct = 0.0;
+  let normA = 0.0;
+  let normB = 0.0;
+  for (let i = 0; i < vecA.length; i++) {
+    dotProduct += vecA[i] * vecB[i];
+    normA += vecA[i] * vecA[i];
+    normB += vecB[i] * vecB[i];
+  }
+  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
+}
+`,
      aiSummary: {
        summary: 'Adds standard cosine similarity algorithms to compare embedding vectors for natural language search queries.',
        bulletPoints: [
          'Implemented cosineSimilarity math formula.',
          'Added matrix query buffers.',
          'Linked vector outputs with the database queries.'
        ],
        impactScore: 'High',
        rawDiffAnalysis: 'High computations inside javascript main thread. Large vector dimensions might lead to event loop blocking. Consider moving vector operations to a web worker thread or database aggregate pipelines.',
        generatedAt: new Date()
      },
      dependencies: [],
      dependents: []
    }
  ];

  // Set up dependency references using memory objects
  const p101 = memoryPRs[0];
  const p102 = memoryPRs[1];
  const p103 = memoryPRs[2];
  const p201 = memoryPRs[3];
  const p202 = memoryPRs[4];

  // 102 depends on 101
  p102.dependencies = [p101._id];
  p101.dependents = [p102._id];

  // 103 depends on 102
  p103.dependencies = [p102._id];
  p102.dependents = [p103._id];

  // 202 depends on 201
  p202.dependencies = [p201._id];
  p201.dependents = [p202._id];

  // Cross-Repo: 202 also depends on 101
  p202.dependencies.push(p101._id);
  p101.dependents.push(p202._id);
};
