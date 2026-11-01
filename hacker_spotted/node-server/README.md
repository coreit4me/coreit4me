# hacker_spotted — Node.js server

A mobile-friendly Node.js version of the bug page: a bug drawn out of flickering neon-green digits on black.
No dependencies — just Node 18+.

## Run

```sh
npm start
```

It prints two addresses. Open the **"on your phone"** one on a phone connected to the same Wi-Fi.
Tap the screen to get a new bug. Use `PORT=8080 npm start` to change the port.

## Test

```sh
npm test
```

## Use as a module

```js
const { createServer, buildArt, toText } = require('./lib');

console.log(toText(buildArt({ cols: 60, seed: 1 })));   // print the bug in a terminal
createServer().listen(3000);                              // or run the server yourself
```

## API

| Route | What it returns |
| --- | --- |
| `GET /` | The page |
| `GET /api/art?cols=80&seed=1` | Art as JSON (`cols` 30–160; `seed` makes it repeatable) |
| `GET /api/art.txt?cols=80` | Art as plain text |
| `GET /health` | `{"status":"ok"}` |
