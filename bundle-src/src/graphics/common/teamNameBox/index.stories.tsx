import { ComponentMeta, ComponentStory } from "@storybook/react";
import { NameBox, Props } from "./index";

export default {
  title: "Common/Team Name Box",
  component: NameBox,
  args: {
    name: "York University",
    primaryColor: "#faaf18",
  },
} as ComponentMeta<typeof NameBox>;

export const Team_Name_Box: ComponentStory<typeof NameBox> = (args: Props) => (
  <NameBox {...args} />
);
