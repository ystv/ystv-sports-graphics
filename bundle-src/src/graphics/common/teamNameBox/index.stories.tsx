import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Component, Props } from "./index";

export default {
  title: "Common/Team Name Box",
  component: Component,
  args: {
    name: "Lancaster",
  },
} as ComponentMeta<typeof Component>;

export const Team_Name_Box: ComponentStory<typeof Component> = (
  args: Props
) => <Component {...args} />;
