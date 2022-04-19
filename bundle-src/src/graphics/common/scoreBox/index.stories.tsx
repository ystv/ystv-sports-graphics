import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Component, Props } from "./index";

export default {
  title: "Common/Score Box",
  component: Component,
  args: {
    score: 0,
  },
} as ComponentMeta<typeof Component>;

export const Score_Box: ComponentStory<typeof Component> = (args: Props) => (
  <Component {...args} />
);
