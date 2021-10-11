import { Story, Meta } from "@storybook/react";
import { LineupSubs, LineupSubsProps } from "./LineupSubs";

export default {
  title: "LineupSubs",
  component: LineupSubs,
} as Meta;

const Template: Story<LineupSubsProps> = (args) => <LineupSubs {...args} />;

export const Hello = Template.bind({});

Hello.args = {};

Hello.parameters = {
  backgrounds: { default: "light" },
};
