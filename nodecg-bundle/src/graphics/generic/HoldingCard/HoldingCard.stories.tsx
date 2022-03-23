import { Meta, Story } from "@storybook/react";
import { HoldingCard, HoldingCardProps } from "./HoldingCard";
import { TeamDictionary } from "common/teamDictionary";

export default {
  title: "HoldingCard",
  component: HoldingCard,
} as Meta;

const Template: Story<HoldingCardProps> = (args) => <HoldingCard {...args} />;

export const Hello = Template.bind({});

Hello.parameters = {
  backgrounds: { default: "mid" },
};
