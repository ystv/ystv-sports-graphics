export interface TeamDictionaryTeam {
  teamName: string;
  logoSVG?: string;
  primaryColor: string;
  secondaryColor?: string;
  teamShort: string;
}

export const TeamDictionary: Record<string, TeamDictionaryTeam> = {
  yorkRoses: {
    teamName: "York",
    teamShort: "York",
    primaryColor: "#ebebeb",
    secondaryColor: "var(--ystv-dark)",
  },
  lancasterRoses: {
    teamName: "Lancaster",
    teamShort: "Lanc",
    primaryColor: "#e80708",
  },
  york: { teamName: "York", primaryColor: "#faaf18", teamShort: "yrk" },
  lancaster: {
    teamName: "Lancaster",
    primaryColor: "#c21313",
    teamShort: "lan",
  },
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
  yorkFutsal: { teamName: "York", primaryColor: "#d70d0d", teamShort: "yrk" },
  leicesterFutsal: {
    teamName: "Leicester",
    primaryColor: "#1837ee",
    teamShort: "lec",
  },
  sheffieldFutsal: {
    teamName: "Sheffield",
    primaryColor: "#d31414",
    teamShort: "shf",
  },
  northumbria: {
    teamName: "Northumbria",
    primaryColor: "#151515",
    teamShort: "ntb",
  },
  northumbriaInverted: {
    teamName: "Northumbria",
    primaryColor: "#eeeeee",
    secondaryColor: "#151515",
    teamShort: "ntb",
  },
};
