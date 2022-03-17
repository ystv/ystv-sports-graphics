import { Story, Meta } from "@storybook/react";
import { MatchStatus, MatchStatusProps } from "./MatchStatus";
import { TeamDictionary } from "../../../common/teamDictionary";

export default {
  title: "MatchStatus",
  component: MatchStatus,
} as Meta;

const Template: Story<MatchStatusProps> = (args) => <MatchStatus {...args} />;

export const Hello = Template.bind({});

Hello.args = {
  isVisible: true,
  lineupTeam: 0,
};

Hello.argTypes = {
  team1Name: {
    options: Object.keys(TeamDictionary),
    control: { type: "select" },
  },
  team2Name: {
    options: Object.keys(TeamDictionary),
    control: { type: "select" },
  },
};
