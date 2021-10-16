export interface TeamDictionaryTeam {
  teamName: string;
  logoSVG?: string;
  primaryColor: string;
  secondaryColor?: string;
  teamShort: string;
}

export const TeamDictionary: Record<string, TeamDictionaryTeam> = {
  york: { teamName: "York", primaryColor: "#009cf2", teamShort: "yrk" },
  glasgow: {
    teamName: "Glasgow",
    primaryColor: "#ffdd1a",
    secondaryColor: "#021223",
    teamShort: "gls",
  },
  leeds: {
    teamName: "Leeds",
    primaryColor: "#44ff33",
    teamShort: "lds",
  },
};
