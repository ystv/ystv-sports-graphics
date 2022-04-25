import { Meta, Story } from "@storybook/react";
import { HoldingCard, HoldingCardProps } from "./HoldingCard";
import { TeamDictionary } from "common/teamDictionary";

export default {
  title: "Generic/Holding Card",
  component: HoldingCard,
} as Meta;

const Template: Story<HoldingCardProps> = (args) => <HoldingCard {...args} />;

export const Holding_Card = Template.bind({});
