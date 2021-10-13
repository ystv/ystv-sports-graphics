import { Story, Meta } from "@storybook/react";
import { Scoreboard, ScoreboardProps } from "./Scoreboard";
import { TeamDictionary } from "../../../common/teamDictionary";

export default {
  title: "Scoreboard",
  component: Scoreboard,
} as Meta;

const Template: Story<ScoreboardProps> = (args) => <Scoreboard {...args} />;

export const Hello = Template.bind({});

Hello.args = {
  isVisible: true,
  team1Name: "york",
  team2Name: "glasgow",
  team1Score: 28,
  team2Score: 12,
  timer: "10:23",
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
