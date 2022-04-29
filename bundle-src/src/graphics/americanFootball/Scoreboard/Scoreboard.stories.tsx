import { Story, Meta } from "@storybook/react";
import { Scoreboard, ScoreboardProps } from "./Scoreboard";
import { TeamDictionary } from "../../../common/teamDictionary";

export default {
  title: "American Football Scoreboard",
  component: Scoreboard,
} as Meta;

const Template: Story<ScoreboardProps> = (args) => <Scoreboard {...args} />;

export const Hello = Template.bind({});

Hello.args = {
  isVisible: true,
  team1Score: 28,
  team2Score: 12,
  time: 143,
  isTimerShown: true,
  quarter: 2,
};
