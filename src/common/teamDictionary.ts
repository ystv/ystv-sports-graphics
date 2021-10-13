export interface TeamDictionaryTeam {
  teamName: string;
  logoSVG?: string;
  primaryColor: string;
  secondaryColor?: string;
  teamShort: string;
}

export const TeamDictionary: Record<string, TeamDictionaryTeam> = {
  york: { teamName: "York", primaryColor: "#FAAF18", teamShort: "yrk" },
  glasgow: {
    teamName: "Glasgow",
    primaryColor: "#0d0802",
    secondaryColor: "#ffdd1a",
    teamShort: "gls",
  },
  leeds: {
    teamName: "Leeds",
    primaryColor: "#44ff33",
    teamShort: "lds",
  },
};
