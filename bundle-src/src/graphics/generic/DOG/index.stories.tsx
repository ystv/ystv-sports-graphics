import { Meta, Story } from "@storybook/react";
import { Index, BugProps } from "./index";
import { TeamDictionary } from "common/teamDictionary";

export default {
  title: "Generic/DOG",
  component: Index,
} as Meta;

const Template: Story<BugProps> = (args) => <Index {...args} />;

export const DOG = Template.bind({});

DOG.args = {
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
