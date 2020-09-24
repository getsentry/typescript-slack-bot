import Octokit from '@octokit/rest';

import {RequestError} from './error';

const octokit = new Octokit();

/**
 * Paths that we do not intend to convert to ts
 */
const IGNORED_PATHS = [/views\/events.*/];

export default async function getProgress(date?: string) {
  const owner = 'getsentry';
  const repo = 'sentry';
  const getContentsParams: {owner: string; repo: string; path: string; ref?: string} = {
    owner,
    repo,
    path: 'src/sentry/static/sentry',
  };

  if (date) {
    const commits = await octokit.repos.listCommits({
      owner,
      repo,
      until: date,
      per_page: 1,
    });

    if (commits.data.length) {
      getContentsParams.ref = commits.data[0].sha;
    }
  }

  const contents = await octokit.repos.getContents(getContentsParams);

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
    if (/\.jsx?$/.test(obj.path) && !IGNORED_PATHS.some(r => r.test(obj.path))) {
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
