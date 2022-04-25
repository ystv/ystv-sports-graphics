import { Meta, Story } from "@storybook/react";
import { LowerThird, BugProps } from "./LowerThird";
import { TeamDictionary } from "common/teamDictionary";

export default {
  title: "Generic/Lower Third",
  component: LowerThird,
} as Meta;

const Template: Story<BugProps> = (args) => <LowerThird {...args} />;

export const Lower_Third = Template.bind({});
