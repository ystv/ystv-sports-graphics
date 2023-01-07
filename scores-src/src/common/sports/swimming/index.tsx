import { FastField, useField, Field as FormikField, FieldProps } from "formik";
import * as Yup from "yup";
import {
  SelectField,
  ArrayField,
  RandomUUIDField,
  Field,
  SegmentedSelectField,
} from "../../formFields";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  ActionRenderers,
  BaseEventStateType,
  EventComponents,
  EventMeta,
  EventTypeInfo,
} from "../../types";
import {
  Action,
  ActionPayloadValidators,
  ActionValidChecks,
} from "../../types";
import {
  Button,
  Group,
  Input,
  SegmentedControl,
  Space,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  TypographyStylesProvider,
} from "@mantine/core";
import { wrapAction } from "../../eventStateHelpers";
import invariant from "tiny-invariant";
import {
  formatMMSSMS,
  startClockAt,
  stopClockAt,
  UpwardClock,
  UpwardClockType,
} from "../../clock";
import { mapKeys, mapValues } from "lodash-es";
import { useEffect, useState } from "react";
import { RenderClock } from "../../components/Clock";

const POOL_LENGTH_METRES = 25;

export interface RunState {
  swimmersByLane: Record<
    string,
    {
      name: string;
      side: "home" | "away";
    }
  >;
  totalDistanceMetres: number;
  style: string;
  clock: UpwardClockType;
  splits: Array<{
    timesByLane: Record<string, number>;
  }>;
}

export interface State extends BaseEventStateType {
  runs: RunState[];
  currentRun: number | null;
}

function findLastIndex<T>(
  array: Array<T>,
  predicate: (value: T, index: number, obj: T[]) => boolean
): number {
  let l = array.length;
  while (l--) {
    if (predicate(array[l], l, array)) return l;
  }
  return -1;
}

const slice = createSlice({
  name: "swimming",
  initialState: {
    id: "INVALID",
    type: "swimming",
    name: "",
    startTime: "2022-04-29T09:00:00+01:00",
    worthPoints: 0,
    runs: [],
    currentRun: null,
  } as State,
  reducers: {
    setNextRun(state, action: PayloadAction<{ idx: string }>) {
      const idxVal = parseInt(action.payload.idx, 10);
      invariant(typeof state.runs[idxVal] !== "undefined", "invalid run");
      state.currentRun = idxVal;
    },
    startRun(state, action: PayloadAction<{ deviceTS: number }>) {
      invariant(state.currentRun !== null, "no current run");
      startClockAt(state.runs[state.currentRun].clock, action.payload.deviceTS);
    },
    split(state, action: PayloadAction<{ lane: string; deviceTS: number }>) {
      invariant(state.currentRun !== null, "no current run");
      const run = state.runs[state.currentRun];
      invariant(run.clock.state === "running", "run not started");
      invariant(action.payload.lane in run.swimmersByLane, "invalid lane");

      // Find the first split that we haven't recorded a time for.
      // If we're in the lead, there might not be one.
      // This is also the case when there hasn't been a split yet.
      const latestSplitIndex = findLastIndex(
        run.splits,
        (x) => action.payload.lane in x.timesByLane
      );
      let nextSplitIndex;

      if (run.splits.length === 0) {
        // very first split
        run.splits.push({ timesByLane: {} });
        nextSplitIndex = 0;
      } else if (latestSplitIndex === -1) {
        // not the first split, but we're not on any
        nextSplitIndex = 0;
      } else if (latestSplitIndex === run.splits.length - 1) {
        // we're in the lead
        run.splits.push({ timesByLane: {} });
        nextSplitIndex = run.splits.length - 1;
      } else {
        nextSplitIndex = latestSplitIndex + 1;
      }
      run.splits[nextSplitIndex].timesByLane[action.payload.lane] =
        action.payload.deviceTS;

      // If we're the last one to finish this split, and it's the last split,
      // we can stop the clock.
      if (
        Object.keys(run.splits[run.splits.length - 1].timesByLane).length ===
          Object.keys(run.swimmersByLane).length &&
        run.splits.length * POOL_LENGTH_METRES === run.totalDistanceMetres
      ) {
        stopClockAt(
          state.runs[state.currentRun].clock,
          action.payload.deviceTS
        );
      }
    },
  },
});

const RunSchema: Yup.SchemaOf<RunState> = Yup.object({
  swimmersByLane: Yup.lazy((obj) =>
    Yup.object(
      mapValues(obj, () =>
        Yup.object({
          name: Yup.string().required(),
          side: Yup.mixed<"home" | "away">().oneOf(["home", "away"]).required(),
        }).required()
      )
    )
  ),
  totalDistanceMetres: Yup.number().required(),
  style: Yup.string().required(),
  splits: Yup.array()
    .of(
      Yup.object({
        timesByLane: Yup.lazy((obj) =>
          Yup.object(mapValues(obj, () => Yup.number().required()))
        ),
      })
    )
    .required()
    .default([]),
  clock: UpwardClock,
});

export const reducer = slice.reducer;
export const actions = slice.actions;
export const schema: Yup.SchemaOf<State> = Yup.object().shape({
  currentRun: Yup.number().nullable().default(null),
  runs: Yup.array().of(RunSchema.required()).required().default([]),
});

export const actionPayloadValidators: ActionPayloadValidators<
  typeof slice["actions"]
> = {
  setNextRun: Yup.object({
    // String because SelectField can only have string values
    idx: Yup.string().required(),
  }),
  startRun: Yup.object({
    deviceTS: Yup.number().required(),
  }),
  split: Yup.object({
    deviceTS: Yup.number().required(),
    lane: Yup.string().required(),
  }),
};

export const actionValidChecks: ActionValidChecks<
  State,
  typeof slice["actions"]
> = {
  setNextRun: (state) => state.runs.length > 0,
  startRun: (state) =>
    state.currentRun !== null &&
    state.runs[state.currentRun].clock.state === "stopped",
  split: (state) =>
    state.currentRun !== null &&
    state.runs[state.currentRun].clock.state === "running",
};

export const actionRenderers: ActionRenderers<
  typeof actions,
  typeof slice["caseReducers"],
  State
> = {
  setNextRun: ({ state }) => {
    invariant(state.currentRun !== null, "no current run");
    const run = state.runs[state.currentRun];
    return (
      <span>
        Next run: {run.totalDistanceMetres}m {run.style}
      </span>
    );
  },
  startRun: () => <span>Started.</span>,
  split: ({ state, action }) => {
    invariant(state.currentRun !== null, "no current run");
    const run = state.runs[state.currentRun];
    const latestSplitIndex = findLastIndex(
      run.splits,
      (x) => action.payload.lane in x.timesByLane
    );
    const swimmer = run.swimmersByLane[action.payload.lane];
    const time = action.payload.deviceTS - run.clock.wallClockLastStarted;
    return (
      <span>
        {swimmer.name}: {(latestSplitIndex + 1) * POOL_LENGTH_METRES}m at{" "}
        {formatMMSSMS(time, 1, 2)}
      </span>
    );
  },
};

export function RenderScore({
  state,
  meta,
  act,
}: Parameters<EventComponents<typeof actions, State>["RenderScore"]>[0]) {
  if (state.currentRun === null) {
    return <span>No run selected.</span>;
  }
  const run = state.runs[state.currentRun];

  const [kbdEnabled, setKbdEnabled] = useState(false);

  useEffect(() => {
    if (run.clock.state === "running") {
      const handler = (e: KeyboardEvent) => {
        const lane = e.key;
        if (lane[0] < "0" || lane[0] > "9") {
          return;
        }
        if (lane in run.swimmersByLane) {
          act("split", { lane, deviceTS: Date.now() });
        }
      };
      window.addEventListener("keydown", handler);
      setKbdEnabled(true);
      return () => {
        window.removeEventListener("keydown", handler);
        setKbdEnabled(false);
      };
    }
  }, [run.clock.state]);

  return (
    <Stack>
      <Title order={2}>
        {run.totalDistanceMetres}m {run.style}
      </Title>
      {run.clock.state === "running" && (
        <RenderClock clock={run.clock} precisionHigh={2} precisionMs={1} />
      )}
      <Table>
        <thead>
          <tr>
            <th>Lane</th>
            <th>Name</th>
            <th>Side</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(run.swimmersByLane).map((key) => (
            <tr key={key}>
              <td>{key}</td>
              <td>{run.swimmersByLane[key].name}</td>
              <td>
                {run.swimmersByLane[key].side === "home"
                  ? meta.homeTeam.name
                  : meta.awayTeam.name}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {run.clock.state === "running" && (
        <>
          <Space h="md" />
          {Object.keys(run.swimmersByLane).map((key) => {
            const latestSplitIndex = findLastIndex(
              run.splits,
              (x) => key in x.timesByLane
            );
            const finished =
              (latestSplitIndex + 1) * POOL_LENGTH_METRES ===
              run.totalDistanceMetres;
            return (
              <Button
                key={key}
                size="lg"
                onClick={() =>
                  act("split", { lane: key, deviceTS: Date.now() })
                }
                disabled={finished}
              >
                {key}
              </Button>
            );
          })}
          {kbdEnabled && (
            <>
              <Space h="sm" />
              <Text color="dimmed">
                You can also use the 0-9 keys on your keyboard.
              </Text>
            </>
          )}
        </>
      )}
      {run.clock.state === "stopped" && run.splits.length === 0 && (
        <Button
          size="xl"
          onClick={() => act("startRun", { deviceTS: Date.now() })}
        >
          Start
        </Button>
      )}
    </Stack>
  );
}

export interface ActionFormProps<TState> {
  currentState: TState;
}

function LanesFieldRow(props: {
  namespace: string;
  num: string;
  meta: EventMeta;
  onNumChange: (num: string) => unknown;
  onRemove: () => unknown;
}) {
  const [num, setNum] = useState(props.num);
  function blur() {
    props.onNumChange(num);
  }
  return (
    <Group
      sx={(theme) => ({
        display: "table-row",
      })}
    >
      <TextInput
        placeholder="Lane"
        value={num}
        onChange={(v) => setNum(v.target.value)}
        onBlur={blur}
        style={{ display: "table-cell" }}
      />
      <FastField
        as={TextInput}
        name={`${props.namespace}.name`}
        title="Name"
        style={{ display: "table-cell" }}
      />
      <FastField name={`${props.namespace}.side`}>
        {({ field, form }: FieldProps<"home" | "away">) => (
          <Input.Wrapper title="Side" style={{ display: "table-cell" }}>
            <SegmentedControl
              data={[
                {
                  label: props.meta.homeTeam.name,
                  value: "home",
                },
                { label: props.meta.awayTeam.name, value: "away" },
              ]}
              title="Side"
              value={field.value}
              onChange={(val) => form.setFieldValue(field.name, val)}
            />
          </Input.Wrapper>
        )}
      </FastField>
      <Button
        onClick={() => props.onRemove()}
        sx={(theme) => ({ display: "table-cell" })}
        variant="subtle"
      >
        -
      </Button>
    </Group>
  );
}

function LanesField(props: { name: string; meta: EventMeta }) {
  const [field, meta, helpers] = useField(props.name);
  const rows = Object.keys(field.value);
  function handleRowLaneChange(key: string, oldKey: string) {
    const newVal = Object.assign({}, field.value);
    newVal[key] = newVal[oldKey];
    delete newVal[oldKey];
    helpers.setValue(newVal);
  }
  function handleRowRemove(key: string) {
    const newVal = Object.assign({}, field.value);
    delete newVal[key];
    helpers.setValue(newVal);
  }
  function handleRowAdd() {
    const newVal = Object.assign({}, field.value);
    const maxKey = Math.max(...Object.keys(newVal).map((x) => parseInt(x, 10)));
    const newKey = (maxKey === -Infinity ? 1 : maxKey + 1).toString(10);
    newVal[newKey] = {
      name: "",
      side: "home",
    };
    helpers.setValue(newVal);
  }
  return (
    <Stack
      sx={(theme) => ({
        display: "table",
      })}
    >
      {rows.map((row) => (
        <LanesFieldRow
          key={row}
          namespace={`${props.name}[${row}]`}
          meta={props.meta}
          num={row}
          onRemove={() => handleRowRemove(row)}
          onNumChange={(newKey) => handleRowLaneChange(newKey, row)}
        />
      ))}
      <Button onClick={() => handleRowAdd()}>Add Lane</Button>
    </Stack>
  );
}

export function EditForm(props: { meta: EventMeta }) {
  return (
    <>
      <Field name="name" title="Name" independent />
      <ArrayField
        name="runs"
        title="Runs"
        initialChildValue={
          {
            swimmersByLane: {},
            splits: [],
            style: "",
            totalDistanceMetres: 0,
            clock: UpwardClock.cast({}),
          } as RunState
        }
        renderChild={({ namespace }) => (
          <Stack>
            <Field name={namespace + "style"} title="Style" independent />
            <Field
              name={namespace + "totalDistanceMetres"}
              title="Distance"
              helper="(metres)"
              type="number"
            />
            <Input.Wrapper label="Swimmer Lanes">
              <LanesField
                name={namespace + "swimmersByLane"}
                meta={props.meta}
              />
            </Input.Wrapper>
          </Stack>
        )}
      />
    </>
  );
}

export const typeInfo: EventTypeInfo<State, typeof actions> = {
  reducer,
  stateSchema: schema,
  actionCreators: actions,
  actionPayloadValidators,
  actionRenderers,
  actionValidChecks,
  hiddenActions: new Set(["split", "startRun"] as const),
};

export const components: EventComponents<typeof actions, State> = {
  EditForm,
  RenderScore,
  actionForms: {
    setNextRun: ({ currentState }: ActionFormProps<State>) => (
      <>
        <SelectField
          name="idx"
          title="Run"
          values={currentState.runs.map((run, idx) => [
            idx.toString(10),
            run.totalDistanceMetres + "m " + run.style,
          ])}
        />
      </>
    ),
  },
};
