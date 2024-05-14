# YSTV Sports Graphics

This repo houses (hopefully) everything related to doing graphics overlays for YSTV streams, including:

- the data backend
- the UI for inputting scores
- the actual NodeCG bundle

## Developing

Take a look at the [docs folder](./docs) for instructions on getting started, as well as an overview of the codebase.

## Deploying

All pushes to `main` are automatically deployed on the dev site.

To deploy to the prod site, run this [Jenkins job](https://ci.ystv.co.uk/job/Sports%20Scores%20-%20Promote%20to%20Production/), passing in a previous successful dev build.
