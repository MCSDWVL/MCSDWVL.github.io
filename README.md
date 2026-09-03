# MCSDWVL.github.io
http://mcsdwvl.github.io

## Games directory

`/games/` is generated daily from public `mcsdwvl` repositories tagged
`web-game`. A tagged repository normally becomes one card pointing at its
Pages root. To list more than one game from a repository, add a root
`manifest.json` containing a `games` array; each entry needs a relative
`path` and may override `title`, `description`, `thumbnail`, and `tags`.

Use `gallery.config.json` to arrange promoted game IDs (`repository:path`)
before the remaining cards, which are ordered by repository creation date.
