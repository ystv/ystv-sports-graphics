import { Meta, Story } from "@storybook/react";
import { LowerThird, BugProps } from "./LowerThird";
import { TeamDictionary } from "common/teamDictionary";

export default {
  title: "LowerThird",
  component: LowerThird,
} as Meta;

const Template: Story<BugProps> = (args) => <LowerThird {...args} />;

export const Hello = Template.bind({});

Hello.parameters = {
  backgrounds: { default: "mid" },
};
