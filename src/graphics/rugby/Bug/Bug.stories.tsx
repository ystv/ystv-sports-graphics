import { Meta, Story } from "@storybook/react";
import { Bug, BugProps, BugState } from "./Bug";
import { TeamDictionary } from "common/teamDictionary";

export default {
  title: "Bug",
  component: Bug,
} as Meta;

const Template: Story<BugProps> = (args) => <Bug {...args} />;

export const Hello = Template.bind({});

// Hello.args = {
//   state: BugState.Closed,
// };
//
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

Hello.parameters = {
  backgrounds: { default: "mid" },
};
