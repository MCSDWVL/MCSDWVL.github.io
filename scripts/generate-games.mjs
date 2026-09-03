import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const owner = 'mcsdwvl';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');
const galleryOutput = path.join(output, 'games');

export function normalisePath(value) {
  if (value === '' || value === '.') return '';
  if (typeof value !== 'string') throw new Error('path must be a string');
  const result = value.replace(/^\/+|\/+$/g, '');
  if (!result || result.split('/').some((part) => !part || part === '.' || part === '..')) {
    throw new Error('path must be a safe relative path');
  }
  return result;
}

function gameUrl(repository, gamePath) {
  const suffix = gamePath ? `/${gamePath}` : '';
  return `https://${owner}.github.io/${repository}${suffix}`;
}

export function defaultGame(repository) {
  return {
    id: `${repository.name}:.`,
    repository: repository.name,
    path: '',
    title: repository.name,
    description: repository.description || '',
    tags: (repository.topics || []).filter((topic) => topic !== 'web-game'),
    thumbnail: 'assets/thumbnail.png',
    url: gameUrl(repository.name, ''),
    defaultBranch: repository.default_branch,
    createdAt: repository.created_at,
  };
}

export function gamesFromManifest(repository, manifest, reportInvalid = () => {}) {
  if (!manifest || !Array.isArray(manifest.games)) throw new Error('manifest.games must be an array');
  const ids = new Set();
  const games = [];
  for (const [index, entry] of manifest.games.entries()) {
    try {
      const gamePath = normalisePath(entry.path);
      const id = `${repository.name}:${gamePath || '.'}`;
      if (ids.has(id)) throw new Error(`duplicate game path: ${entry.path}`);
      ids.add(id);
      const thumbnail = entry.thumbnail === undefined
        ? `${gamePath ? `${gamePath}/` : ''}assets/thumbnail.png`
        : normalisePath(entry.thumbnail);
      games.push({
        id,
        repository: repository.name,
        path: gamePath,
        title: typeof entry.title === 'string' && entry.title.trim() ? entry.title.trim() : repository.name,
        description: typeof entry.description === 'string' ? entry.description.trim() : (repository.description || ''),
        tags: Array.isArray(entry.tags) ? entry.tags.filter((tag) => typeof tag === 'string' && tag.trim()) : (repository.topics || []).filter((topic) => topic !== 'web-game'),
        thumbnail,
        url: gameUrl(repository.name, gamePath),
        createdAt: repository.created_at,
        defaultBranch: repository.default_branch,
      });
    } catch (error) {
      reportInvalid(`entry ${index + 1}: ${error.message}`);
    }
  }
  return games;
}

async function fetchJson(url) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'mcsdwvl-games-gallery' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

async function repositories() {
  const all = [];
  for (let page = 1; ; page += 1) {
    const batch = await fetchJson(`https://api.github.com/users/${owner}/repos?type=owner&per_page=100&page=${page}&sort=created&direction=desc`);
    all.push(...batch);
    if (batch.length < 100) return all.filter((repository) => !repository.archived && (repository.topics || []).includes('web-game'));
  }
}

async function manifestFor(repository) {
  const url = `https://raw.githubusercontent.com/${owner}/${repository.name}/${repository.default_branch}/manifest.json`;
  const response = await fetch(url, { headers: { 'User-Agent': 'mcsdwvl-games-gallery' } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`could not read manifest for ${repository.name}: ${response.status}`);
  return response.json();
}

function assetName(game) {
  const extension = path.posix.extname(game.thumbnail) || '.png';
  return `${game.id.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()}${extension}`;
}

async function copyThumbnail(game) {
  const destination = path.join(galleryOutput, 'assets', assetName(game));
  const source = `https://raw.githubusercontent.com/${owner}/${game.repository}/${game.defaultBranch}/${game.thumbnail}`;
  const response = await fetch(source, { headers: { 'User-Agent': 'mcsdwvl-games-gallery' } });
  if (!response.ok) return null;
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
  return `assets/${path.basename(destination)}`;
}

async function build() {
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  const excluded = new Set(['.git', '.github', 'dist', 'scripts', 'gallery.config.json', 'README.md', 'games']);
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (!excluded.has(entry.name)) await cp(path.join(root, entry.name), path.join(output, entry.name), { recursive: true });
  }
  await mkdir(path.join(galleryOutput, 'assets'), { recursive: true });
  const config = JSON.parse(await readFile(path.join(root, 'gallery.config.json'), 'utf8'));
  const errors = [];
  const games = [];
  for (const repository of await repositories()) {
    try {
      const manifest = await manifestFor(repository);
      games.push(...(manifest ? gamesFromManifest(repository, manifest, (message) => errors.push(`${repository.name}: ${message}`)) : [defaultGame(repository)]));
    } catch (error) {
      errors.push(`${repository.name}: ${error.message}`);
    }
  }
  for (const game of games) game.thumbnailUrl = await copyThumbnail(game) || 'assets/placeholder.svg';
  const featured = new Map((config.featured || []).map((id, index) => [id, index]));
  games.sort((a, b) => (featured.has(a.id) ? featured.get(a.id) : Number.MAX_SAFE_INTEGER) - (featured.has(b.id) ? featured.get(b.id) : Number.MAX_SAFE_INTEGER) || new Date(b.createdAt) - new Date(a.createdAt));
  await writeFile(path.join(galleryOutput, 'games.json'), `${JSON.stringify(games, null, 2)}\n`);
  await Promise.all([
    cp(path.join(root, 'games', 'index.html'), path.join(galleryOutput, 'index.html')),
    cp(path.join(root, 'games', 'styles.css'), path.join(galleryOutput, 'styles.css')),
    cp(path.join(root, 'games', 'app.js'), path.join(galleryOutput, 'app.js')),
    cp(path.join(root, 'games', 'assets', 'placeholder.svg'), path.join(galleryOutput, 'assets', 'placeholder.svg')),
  ]);
  if (errors.length) console.warn(`Skipped invalid game entries:\n${errors.join('\n')}`);
  console.log(`Generated ${games.length} games.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) build();
