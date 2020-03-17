import Octokit from '@octokit/rest';

import {RequestError} from './error';

const octokit = new Octokit();

export default async function getProgress() {
  const owner = 'getsentry';
  const repo = 'sentry';

  const contents = await octokit.repos.getContents({
    owner,
    repo,
    path: 'src/sentry/static/sentry',
  });

  if (!Array.isArray(contents.data)) {
    throw new RequestError('Invalid directory', 400);
  }

  const app = contents.data.find(({name}) => name === 'app');

  if (!app) {
    throw new RequestError('Invalid directory', 400);
  }

  const tree = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: app.sha,
    recursive: '1',
  });

  const jsxFiles: string[] = [];
  const tsxFiles: string[] = [];

  for (const obj of tree.data.tree) {
    if (/\.tsx?$/.test(obj.path)) {
      tsxFiles.push(obj.path);
    }
    if (/\.jsx?$/.test(obj.path)) {
      jsxFiles.push(obj.path);
    }
  }

  const total = jsxFiles.length + tsxFiles.length;

  return {
    remainingFiles: jsxFiles.length,
    total,
    progress: Math.round((tsxFiles.length / total) * 10000) / 100,
  };
}