# hacker_spotted — Node.js server

A mobile-friendly Node.js version of the bug page: a bug made of neon-green digits crawls around
while digits rain down the black background from top to bottom.
No dependencies — just Node 18+.

## Run

```sh
npm start
```

It prints two addresses. Open the **"on your phone"** one on a phone connected to the same Wi-Fi.
Tap anywhere and the bug crawls to that spot; otherwise it wanders on its own. Use `PORT=8080 npm start` to change the port.

## Test

```sh
npm test
```

## Use as a module

```js
const { createServer, buildArt, toText, inside } = require('./lib');

console.log(toText(buildArt({ cols: 60, seed: 1 })));   // print the bug in a terminal
inside(50, 60, Math.PI / 2);                              // is this point on the bug mid-step?
createServer().listen(3000);                              // or run the server yourself
```

## API

| Route | What it returns |
| --- | --- |
| `GET /` | The page |
| `GET /bug.js` | The bug shape code used by the page (`window.HackerBug`) |
| `GET /api/art?cols=80&seed=1` | Art as JSON (`cols` 30–160; `seed` makes it repeatable) |
| `GET /api/art.txt?cols=80` | Art as plain text |
| `GET /health` | `{"status":"ok"}` |
