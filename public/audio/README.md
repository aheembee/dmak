# Audio

This folder is unused by default. The interactive player streams **30-second
previews** through the server (`/api/preview/:trackId`), which are fetched
fresh from Deezer's public API on request — no audio files are stored here.

If you would rather serve your own clips (for example full-length promos or
unreleased snippets), drop MP3s in this folder and set each release's
`links.preview` in `content/site.json`; the server will prefer the local file.
