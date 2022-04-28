import { ComponentMeta, ComponentStory } from "@storybook/react";
import { TeamDictionary } from "common/teamDictionary";
import { LineupTable, LineupTableProps } from "./index";

export default {
  title: "Generic/Lineup Table",
  component: LineupTable,
  args: {
    title: "Test",
    home: Array(11).fill({ name: "John Smith", designation: "1" }),
    away: Array(11).fill({
      name: "Samuel Someperson-Longname",
      designation: "69",
    }),
  },
} as ComponentMeta<typeof LineupTable>;

export const ScoreboardStory: ComponentStory<typeof LineupTable> = (
  args: LineupTableProps
) => <LineupTable {...args} />;
