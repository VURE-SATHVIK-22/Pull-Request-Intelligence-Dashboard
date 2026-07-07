const { execSync } = require('child_process');
const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function run() {
  console.log('==================================================');
  console.log('     PrismAI GitHub Repository Creation & Push    ');
  console.log('==================================================\n');

  const username = (await question('Enter your GitHub Username: ')).trim();
  const token = (await question('Enter your GitHub Personal Access Token (PAT): ')).trim();

  if (!username || !token) {
    console.error('Error: Username and Token are required.');
    rl.close();
    process.exit(1);
  }

  rl.close();

  const repoName = 'prism-ai-pr-tracker';
  const description = 'Intelligent full-stack pull request dependency tracker with Gemini AI code reviews.';

  console.log(`\n1. Creating repository "${repoName}" on GitHub...`);

  const data = JSON.stringify({
    name: repoName,
    description: description,
    private: false,
    auto_init: false
  });

  const options = {
    hostname: 'api.github.com',
    port: 443,
    path: '/user/repos',
    method: 'POST',
    headers: {
      'User-Agent': 'NodeJS-Script',
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = https.request(options, (res) => {
    let responseBody = '';
    res.on('data', (chunk) => { responseBody += chunk; });

    res.on('end', () => {
      if (res.statusCode === 201) {
        console.log('✔ Repository created successfully on GitHub!');
        pushCode(username, token, repoName);
      } else if (res.statusCode === 422) {
        console.log('ℹ Repository already exists on your GitHub account. Proceeding to push...');
        pushCode(username, token, repoName);
      } else {
        console.error(`❌ Failed to create repository (Status Code: ${res.statusCode})`);
        console.error('Response:', responseBody);
        process.exit(1);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request Error:', error);
    process.exit(1);
  });

  req.write(data);
  req.end();
}

function pushCode(username, token, repoName) {
  try {
    console.log('\n2. Setting up Git remotes...');
    
    let remoteExists = false;
    try {
      execSync('git remote get-url origin', { stdio: 'ignore' });
      remoteExists = true;
    } catch (e) {}

    if (remoteExists) {
      execSync('git remote remove origin');
    }

    const authUrl = `https://${username}:${token}@github.com/${username}/${repoName}.git`;
    execSync(`git remote add origin ${authUrl}`);
    console.log('✔ Remote origin added.');

    console.log('\n3. Renaming branch to "main"...');
    execSync('git branch -M main');

    console.log('\n4. Pushing code to GitHub (main branch)...');
    execSync('git push -u origin main', { stdio: 'inherit' });
    console.log('✔ Code pushed successfully!');

    console.log('\n5. Sanitizing credentials from Git configuration...');
    const cleanUrl = `https://github.com/${username}/${repoName}.git`;
    execSync(`git remote set-url origin ${cleanUrl}`);
    console.log('✔ Git configuration sanitized. Token removed.');

    console.log('\n==================================================');
    console.log('🎉 Project published successfully!');
    console.log(`Repository Link: https://github.com/${username}/${repoName}`);
    console.log('==================================================');
  } catch (error) {
    console.error('\n❌ Git command failed:', error.message);
    
    try {
      const cleanUrl = `https://github.com/${username}/${repoName}.git`;
      execSync(`git remote set-url origin ${cleanUrl}`, { stdio: 'ignore' });
    } catch (e) {}
    
    process.exit(1);
  }
}

run();
