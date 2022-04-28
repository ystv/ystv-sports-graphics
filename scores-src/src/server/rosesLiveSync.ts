import "dotenv-flow/config";
import { getLogger } from "./loggingSetup";
import got from "got";
import invariant from "tiny-invariant";
import { EVENT_TYPES } from "../common/sports";
import { identity } from "lodash-es";
import { BaseEventType } from "../common/types";
import * as fs from "fs";
import * as path from "path";
import { ensure } from "./errs";

const logger = getLogger("rosesLiveSync");

const lockfilePath = path.join(process.cwd(), ".rosesLiveSync.lock");
const ourPid = process.pid.toString(10);
if (fs.existsSync(lockfilePath)) {
  const contents = fs.readFileSync(lockfilePath, { encoding: "ascii" });
  if (contents.trim() === ourPid) {
    logger.warn(
      "Found a lockfile with our PID. This suggests we didn't properly finish last time. " +
        "(Also, this should never actually happen!)"
    );
  } else {
    ensure(
      false,
      Error,
      `Lock file exists, likely another process is already working or crashed. ` +
        `If you're sure that there are no other instances of this script, you can delete ${lockfilePath}.`
    );
  }
}
const lockFile = fs.openSync(lockfilePath, "wx");
fs.writeSync(lockFile, ourPid);
fs.closeSync(lockFile);

function conf<T>(varName: string, parser: (v: string) => T): T {
  const val = process.env[varName];
  ensure(!!val, Error, `${varName} must be set!`);
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

interface FeedEntry {
  id: number;
  timetable_entry_id: number;
  live_moment_type_id: number;
  author?: string;
  score_game_york: any;
  score_roses_york?: string;
  score_game_lancs: any;
  score_roses_lancs?: string;
  text: string;
  picture_file: any;
  created_at: string;
  updated_at: string;
  team: Team;
  live_moment_type: LiveMomentType;
}

interface Team {
  title: string;
  sport: Sport;
}

interface Sport {
  id: number;
  title: string;
}

interface LiveMomentType {
  name: string;
}

const mapSportIDsToTypeNames: Record<number, keyof typeof EVENT_TYPES> = {
  14: "rowing",
  86: "handball",
  26: "lacrosse",
  27: "football",
  25: "netball",
  33: "basketball",
  54: "running",
  3: "equestrian",
  1: "cricket",
  35: "ultimate",
  32: "hockey",
  28: "tennis",
  10: "pool",
  5: "indoorHockey",
  100: "underwaterHockey",
  42: "americanFootball",
  40: "powerLifting",
  98: "eSports",
  36: "futsal",
  6: "squash",
  50: "climbing",
  24: "sailing",
  52: "cycling",
  9: "darts",
  4: "badminton",
  21: "rugbyUnion",
  12: "swimming",
  20: "canoeSlalom",
  38: "trampoline",
  19: "fencing",
  2: "golf",
  83: "chess",
  13: "archery",
  23: "ballroomDancing",
  15: "snooker",
  18: "korfball",
  91: "poleFitness",
  55: "dance",
  47: "snowSports",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isNodeError = (error: any): error is NodeJS.ErrnoException =>
  error instanceof Error;

const SCORE_UPDATE_LIVE_MOMENT_TYPE_ID = 15;

async function syncScores() {
  const statePath = path.join(process.cwd(), ".rosesLiveSync.state.json");
  let state: State;
  try {
    state = JSON.parse(fs.readFileSync(statePath, { encoding: "utf8" }));
  } catch (e) {
    if (isNodeError(e) && e.code === "ENOENT") {
      state = {
        lastProcessedUpdate: 0,
      };
    } else {
      throw e;
    }
  }

  logger.info("Starting sync", {
    lastId: state.lastProcessedUpdate,
  });

  const feed: FeedEntry[] = await rosesLiveAPIClient
    .get(`feed/since/${state.lastProcessedUpdate}.json`)
    .json();
  logger.info("Feed items to process", {
    len: feed.length,
  });

  const allKnownEvents: BaseEventType[] = await sportsAPIClient
    .get("events")
    .json();
  logger.info("Got our events", { len: allKnownEvents.length });

  for (const entry of feed) {
    if (entry.live_moment_type_id === SCORE_UPDATE_LIVE_MOMENT_TYPE_ID) {
      const event = allKnownEvents.find(
        (x) => x.rosesLiveID === entry.timetable_entry_id
      );
      if (!event) {
        logger.info("Did not find event for update, skipping", {
          event: entry.team?.sport?.title + " " + entry.team?.title,
        });
        state.lastProcessedUpdate = entry.id;
        continue;
      }
      if (!event.notCovered) {
        logger.info("Skipping update for covered event", {
          event: entry.team?.sport?.title + " " + entry.team?.title,
        });
        state.lastProcessedUpdate = entry.id;
        continue;
      }

      let winner: "home" | "away";
      if (entry.text.includes("<Strong>Lancs</Strong> Win")) {
        winner = "home";
      } else if (entry.text.includes("<Strong>York</Strong> Win")) {
        winner = "away";
      } else {
        logger.error("ABOUT TO CRASH!", { entry });
        ensure(
          false,
          Error,
          `The text for an update was not recognised: ${entry.text}`
        );
      }

      logger.info("Declaring winner.", {
        event: entry.team?.sport?.title + " " + entry.team?.title,
        winner,
        id: event.id,
      });

      await sportsAPIClient.post(
        `events/_extra/${event.type}/${event.id}/_declareWinner`,
        {
          json: {
            winner,
          },
        }
      );
    }
    state.lastProcessedUpdate = entry.id;
  }

  logger.info("Done, writing state file.", {
    newLPU: state.lastProcessedUpdate,
  });

  fs.writeFileSync(statePath, JSON.stringify(state), { encoding: "utf-8" });

  fs.unlinkSync(lockfilePath);
  process.exit(0);
}

async function importTimetable() {
  const res: TimetableEntry[] = await rosesLiveAPIClient(
    "feed/timetable.json"
  ).json();
  invariant(Array.isArray(res), "got a non-array timetable");
  logger.info("Got timetable", { len: res.length });

  const allKnownEvents: BaseEventType[] = await sportsAPIClient
    .get("events")
    .json();
  logger.info("Got our events", { len: allKnownEvents.length });

  for (const entry of res) {
    const sportTypeId = entry.team.sport.id;
    const sportTypeName = mapSportIDsToTypeNames[sportTypeId];
    if (!sportTypeName) {
      // logger.debug("Skipping unknown sport type", {
      //   id: entry.team.sport.id,
      //   name: entry.team.sport.title,
      // });
      continue;
    }
    const match = allKnownEvents.find((x) => x.rosesLiveID === entry.id);
    if (match) {
      continue;
    }
    const oneOfOurs = sportTypeName in EVENT_TYPES;
    if (oneOfOurs) {
      logger.info("Skipping event due to oneOfOurs", {
        type: sportTypeName,
        id: entry.id,
        title: entry.team.title,
        start: entry.start,
      });
      continue;
    }
    logger.info("Creating event", {
      type: sportTypeName,
      id: entry.id,
      title: entry.team.title,
    });
    const result: BaseEventType = await sportsAPIClient
      .post("events/_extra/" + sportTypeName, {
        json: {
          name: entry.team.title,
          type: sportTypeName,
          startTime: entry.start,
          notCovered: !oneOfOurs,
          worthPoints: entry.point.amount,
          rosesLiveID: entry.id,
        } as BaseEventType,
      })
      .json();
    logger.debug("Created", { id: result.id });
  }
  fs.unlinkSync(lockfilePath);
  process.exit(0);
}

(async function () {
  switch (process.argv[2]) {
    case "sync":
      await syncScores();
      break;
    case "import-timetable":
      await importTimetable();
      break;
    default:
      throw new Error("Unknown command " + process.argv[2]);
  }
})();
