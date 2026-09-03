import assert from 'node:assert/strict';
import test from 'node:test';
import { applyFeaturedOrdering, defaultGame, gamesFromManifest, normalisePath } from './generate-games.mjs';

const repo = { name: 'collection', description: 'A collection', topics: ['web-game', 'puzzle'], created_at: '2026-01-01T00:00:00Z' };

test('creates a default root entry', () => {
  assert.deepEqual(defaultGame(repo).url, 'https://mcsdwvl.github.io/collection');
  assert.deepEqual(defaultGame(repo).tags, ['puzzle']);
});

test('replaces a repository entry with manifest games', () => {
  const games = gamesFromManifest(repo, { games: [{ path: 'play.html', title: 'Play', thumbnail: 'art/play.png' }] });
  assert.equal(games[0].id, 'collection:play.html');
  assert.equal(games[0].url, 'https://mcsdwvl.github.io/collection/play.html');
});

test('rejects unsafe paths', () => assert.throws(() => normalisePath('../secret')));

test('keeps valid manifest entries when one entry is invalid', () => {
  const errors = [];
  const games = gamesFromManifest(repo, { games: [{ path: 'play.html' }, { path: '../bad' }] }, (message) => errors.push(message));
  assert.equal(games.length, 1);
  assert.equal(errors.length, 1);
});

test('puts featured games first in configured order', () => {
  const games = applyFeaturedOrdering([
    { id: 'two:.', createdAt: '2026-02-01T00:00:00Z' },
    { id: 'one:.', createdAt: '2026-01-01T00:00:00Z' },
  ], ['one:.']);
  assert.deepEqual(games.map((game) => [game.id, game.featured]), [['one:.', true], ['two:.', false]]);
});
