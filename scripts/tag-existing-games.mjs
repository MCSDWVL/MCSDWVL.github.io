const targets = [
  'FakeWords',
  'FiftyFifty',
  'OnePageGames',
  'LoopDeck',
  'MusicalChess',
  'Ouijish',
  'Q20',
  'ShoppingList',
  'Sorter',
  'TimeTravelStockMarket',
  'ToneDraw',
  'Wordoku',
];

if (!process.env.GITHUB_TOKEN) throw new Error('Set GITHUB_TOKEN before running this script.');

const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  'User-Agent': 'mcsdwvl-games-gallery',
};

const response = await fetch('https://api.github.com/users/mcsdwvl/repos?type=owner&per_page=100', { headers });
if (!response.ok) throw new Error(`Could not list repositories: ${response.status} ${response.statusText}`);
const repositories = await response.json();

for (const target of targets) {
  const repository = repositories.find((item) => item.name.toLowerCase() === target.toLowerCase());
  if (!repository) {
    console.warn(`Skipped: mcsdwvl/${target} was not found.`);
    continue;
  }
  const topics = [...new Set([...(repository.topics || []), 'web-game'])];
  const update = await fetch(`https://api.github.com/repos/${repository.full_name}/topics`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ names: topics }),
  });
  if (!update.ok) throw new Error(`Could not tag ${repository.full_name}: ${update.status} ${update.statusText}`);
  console.log(`Tagged ${repository.full_name}`);
}
