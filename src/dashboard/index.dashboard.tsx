import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useReplicantValue } from "common/useReplicant";
import { TeamDictionary } from "common/teamDictionary";
import {
  ChakraProvider,
  ButtonGroup,
  Button,
  Checkbox,
  Heading,
  Select,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  SimpleGrid,
  Grid,
  Box,
  Input,
} from "@chakra-ui/react";

const LiveButton = ({ callback }: { callback: Function }) => (
  <Button onClick={() => callback(true)} colorScheme={"green"}>
    LIVE
  </Button>
);

const KillButton = ({ callback }: { callback: Function }) => (
  <Button onClick={() => callback(false)} colorScheme={"red"}>
    KILL
  </Button>
);

const LiveKillButtons = ({
  name,
  live,
  callback,
  children,
}: {
  name: string;
  live: boolean;
  callback: Function;
  children?: JSX.Element;
}) => (
  <>
    <Heading as="h2" size="lg">
      {name}
    </Heading>
    <strong>Status: {live ? "LIVE" : "HIDDEN"}</strong>
    <br />
    <ButtonGroup>
      <LiveButton callback={callback} />
      <KillButton callback={callback} />
    </ButtonGroup>
    {children}
    <br />
    <br />
    <hr style={{ borderTopWidth: "2px", borderColor: "grey" }} />
  </>
);

function Dashboard() {
  const [team1ID, setTeam1ID] = useReplicantValue("team1ID", undefined, {
    defaultValue: "york",
  });
  const [team2ID, setTeam2ID] = useReplicantValue("team2ID", undefined, {
    defaultValue: "glasgow",
  });

  //
  const [showScoreboard, setShowScoreboard] = useReplicantValue(
    "showScoreboard",
    undefined,
    {
      defaultValue: false,
    }
  );
  const [team1Score, setTeam1Score] = useReplicantValue(
    "team1Score",
    undefined,
    {
      defaultValue: 0,
    }
  );
  const [team2Score, setTeam2Score] = useReplicantValue(
    "team2Score",
    undefined,
    {
      defaultValue: 0,
    }
  );
  const [showTimer, setShowTimer] = useReplicantValue("showTimer", undefined, {
    defaultValue: false,
  });
  const [timer, setTimer] = useReplicantValue("timer", undefined, {
    defaultValue: 0,
  });

  const [showLineup, setShowLineup] = useReplicantValue(
    "showLineup",
    undefined,
    {
      defaultValue: false,
    }
  );
  const [lineupTeam, setLineupTeam] = useReplicantValue(
    "lineupTeam",
    undefined,
    {
      defaultValue: 0,
    }
  );

  const [showLineupSubs, setShowLineupSubs] = useReplicantValue(
    "showLineupSubs",
    undefined,
    {
      defaultValue: false,
    }
  );
  const [lineupSubsTeam, setLineupSubsTeam] = useReplicantValue(
    "lineupSubsTeam",
    undefined,
    {
      defaultValue: 0,
    }
  );

  const [showThird, setShowThird] = useReplicantValue("showThird", undefined, {
    defaultValue: false,
  });
  const [name, setName] = useReplicantValue("name", undefined, {
    defaultValue: "",
  });
  const [role, setRole] = useReplicantValue("role", undefined, {
    defaultValue: "",
  });

  const [showBug, setShowBug] = useReplicantValue("showBug", undefined, {
    defaultValue: false,
  });

  const [showStatus, setShowStatus] = useReplicantValue(
    "showStatus",
    undefined,
    {
      defaultValue: false,
    }
  );
  const [matchOver, setMatchOver] = useReplicantValue("matchOver", undefined, {
    defaultValue: false,
  });

  const [showHoldingCard, setShowHoldingCard] = useReplicantValue(
    "showHoldingCard",
    undefined,
    {
      defaultValue: false,
    }
  );

  const [holdingCardIsGeneric, setHoldingCardIsGeneric] = useReplicantValue(
    "holdingCardIsGeneric",
    undefined,
    {
      defaultValue: false,
    }
  );
  return (
    <div style={{ margin: "1rem 4rem" }}>
      <ChakraProvider>
        <Heading as="h2" size="lg">
          Set Teams
        </Heading>
        <Grid templateColumns="repeat(2, 1fr)" spacing={8}>
          <FormLabel>Team1</FormLabel>
          <FormLabel>Team2</FormLabel>
          <Select
            value={team1ID || "york"}
            onChange={(e) => setTeam1ID(e.target.value)}
          >
            {Object.keys(TeamDictionary).map((e) => (
              <option value={e}>
                {e[0].toUpperCase() + e.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
          <Select
            value={team2ID || "york"}
            onChange={(e) => setTeam2ID(e.target.value)}
          >
            {Object.keys(TeamDictionary).map((e) => (
              <option value={e}>
                {e[0].toUpperCase() + e.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        </Grid>
        <br />
        <hr style={{ borderTopWidth: "2px", borderColor: "grey" }} />
        {/* ////////////////////// */}
        <LiveKillButtons
          name={"Holding Card"}
          live={showHoldingCard}
          callback={setShowHoldingCard}
        >
          <Checkbox
            checked={holdingCardIsGeneric || false}
            onChange={(e) => setHoldingCardIsGeneric(e.target.checked)}
          >
            Is Unbranded?
          </Checkbox>
        </LiveKillButtons>
        <LiveKillButtons name="Bug" live={showBug} callback={setShowBug} />
        <LiveKillButtons
          name="Generic Lower Third"
          live={showThird}
          callback={setShowThird}
        >
          <>
            <FormLabel>Name</FormLabel>
            <Input
              type="text"
              value={name || ""}
              onChange={(e) => setName(e.target.value)}
            />
            <FormLabel>Role</FormLabel>
            <Input
              type="text"
              value={role || ""}
              onChange={(e) => setRole(e.target.value)}
            />
          </>
        </LiveKillButtons>
        <LiveKillButtons
          name="Scoreboard"
          live={showScoreboard}
          callback={setShowScoreboard}
        >
          <>
            <form>
              <Grid templateColumns="repeat(2, 1fr)" spacing={8}>
                <strong>Home Team</strong>
                <strong>Away Team</strong>
                <NumberInput
                  type="number"
                  value={team1Score}
                  onChange={(e) => setTeam1Score(Number(e))}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <NumberInput
                  type="number"
                  value={team2Score}
                  onChange={(e) => setTeam2Score(Number(e))}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </Grid>
            </form>
            <br />
            <Checkbox
              checked={showTimer || false}
              onChange={(e) => setShowTimer(e.target.checked)}
            >
              Include Timer
            </Checkbox>
            <Stopwatch updateStopWatchTime={setTimer} time={timer} />
          </>
        </LiveKillButtons>
        <LiveKillButtons
          name="Half/Full-time Status Aston"
          live={showStatus}
          callback={setShowStatus}
        >
          <Checkbox
            checked={matchOver || false}
            onChange={(e) => setMatchOver(e.target.checked)}
          >
            End of match?
          </Checkbox>
        </LiveKillButtons>
      </ChakraProvider>
    </div>
  );
}

ReactDOM.render(<Dashboard />, document.getElementById("root"));

function Stopwatch({
  updateStopWatchTime,
  time,
}: {
  updateStopWatchTime: Function;
  time: number;
}) {
  const [interval, setInterval] = useState<number | null>(null);
  const [increment, setIncrement] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useInterval(() => {
    if (time + increment >= 0) {
      updateStopWatchTime(time + increment);
    }
  }, interval);

  const secondToTimeString = (time: number): string =>
    `${String(Math.floor(time / 60)).padStart(2, "0")}:${String(
      time % 60
    ).padStart(2, "0")}`;

  return (
    <div>
      <Box borderWidth="2px" borderRadius="lg" maxW="3xs">
        <Heading size="2xl">{secondToTimeString(time)}</Heading>
      </Box>
      <ButtonGroup>
        <Button onClick={() => setInterval(1000)}>Start</Button>
        <Button onClick={() => setInterval(null)}>Stop</Button>
        <Button onClick={() => updateStopWatchTime(0)}>Reset</Button>
        <Button onClick={() => setIncrement(-increment)}>
          Toggle Direction
        </Button>
      </ButtonGroup>
      <br />
      <strong>{increment == 1 ? "counting up" : "counting down"}</strong>
      <br />
      <br />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          updateStopWatchTime(minutes * 60 + seconds);
        }}
      >
        <Heading size="md">Set Time</Heading>
        <Grid templateColumns="repeat(2, 1fr)" spacing={8}>
          <Heading size="sm">Minutes</Heading>
          <Heading size="sm">Seconds</Heading>
          <NumberInput
            value={minutes | 0}
            onChange={(e) => setMinutes(Number(e))}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <NumberInput
            type="number"
            value={seconds | 0}
            onChange={(e) => setSeconds(Number(e))}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </Grid>
        <Button type="submit">Update</Button>
      </form>
    </div>
  );
}

function useInterval(callback: any, delay: any) {
  const savedCallback = useRef(() => null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }

    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}
