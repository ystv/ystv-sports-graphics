const path = require("path");

module.exports = {
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "storybook-css-modules-preset",
    "@storybook/addon-essentials",
  ],
  webpackFinal: async (config) => {
    config.resolve = {
      extensions: [".ts", ".tsx", ".js"],
      alias: {
        common: path.join(__dirname, "../src", "common"),
      },
    };
    return config;
  },
  core: {
    builder: "webpack5",
  },
  reactOptions: {
    fastRefresh: true,
    strictMode: true,
  },
  // typescript: {
  //   check: true,
  //   checkOptions: {},
  //   reactDocgenTypescriptOptions: {
  //     propFilter: (prop) => ["label", "disabled"].includes(prop.name),
  //   },
  // },
  staticDirs: [{ from: "../public", to: "public" }],
};
