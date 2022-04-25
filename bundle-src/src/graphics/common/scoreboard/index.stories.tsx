import { ComponentMeta, ComponentStory } from "@storybook/react";
import { TeamDictionary } from "common/teamDictionary";
import { Scoreboard, Props } from "./index";

export default {
  title: "Generic/Scoreboard",
  component: Scoreboard,
  args: {
    homeName: "Home",
    awayName: "Away",
    homeScore: 2,
    awayScore: 10,
    homePrimaryColor: TeamDictionary["lancasterRoses"].primaryColor,
    awayPrimaryColor: TeamDictionary["yorkRoses"].primaryColor,
    homeSecondaryColor: TeamDictionary["lancasterRoses"].secondaryColor,
    awaySecondaryColor: TeamDictionary["yorkRoses"].secondaryColor,
    time: "00:00",
    timeVisible: true,
  },
} as ComponentMeta<typeof Scoreboard>;

export const ScoreboardStory: ComponentStory<typeof Scoreboard> = (
  args: Props
) => <Scoreboard {...args} />;
