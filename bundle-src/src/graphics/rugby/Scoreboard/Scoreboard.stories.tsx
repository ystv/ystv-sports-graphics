import { Story, Meta } from "@storybook/react";
import { Scoreboard, ScoreboardProps } from "./Scoreboard";

export default {
  title: "Scoreboard",
  component: Scoreboard,
} as Meta;

const Template: Story<ScoreboardProps> = (args) => <Scoreboard {...args} />;

export const Hello = Template.bind({});

Hello.args = {
  isVisible: true,
  team1Score: 28,
  team2Score: 12,
  timer: 143,
};

Hello.argTypes = {};
