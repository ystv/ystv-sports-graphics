import { Story, Meta } from "@storybook/react";
import { Lineup, LineupProps } from "./Lineup";

export default {
  title: "Lineup",
  component: Lineup,
} as Meta;

const Template: Story<LineupProps> = (args) => <Lineup {...args} />;

export const Hello = Template.bind({});

Hello.args = {};

Hello.parameters = {
  backgrounds: { default: "light" },
};
