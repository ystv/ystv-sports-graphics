import { ComponentMeta, ComponentStory } from "@storybook/react";
import { TeamDictionary } from "common/teamDictionary";
import { Component, Props } from "./index";

export default {
  title: "Football/Scoreboard",
  component: Component,
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
} as ComponentMeta<typeof Component>;

export const Scoreboard: ComponentStory<typeof Component> = (args: Props) => (
  <Component {...args} />
);
