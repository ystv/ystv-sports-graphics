# Code Structure

The two most important folders in the codebase are `bundle-src` and `scores-src`, so let's talk about all the others first:

- `.devcontainer`: old crap that's no longer used
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

scores-src houses the scores management and data entry application. It contains both the client-side and server-side code, as well as some that is common to both.
