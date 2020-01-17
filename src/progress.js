const Octokit = require('@octokit/rest');
const octokit = new Octokit();

async function progress() {
  const owner = 'getsentry';
  const repo = 'sentry';

  const contents = await octokit.repos.getContents({
    owner,
    repo,
    path: 'src/sentry/static/sentry',
  });

  const app = contents.data.find(({name}) => name === 'app');
  const tree = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: app.sha,
    recursive: 1,
  });

  const jsxFiles = tree.data.tree.filter(({path}) => /\.jsx?$/.test(path)) || [];
  const tsxFiles = tree.data.tree.filter(({path}) => /\.tsx?$/.test(path)) || [];

  const total = jsxFiles.length + tsxFiles.length;

  return {
    remainingFiles: jsxFiles.length,
    progress: Math.round((tsxFiles.length / total) * 10000) / 100,
  };
}

module.exports = progress;
