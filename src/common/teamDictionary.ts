interface TeamDictionaryTeam {
  teamName: string;
  logoSVG?: string;
  primaryColor: string;
  secondaryColor?: string;
}

const TeamDictionary: TeamDictionaryTeam[] = [
  { teamName: "York", primaryColor: "#FAAF18" },
  { teamName: "Glasgow", primaryColor: "#0d0802", secondaryColor: "#ffdd1a" },
];
