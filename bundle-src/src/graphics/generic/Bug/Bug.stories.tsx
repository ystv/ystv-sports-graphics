import { Meta, Story } from "@storybook/react";
import { Bug as BugComponent, BugProps } from "./Bug";
import { TeamDictionary } from "common/teamDictionary";

export default {
  title: "Generic/Bug",
  component: BugComponent,
} as Meta;

const Template: Story<BugProps> = (args) => <Bug {...args} />;

export const Bug = Template.bind({});

Bug.args = {
  state: true,
};

// Hello.argTypes = {
//   state: {
//     options: [0, 1, 2], // iterator
//     mapping: [0, 1, 2], // values
//     control: {
//       type: "select",
//       labels: Object.values(BugState),
//     },
//   },
// };
