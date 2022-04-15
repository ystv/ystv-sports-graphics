import "../src/graphics/global.css";

const customViewports = {
  tv1080: {
    name: "tv1080",
    styles: {
      width: "1920px",
      height: "1080px",
    },
    type: "desktop",
  },
  tv360: {
    name: "tv360",
    styles: {
      width: "640px",
      height: "360px",
    },
    type: "desktop",
  },
};

export const parameters = {
  options: {
    storySort: {
      order: ["Generic", "*"],
      method: "alphabetical",
    },
  },
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  viewport: {
    viewports: customViewports,
    defaultViewport: "tv360",
  },
  backgrounds: {
    default: "mid",
    values: [
      {
        name: "mid",
        value: "#aaaaaa",
      },
    ],
  },
};
