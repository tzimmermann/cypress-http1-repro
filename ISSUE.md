<!-- Draft GitHub issue for cypress-io/cypress. Review, then post. -->

## Title

Native network (Chrome): `cy.visit()` of a page loading a large JS bundle that Cypress rewrites hangs forever — `forceHttp1: true` avoids it

## Current behavior

On the native browser-network path (`forceHttp1: false`, the default) in Chrome, a `cy.visit()` of a page that loads a **large `.js` which Cypress rewrites** hangs **forever**. There is no error, `pageLoadTimeout` never fires, and the run must be killed.

The CDP websocket dies with `write EPIPE` and the run never recovers:

```
cypress:server:browsers:cri-client Encountered error on send { command: 'Fetch.fulfillRequest', … }
  err: Error: write EPIPE … code: 'EPIPE', syscall: 'write' }
cypress:server:browsers:cri-client error classified as WEBSOCKET_NOT_OPEN_RE; enqueuing and attempting to reconnect
```

Isolation findings:

- **Only rewritten bodies hit this.** The same body with *no* framebusting patterns is streamed through and never hangs, at any size. Adding framebusting lines (so `modifyObstructiveCode` rewrites the body) triggers the hang.
- **It's a size cliff.** A **70 MB** raw bundle **passes**; **100 MB** raw **hangs**.
- **`forceHttp1: true` avoids it.** Identical payload passes on the legacy proxy.

## Desired behavior

A large rewritten response body on the native network path should load successfully, or — failing that — the run should fail with `pageLoadTimeout`/an error instead of hanging silently and indefinitely.

## To reproduce

Run:

```bash
npm run cypress:run                               # hangs forever (kill it)
npm run cypress:run -- --config forceHttp1=true   # passes
```

To watch the socket die: `DEBUG=cypress:server:browsers:cri-client` on the hanging run.

## Cypress Version

16.2.1

## Browser Version

Google Chrome 156.0.8078.74 (headless and headed)

## Node version

v24.14.1

## Operating System

macOS 27.0.1 (arm64, Apple Silicon)

## Other

- Distinct from #34794 (hang on a large **spec** bundle, closed/released in 16.2.1): this is a large **application response body** that Cypress rewrites, and it still reproduces on 16.2.1.
- Same CDP-interception area as #34969 (large SPA, `Fetch.fulfillRequest` on the native path); this is a minimal, deterministic isolation.
