import "dotenv-flow/config";
import { getLogger } from "./loggingSetup";
import got from "got";
import invariant from "tiny-invariant";
import { EVENT_TYPES } from "../common/sports";
import yargs from "yargs";
import { identity } from "lodash-es";
import { hideBin } from "yargs/helpers";

const logger = getLogger("rosesLiveSync");

function conf<T>(varName: string, parser: (v: string) => T): T {
  const val = process.env[varName];
  invariant(val, `${varName} must be set!`);
  return parser(val);
}

const rosesLiveAPIBase = conf("ROSES_LIVE_API_BASE", identity);
const sportsAPIBase = conf("PUBLIC_API_BASE", identity);
const sportsAPIUser = conf("SPORTS_API_USER", identity);
const sportsAPIPass = conf("SPORTS_API_PASS", identity);

logger.info("Loaded config", {
  rosesLiveAPIBase,
  sportsAPIBase,
  sportsAPIUser,
  sportsAPIPass: "****",
});

const rlClientLogger = getLogger("rosesLiveAPI");

const rosesLiveAPIClient = got.extend({
  prefixUrl: rosesLiveAPIBase,
  headers: {
    "User-Agent": "YSTV-Sports-Graphics",
  },
  hooks: {
    afterResponse: [
      (res) => {
        rlClientLogger.debug("API Request", {
          url: res.url,
          status: res.statusCode,
          contentLength: res.headers["content-length"],
        });
        return res;
      },
    ],
  },
});

const sportsAPIClient = got.extend({
  prefixUrl: sportsAPIBase,
  headers: {
    "User-Agent": "RosesLiveSync",
  },
  username: sportsAPIUser,
  password: sportsAPIPass,
  hooks: {
    afterResponse: [
      (res) => {
        rlClientLogger.debug("API Request", {
          url: res.url,
          status: res.statusCode,
          contentLength: res.headers["content-length"],
        });
        return res;
      },
    ],
  },
});

interface State {
  lastProcessedUpdate: number;
}

interface TimetableEntry {
  id: number;
  team_id: number;
  location_id: number;
  year: string;
  start: string;
  created_at: string;
  updated_at: string;
  scan_coverage: unknown;
  la1tv_coverage_level: unknown;
  bailriggfm_coverage: unknown;
  warmup_location_id: number;
  warmup_at?: string;
  note: string;
  watch: unknown;
  team: {
    title: string;
    sport: {
      id: number;
      title: string;
    };
  };
  location: {
    name: string;
  };
  point: {
    amount: number;
  };
}

const mapSportIDsToTypeNames: Record<number, keyof typeof EVENT_TYPES> = {
  86: "handball",
  26: "lacrosse",
  27: "football",
  25: "netball",
  33: "basketball",
};

export async function syncScores() {
  process.exit(0);
}

export async function importTimetable() {
  const res: TimetableEntry[] = await rosesLiveAPIClient(
    "feed/timetable.json"
  ).json();
  invariant(Array.isArray(res), "got a non-array timetable");
  logger.info("Got timetable", { len: res.length });
  for (const entry of res) {
    const sportTypeId = entry.team.sport.id;
    if (!(sportTypeId in mapSportIDsToTypeNames)) {
      logger.debug("Skipping unknown sport type", {
        id: entry.team.sport.id,
        name: entry.team.sport.title,
      });
      continue;
    }
  }
  process.exit(0);
}

yargs(hideBin(process.argv))
  .command(
    "import-timetable",
    "Import timetable.",
    (yargs) => yargs,
    async () => {
      await importTimetable();
    }
  )
  .demandCommand()
  .parse();
