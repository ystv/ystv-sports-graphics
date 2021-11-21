# nodecg-react-boilerplate

A boilerplate for NodeCG with React, TypeScript, Babel, and Webpack.

## Quick Deployment Instructions

### Prerequisites

* nodejs
* yarn installed globally
  `npm install --global yarn`
* nodecg (on Windows probably in the root of the C drive)

  ```npm install --global nodecg-cli```

  ```mkdir nodecg```

  ```cd nodecg```

  ```nodecg setup```

### Instructions

* ```git clone https://github.com/ystv/ystv-sports-graphics.git``` **_into the bundles folder_** in your nodecg
  instance (for windows usually in the root of the C drive)
* cd into the bundle
* ```yarn install --frozen-lockfile```
* ```yarn generate```
* ```yarn build```
* then ```nodecg start``` in your nodecg directory
* web interface should be accessible on [localhost:9090](localhost:9090)

## Features

* React Fast Refresh
* Supports an unlimited number of dashboards and graphic files
* Storybook integration
* TypeScript checking
* Replicant/config JSON schema to TypeScript conversion

## Setting up

Clone this repository into your NodeCG installation's `bundles` folder. You'll likely want to use a different name, like
so:

```sh
git clone git@github.com:ystv/nodecg-react-boilerplate.git my-awesome-bundle
```

If you used a different name, go into `package.json` and change the `name` field to the name of your folder, otherwise
NodeCG will refuse to start it.

Run `yarn` to install dependencies.

## Usage

To start, run `yarn dev`, and run NodeCG in a separate terminal.

To create additional dashboards/graphics, create files called `src/dashboard/index.{name}.tsx`
or `src/graphics/index.{name}.tsx` - each one will be wrapped into a HTML page called `dashboard/{name}.html`
or `graphics/{name}.html`. Then just reference it in `package.json` under `nodecg`. (If you want to customise the
generated HTML, create a file called `index.{name}.html`.)

You can import files from the `src/common` folder simply by using `import foo from "common/foo"` no matter how deep you
are in a directory hierarchy.

If you use NodeCG's [replicant schemas](https://www.nodecg.dev/docs/replicant-schemas)
or [bundle configuration](https://www.nodecg.dev/docs/bundle-configuration), you can run `yarn schema` to generate a
TypeScript declaration file from those schemas - these will be placed in `src/common/types`.

If you want to use Storybook with React, create files called `{name}.stories.tsx` following
the [Storybook standards](https://storybook.js.org/docs/react/writing-stories/introduction) and run `yarn storybook`.
