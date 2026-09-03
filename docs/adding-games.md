# Adding a game to the directory

The games directory at <https://mcsdwvl.github.io/games/> discovers public
repositories owned by `mcsdwvl` that have the `web-game` GitHub topic.

## Standalone game

1. Create a repository under `mcsdwvl` and publish its static site with
   GitHub Pages at `https://mcsdwvl.github.io/<repository-name>/`.
2. On the repository's GitHub home page, click the gear beside **About**, add
   the `web-game` topic, and save.
3. Set the repository **Description**. It becomes the game-card summary.
4. Add a landscape thumbnail at `assets/thumbnail.png`, then commit and push
   it. `1200x675` (16:9) PNG is recommended, though other ratios are cropped
   to fit the card.

The game appears at the next daily directory deployment. To publish it
immediately, run the **Build and deploy personal site** workflow manually in
the `MCSDWVL/MCSDWVL.github.io` Actions tab.

## Multiple games in one repository

Add the same `web-game` topic, then add a repository-root `manifest.json`.
The manifest replaces the default single root card with one card per game.

```json
{
  "games": [
    {
      "path": "puzzles/example.html",
      "title": "Example Puzzle",
      "description": "A short description for this individual game.",
      "thumbnail": "assets/thumbnails/example.png",
      "tags": ["puzzle", "word game"]
    }
  ]
}
```

`path` is relative to the repository's Pages root. The optional `thumbnail`
is relative to the repository root. If omitted, it defaults to
`<path>/assets/thumbnail.png`.

## Feature a game

Edit `gallery.config.json` in this repository. Add the game ID to the ordered
`featured` list, then commit and push. A root game uses
`<repository-name>:.`; a collection entry uses
`<repository-name>:<manifest-path>`.

For example:

```json
"featured": ["Wordoku:.", "OnePageGames:letris.html"]
```

Featured games appear first in the exact order listed. All other games appear
in the **All games** section, newest repository first.
