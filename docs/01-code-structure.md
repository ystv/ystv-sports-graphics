# Code Structure

The two most important folders in the codebase are `bundle-src` and `scores-src`, so let's talk about all the others first:

- `.devcontainer`: used to have a [dev container](https://code.visualstudio.com/docs/devcontainers/containers) definition, except it's grown outdated. We should fix it up one day.
- `.github/workflows`: definitions of our GitHub Actions - discussed later in [Testing](./03-testing.md)
- `.husky`: can be ignored
- `dashboard`, `graphics`: can be ignored (NodeCG requires that they exist at the top level, though they're actually built from `bundle-src`)
- `patches`: local modifications to libraries to work around upstream issues
- `schemas`: a symbolic link to `bundle-src/schemas`, discussed later
- `scripts`: miscellaneous scripts

Also there's quite a few files at the top level:

- `.dockerignore`, `.gitignore`, `.prettierignore`: telling various tools which files to not care about
- `.editorconfig`: configures code editors to all follow the same coding style (indent size, line endings, etc.)
- `.eslintrc.js`: configures ESLint, a tool that checks the JavaScript/TypeScript for quality
- `.yarnrc.yml`: configures the Yarn package manager
- `Dockerfile.*`, `client-nginx.conf`: used to build the Docker images - discussed in [Deployment](./05-deployment.md)
- `docker-compose.yml`: used to be used for quickly setting up a development environment, but is outdated now
- `cypress.json`: configures the Cypress test runner - discussed later in [Testing](./03-testing.md)
- `Jenkinsfile`, `Jenkinsfile.prod-release`: used by the Jenkins build automation - discussed in [Deployment](./05-deployment.md)
- `package.json`, `yarn.lock`: specifies all the dependencies of the code
  - Note that `bundle-src` and `scores-src` have their own `package.json` files, that are combined using [Yarn Workspaces](https://yarnpkg.com/features/workspaces)

## scores-src

scores-src houses the scores management and data entry application. It contains both the client-side and server-side code, as well as some that is common to both. Each of these lives in the folders `client`, `server`, and `common` respectively.

### common

This has a few top-level files that are useful across both `client` and `server`, for example calculating times. However the most interesting part of `common` is the `sports` subfolder, which has definitions of each of the sport types tha tthe system supports. The exact contents are discussed further in the [Data Model](./02-data-model.md) section.

### server

On the server-side the main entry point is `index.server.ts`, which sets up the application's Web server. In the process it imports (among many others):

- `loggingSetup.ts`, which sets up logging
- `config.ts`, where the structure of the server's configuration is defined
  - The actual configuration is in `scores-src/config/{NODE_ENV}.json`, where `{NODE_ENV}` is the value of the `NODE_ENV` environment variable - if none is set it uses the values in `defaults.json`.
- `db.ts`, which houses the logic for connecting to Couchbase Server
- `redis.ts`, ditto for Redis
- `...Routes.ts`, which define the various "routes" (API endpoints), such as `/events`, `/teams` etc. Some of these are discussed in more detail below, but the general principle is that each one exports a function called `createXxxRouter()`, which returns an Express [`Router`](https://expressjs.com/en/guide/routing.html), which `index.ts` combines together.
- `metrics.ts`, which defines our Prometheus metrics, used for debugging issues.
- `bootstrap.ts`, which is responsible for handling setting up the application for the first time.

There's a few other files in the `server` folder which merit calling out:

- `auth.ts` has the user authentication logic, including checking passwords and setting session cookies.
- `*.spec.ts` - [tests](./03-testing.md)
- `__mocks__` - mock files for [testing](./03-testing.md)

The app's functionality is exposed through various APIs (for example, `localhost:8000/api/events`) that all take in and return JSON. The most important ones are:

- `/events` (`eventsRoutes.ts`) - handles listing events. Notably it doesn't handle things like creating or updating events, instead those are handled by...
- `/events/<league>/<type>` (`eventTypeRoutes.ts`) - this one is a little interesting, because it creates a bunch of routers that all do more or less the same thing. Essentially, for each event type (such as `football`, `swimming`, etc.) we create a router at `/events/<league>/football`, `/events/<league>/swimming`, which handles creating, updating, and deleting events of that type. There's no real reason why this couldn't be a single generic router that determines the event based on the path, this was just simpler.
- `/updates/stream/v2` (`liveRoutes.ts`) - handles WebSocket connections to get real-time notifications about event changes.
  - (Historical note: the `v2` comes from [the first iteration of this system](https://github.com/ystv/roses-scores-api/tree/main/update_stream), which also had a `v1`. This one only has `v2`.)

### client

The client-side is the part that humans will interact with. It's a relatively typical React app, using React Router for client-side routing (NB: completely unrelated to routers in the `server` section). Everything kicks off in `index.html`, which (through [build-time magic](https://vitejs.dev/)) loads `index.client.tsx` and renders the `App` component from `App.tsx`.
