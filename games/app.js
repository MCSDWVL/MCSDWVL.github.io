const featuredGrid = document.querySelector('#featured-games');
const allGamesGrid = document.querySelector('#all-games');
const featuredSection = document.querySelector('#featured-section');
const allGamesSection = document.querySelector('#all-games-section');
const noResults = document.querySelector('#no-results');
const status = document.querySelector('#status');
const search = document.querySelector('#search');
let games = [];

function card(game) {
  const article = document.createElement('article');
  article.className = 'card';
  const image = document.createElement('img');
  image.src = game.thumbnailUrl;
  image.alt = '';
  image.loading = 'lazy';
  const body = document.createElement('div');
  body.className = 'card-body';
  const title = document.createElement('h2');
  title.textContent = game.title;
  const description = document.createElement('p');
  description.textContent = game.description || 'A browser game by Matthew Vassilakos.';
  const tags = document.createElement('p');
  tags.className = 'tags';
  tags.textContent = game.tags.join(' · ');
  const link = document.createElement('a');
  link.href = game.url;
  link.textContent = 'Play game';
  link.className = 'play';
  body.append(title, description, tags, link);
  article.append(image, body);
  return article;
}

function render() {
  const term = search.value.toLowerCase().trim();
  const visible = games.filter((game) => [game.title, game.description, ...game.tags].join(' ').toLowerCase().includes(term));
  const featuredGames = visible.filter((game) => game.featured);
  const allGames = visible.filter((game) => !game.featured);
  featuredGrid.replaceChildren(...featuredGames.map(card));
  allGamesGrid.replaceChildren(...allGames.map(card));
  featuredSection.hidden = featuredGames.length === 0;
  allGamesSection.hidden = allGames.length === 0;
  noResults.hidden = visible.length !== 0;
  status.textContent = `${visible.length} ${visible.length === 1 ? 'game' : 'games'}`;
}

fetch('games.json').then((response) => response.json()).then((data) => { games = data; render(); }).catch(() => { status.textContent = 'Games are unavailable right now.'; });
search.addEventListener('input', render);
