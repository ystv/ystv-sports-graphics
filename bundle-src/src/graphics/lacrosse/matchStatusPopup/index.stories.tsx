import { ComponentMeta, ComponentStory } from "@storybook/react";
import { TeamDictionary } from "common/teamDictionary";
import { MatchStatusPopup, MatchStatusPopupProps } from "./index";

export default {
  title: "Football/Match Status Popup",
  component: MatchStatusPopup,
  args: {
    homeName: "Home",
    awayName: "Away",
    homeScore: 2,
    awayScore: 10,
    homePrimaryColor: TeamDictionary["lancasterRoses"].primaryColor,
    awayPrimaryColor: TeamDictionary["yorkRoses"].primaryColor,
    homeSecondaryColor: TeamDictionary["lancasterRoses"].secondaryColor,
    awaySecondaryColor: TeamDictionary["yorkRoses"].secondaryColor,
    half: 1,
  },
} as ComponentMeta<typeof MatchStatusPopup>;

export const ScoreboardStory: ComponentStory<typeof MatchStatusPopup> = (
  args: MatchStatusPopupProps
) => <MatchStatusPopup {...args} />;
