import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Component, Props } from "./index";

export default {
  title: "Common/Time Box",
  component: Component,
  args: {
    time: "00:00",
  },
} as ComponentMeta<typeof Component>;

export const Time_Box: ComponentStory<typeof Component> = (args: Props) => (
  <Component {...args} />
);
