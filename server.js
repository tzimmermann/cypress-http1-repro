const http = require('node:http')

// Minimal repro for the Cypress 16 native browser-network hang.
//
// A local HTTP server serves one oversized `.js` "bundle" that contains
// framebusting code. On the native browser-network path (forceHttp1: false, the
// default) Cypress must REWRITE that body (`modifyObstructiveCode`), and a
// rewritten body is sent to Chrome whole, base64-encoded, in a single CDP
// `Fetch.fulfillRequest` websocket frame. A large enough body overflows the
// frame -> `write EPIPE` -> `cdp_disconnected` -> the run hangs forever with no
// timeout.
//
//   npm run cypress:run                            # hangs (Ctrl-C)
//
// A body Cypress does NOT rewrite is streamed via `continueResponse` and never
// hangs, regardless of size. The framebusting lines below are what make Cypress
// rewrite this one.
//
//   BIG_MB=150   size of the bundle in MiB (binary-search the threshold)
const BIG_MB = Number(process.env.BIG_MB || 150)
const PORT = Number(process.env.REPRO_PORT || 8094)

// Valid JS of ~BIG_MB. The bulk is a string literal so size is cheap and the
// file stays valid no matter where Buffer.alloc slices it.
const bigJs = Buffer.concat([
  Buffer.from(
    'if (window.top !== window.self) { window.top.location.href = window.self.location.href; }\n' +
      'if (top != self) { top.location = self.location; }\n' +
      'var _pad = "'
  ),
  Buffer.alloc(BIG_MB * 1024 * 1024, 'x'),
  Buffer.from(
    '";\nwindow.__bigLoaded = true;\n' +
      "var s = document.getElementById('status'); if (s) s.textContent = 'loaded';\n"
  ),
])

const html =
  '<!doctype html><html><head><meta charset="utf-8"><title>repro</title></head>' +
  '<body><div id="status">loading</div><script src="/big.js"></script></body></html>'

function startServer() {
  console.log(`Starting server on port ${PORT} with ${BIG_MB} MB JS bundle`)
  const server = http.createServer((req, res) => {
    if (req.url === '/big.js') {
      res.setHeader('content-type', 'application/javascript; charset=utf-8')
      res.setHeader('content-length', bigJs.length)
      res.end(bigJs)
    } else {
      res.setHeader('content-type', 'text/html; charset=utf-8')
      res.end(html)
    }
  })
  server.listen(PORT)
  return server
}
module.exports = { startServer, PORT }