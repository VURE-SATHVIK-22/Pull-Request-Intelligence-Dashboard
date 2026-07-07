import dotenv from 'dotenv';
dotenv.config();

/**
 * Helper to build headers for GitHub API request.
 */
function getHeaders(token) {
  const gitToken = token || process.env.GITHUB_TOKEN;
  const headers = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'PR-Dashboard-App'
  };
  if (gitToken) {
    headers['Authorization'] = `Bearer ${gitToken}`;
  }
  return headers;
}

/**
 * Fetch general repo info from GitHub.
 */
export async function fetchRepoInfo(owner, repoName, token) {
  const url = `https://api.github.com/repos/${owner}/${repoName}`;
  const response = await fetch(url, { headers: getHeaders(token) });
  
  if (!response.ok) {
    throw new Error(`GitHub API Error: ${response.statusText} (${response.status})`);
  }
  
  return await response.json();
}

/**
 * Fetch pull requests for a repository.
 * Returns up to 30 PRs.
 */
export async function fetchRepoPRs(owner, repoName, token, state = 'all') {
  const url = `https://api.github.com/repos/${owner}/${repoName}/pulls?state=${state}&per_page=30`;
  const response = await fetch(url, { headers: getHeaders(token) });
  
  if (!response.ok) {
    throw new Error(`GitHub API Error: ${response.statusText} (${response.status})`);
  }
  
  return await response.json();
}

/**
 * Fetch raw diff text for a specific PR.
 */
export async function fetchPRDiff(owner, repoName, prNumber, token) {
  const url = `https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}`;
  
  const headers = getHeaders(token);
  // Using the github diff media type gives us raw diffs directly!
  headers['Accept'] = 'application/vnd.github.diff';
  
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    throw new Error(`GitHub API Error: ${response.statusText} (${response.status})`);
  }
  
  return await response.text();
}
