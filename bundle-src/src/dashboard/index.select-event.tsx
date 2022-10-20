import "regenerator-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useOnlyReplicantValue, useReplicantValue } from "common/useReplicant";
import {
  Box,
  Button,
  Center,
  Container,
  Group,
  Loader,
  MantineProvider,
  Paper,
  Stack,
  Title,
} from "@mantine/core";
import { EventMeta, League } from "@ystv/scores/src/common/types";
import { EventID } from "common/types/eventID";
import invariant from "tiny-invariant";
import { Select } from "@mantine/core";
import { Alert } from "@mantine/core";

function Dashboard() {
  const [leagues, setLeagues] = useState<League[] | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [events, setEvents] = useState<EventMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    async function get() {
      setError(null);
      try {
        const result = await nodecg.sendMessage("list-leagues");
        setLeagues(result);
      } catch (e) {
        console.error("list-leagues ERROR", e);
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError(JSON.stringify(e));
        }
      }
    }
    get();
  }, []);
  useEffect(() => {
    async function getEvents(league: string) {
      setError(null);
      try {
        const result = await nodecg.sendMessage("list-events", { league });
        setEvents(result);
      } catch (e) {
        console.error("list-events ERROR", e);
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError(JSON.stringify(e));
        }
      }
    }
    if (selectedLeague !== null) {
      getEvents(selectedLeague);
    }
  }, [selectedLeague]);

  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    nodecg.readReplicant<EventID>("eventID", (val) => {
      if (selected === null && val !== null) {
        const [_, league, _type, uuid] = val.split("/");
        setSelectedLeague(league);
        setSelected(uuid);
      }
    });
  }, []);

  const [_, setRepValue] = useReplicantValue<EventID>("eventID");

  useEffect(() => {
    const listener = () => {
      console.log("Confirmed!", selected);
      // The API expects the ID to be in the form `Event/<type>/<id>`
      invariant(events, "got dialog-confirm before events were loaded");
      invariant(selectedLeague, "selected event with no league");
      const selectedEvt = events.find((x) => x.id === selected);
      invariant(selectedEvt, "did not find event for selection");
      setRepValue(
        `Event/${selectedLeague}/${selectedEvt.type}/${selectedEvt.id}`
      );
    };
    document.addEventListener("dialog-confirmed", listener);
    return () => document.removeEventListener("dialog-confirmed", listener);
  }, [selected]);

  return (
    <div style={{ margin: "1rem 4rem" }}>
      <MantineProvider theme={{}}>
        <Stack>
          <Title order={1}>Select Event</Title>

          {error && <Alert>{error}</Alert>}

          <Select
            data={
              leagues?.map((league) => ({
                label: league.name,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                value: league.slug!,
              })) ?? []
            }
            value={selectedLeague}
            onChange={setSelectedLeague}
            placeholder="Select League"
          />

          {events && (
            <Stack>
              {events.map((evt) => (
                <Box
                  key={evt.id}
                  style={{ margin: "1em 0", padding: "0.5em" }}
                  sx={(theme) => ({
                    border: "1px solid white",
                  })}
                >
                  <Stack>
                    <Title order={2}>{evt.name}</Title>
                    <span>{evt.type}</span>
                    <div>
                      <Button
                        onClick={() => setSelected(evt.id)}
                        variant={selected === evt.id ? "filled" : "outline"}
                        color={selected === evt.id ? "green" : "blue"}
                      >
                        {selected === evt.id ? "Selected" : "Select"}
                      </Button>
                    </div>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
      </MantineProvider>
    </div>
  );
}

ReactDOM.render(<Dashboard />, document.getElementById("root"));
