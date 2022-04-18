import { ComponentMeta, ComponentStory } from "@storybook/react";
import Component from "./index";

export default {
  title: "Common/Time Box",
  component: Component,
} as ComponentMeta<typeof Component>;

export const Time_Box: ComponentStory<typeof Component> = (args) => (
  <Component {...args} time={"1"} />
);
