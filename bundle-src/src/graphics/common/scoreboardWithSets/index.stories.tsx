import { ComponentMeta, ComponentStory } from "@storybook/react";
import { TeamDictionary } from "common/teamDictionary";
import { ScoreboardWithSets, Props } from "./index";

export default {
  title: "Generic/Scoreboard With Sets",
  component: ScoreboardWithSets,
  args: {
    homeScore: 2,
    awayScore: 10,
    homeSets: 3,
    awaySets: 2,
  },
} as ComponentMeta<typeof ScoreboardWithSets>;

export const ScoreboardStory: ComponentStory<typeof ScoreboardWithSets> = (
  args: Props
) => <ScoreboardWithSets {...args} />;
