# 🍿 MOVIE NIGHT

A retro popcorn-style movie picker for 2–12 people. Each person receives a unique connection code. Swiping stays locked until at least two people connect and every member selects streaming subscriptions. Swipe right or tap the heart to like; swipe left or tap × to pass. Every screen stops on the first unanimous like. Movie posters and a one-tap trailer button are included.

## Run

Requires Node.js 22 or newer. No dependency installation required.

```sh
npm start
```

Open http://localhost:3000. For a group test, open another browser or private window, register another name, and enter another person's code or the shared group code. Two tabs in the same browser share one identity. Separate devices must open the same hosted server address. Each device keeps its secret session token in browser storage; clearing that storage creates a new identity. There are no passwords or recovery accounts in this first version.

```sh
npm test
```

## Movie catalogue and trailers

Without credentials, the app explicitly labels its sample catalogue. Demo streaming assignments are illustrative and are not a claim about current availability. Demo trailer buttons open YouTube search results for the film's official trailer.

Set the server environment variable `TMDB_TOKEN` to a TMDB API Read Access Token to enable live subscription-filtered discovery and direct official YouTube trailer links where available. A YouTube search is the fallback if no trailer is supplied. Do not place a token in frontend code. Node 22 can load a private local `.env` with `node --env-file=.env server.js`.

[TMDB movie discovery documentation](https://developer.themoviedb.org/reference/discover-movie). Streaming data is regional and comes from JustWatch via TMDB. The app uses the union of the group’s subscription lists, suitable for watching together. People must select the same country to connect. Create a group to get a shared code, or join someone using their personal code. Groups support up to 12 members. Joining or leaving resets the round; a match requires every current member to like the movie. Provider availability differs by country; some listed services may return no movies there. The match screen includes a regional “Where to watch” link. Review TMDB's current licensing and branding requirements before a public commercial launch.

## Hosting

This app needs a Node server; GitHub Pages alone cannot run the pairing service. Deploy the included Dockerfile to a Node/Docker host. Set `PORT` if required and mount a persistent volume at `/app/data`, or configure `DATA_DIR`. Use HTTPS in production.

The server saves profiles, pairings, and votes to an atomic JSON file. Run **one server process with one persistent disk**; this version is not designed for multiple replicas or high traffic. Pairing and vote access are checked on the server; partner votes and secret tokens are never returned to the other person. Keep codes private. Preferences or starting a new round reset everyone’s votes. Leaving removes you from the group and resets the remaining members’ round. A single remaining member cannot swipe. Only the first unanimous match is selected.

The browser refreshes group and match state about every two seconds. External poster images require an internet connection. For production at scale, add account recovery, expiring sessions, data retention controls, a shared database, and stronger distributed rate limiting.
