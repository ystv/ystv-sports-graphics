# YSTV Sports Graphics

This repo houses (hopefully) everything related to doing graphics overlays for YSTV streams, including:

- the data backend
- the UI for inputting scores
- the actual NodeCG bundle

## Developing

You will need [Node.js](https://nodejs.org/en/) and [Yarn](https://yarnpkg.com/getting-started/install). If you want to work on the API backend, you will also need a [Couchbase Server](https://docs.couchbase.com/server/current/install/install-intro.html) (7.0 or later) - you can also use [Docker](https://docs.couchbase.com/server/current/install/getting-started-docker.html) for this. Note that if you have an ARM MacBook, there is currently no ARM build of Couchbase Server available. Finally, you will need [Redis](https://redis.io/docs/getting-started/).

There is a docker-compose.yml file that should set all this up if you run `docker compose up` - though it hasn't been updated in a while so might not fully work.

First, install NodeCG - we're using our own fork that has some small fixups:

```shell
$ git clone --branch ystv https://github.com/ystv/nodecg.git
```

Then, clone this repo inside the `bundles` folder:

```shell
$ git clone https://github.com/ystv/ystv-sports-graphics.git bundles/ystv-sports-graphics
```

Open it and run `yarn`.

### Backend/UI

`cd scores-src`.

Create a .env file that looks something like this:

```
DB_CONNECTION_STRING=couchbase://your.couchbase.server
DB_USER=sports-scores
DB_PASSWORD=password
DB_BUCKET=sports-scores
REDIS_CONNECTION_STRING=redis://localhost
PUBLIC_API_BASE=http://localhost:8000/api
```

In Couchbase, create a bucket and user called `sports-scores` (or whatever you used above).

Then, run `yarn dev` and go to `http://localhost:3000`. If something didn't work check the console for clues.

### Graphics

Create a file in the NodeCG `cfg` directory called `ystv-sports-graphics.json` that looks like this:

```json
{
  "scoresService": {
    "apiURL": "http://localhost:8000/api"
  }
}
```

Optionally, create a `nodecg.json` in the same place that looks like this:

```json
{
  "logging": {
    "console": {
      "enabled": true,
      "timestamps": true,
      "level": "debug"
    }
  }
}
```

This will ensure you get logging.

`cd bundle-src` and run `yarn bundle:dev` to start a live-reloading dev server, or `yarn bundle:build` to build the bundle once.

In a second terminal, run `yarn nodecg` (in the `ystv-sports-graphics` folder) and go to `http://localhost:9090`.

## Deploying

All pushes to `main` are automatically deployed on the dev site.

To deploy to the prod site, run this [Jenkins job](https://ci.ystv.co.uk/job/Sports%20Scores%20-%20Promote%20to%20Production/), passing in a previous successful dev build.
