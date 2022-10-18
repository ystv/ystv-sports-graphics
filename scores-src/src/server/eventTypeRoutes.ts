import { DB } from "./db";
import { v4 as uuidv4 } from "uuid";
import { Router } from "express";
import asyncHandler from "express-async-handler";
import { PreconditionFailed } from "http-errors";
import {
  DocumentExistsError,
  DocumentNotFoundError,
  MutateInSpec,
} from "couchbase";
import { dispatchChangeToEvent, resync } from "./updatesRepo";
import {
  Edit,
  Init,
  Redo,
  resolveEventState,
  Undo,
  wrapAction,
} from "../common/eventStateHelpers";
import { authenticate } from "./auth";
import { EVENT_TYPES } from "../common/sports";
import { ensure, invariant } from "./errs";
import { BadRequest } from "http-errors";
import { getLogger } from "./loggingSetup";
import {
  Action,
  BaseEventStateType,
  EventCreateEditSchema,
  EventMeta,
  EventMetaSchema,
  EventTypeInfo,
} from "../common/types";
import { doUpdate as updateTournamentSummary } from "./updateTournamentSummary.job";
import { identity, isEqual, pickBy } from "lodash-es";
import { leagueKey } from "./leagueRoutes";

export function makeEventAPIFor<
  TState extends BaseEventStateType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TActions extends { [K: string]: (payload?: any) => { type: string } }
>(typeName: string, info: EventTypeInfo<TState, TActions>) {
  const logger = getLogger("eventTypeAPI").child({
    type: typeName,
  });
  const router = Router({ mergeParams: true });

  const metaKey = (league: string, id: string) =>
    `EventMeta/${league}/${typeName}/${id}`;
  const historyKey = (league: string, id: string) =>
    `EventHistory/${league}/${typeName}/${id}`;
  const {
    reducer,
    actionCreators,
    actionPayloadValidators,
    actionValidChecks,
    stateSchema,
  } = info;

  router.get(
    "/",
    authenticate("read"),
    asyncHandler(async (req, res) => {
      const league = req.params.league;
      invariant(typeof league === "string", "no league from url");
      const result = await DB.query(
        `SELECT RAW e
        FROM _default e
        WHERE meta(e).id LIKE 'EventMeta/%'
        AND e.league = $1;
        AND e.type = $2
        ORDER BY MILLIS(e.startTime)`,
        {
          parameters: [league, typeName],
        }
      );
      const events = await Promise.all(
        result.rows.map(async (row) => {
          const meta = row as EventMeta;
          const history = await DB.collection("_default").get(
            row.id.replace("EventMeta", "EventHistory")
          );
          const state = resolveEventState(
            EVENT_TYPES[meta.type]?.reducer ?? identity,
            history.content
          );
          return {
            ...meta,
            ...state,
          };
        })
      );
      res.json(events);
    })
  );

  router.get(
    "/:id",
    authenticate("read"),
    asyncHandler(async (req, res) => {
      const { league, id } = req.params;
      invariant(typeof league === "string", "no league from url");
      invariant(typeof id === "string", "no id from url");

      // check the league exists
      try {
        await DB.collection("_default").get(leagueKey(league));
      } catch (e) {
        if (e instanceof DocumentNotFoundError) {
          throw new BadRequest("league not found");
        } else {
          throw e;
        }
      }

      const meta = await DB.collection("_default").get(metaKey(league, id));
      const history = await DB.collection("_default").get(
        historyKey(league, id)
      );
      const state = resolveEventState(reducer, history.content);
      res.json({
        ...meta.content,
        ...state,
        _cas: meta.cas,
      });
    })
  );

  router.get(
    "/:id/_history",
    authenticate("read"),
    asyncHandler(async (req, res) => {
      const { league, id } = req.params;
      invariant(typeof league === "string", "no league from url");
      invariant(typeof id === "string", "no id from url");
      const data = await DB.collection("_default").get(historyKey(league, id));
      res.json(data.content);
    })
  );

  router.post(
    "/",
    authenticate("write"),
    asyncHandler(async (req, res) => {
      const league = req.params.league;
      invariant(typeof league === "string", "no league from url");
      const meta: EventMeta = await EventCreateEditSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      meta.league = league;
      meta.type = typeName;
      // The input contains the slugs for the teams, replace them with the actual data.
      meta.homeTeam = (
        await DB.collection("_default").get(
          `Team/${meta.homeTeam as unknown as string}`
        )
      ).content;
      meta.awayTeam = (
        await DB.collection("_default").get(
          `Team/${meta.awayTeam as unknown as string}`
        )
      ).content;

      const initialState = await stateSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      let id: string;
      for (;;) {
        try {
          id = uuidv4();
          meta.id = id;
          await DB.collection("_default").insert(metaKey(league, id), meta);
          break;
        } catch (e) {
          if (e instanceof DocumentExistsError) {
            continue;
          }
          throw e;
        }
      }

      const initAction = wrapAction(
        Init({
          ...meta,
          ...initialState,
        })
      );
      await DB.collection("_default").insert(historyKey(league, id), [
        initAction,
      ]);

      const finalState = {
        ...meta,
        ...initialState,
      };
      initAction.payload = finalState;
      await dispatchChangeToEvent(league, typeName, id, initAction);
      res.statusCode = 201;
      res.json(finalState);
    })
  );

  router.put(
    "/:id",
    authenticate("write"),
    asyncHandler(async (req, res) => {
      const { league, id } = req.params;
      invariant(typeof league === "string", "no league from url");
      invariant(typeof id === "string", "no id from url");
      const cas = req.params["cas"] ?? undefined;
      const history = await DB.collection("_default").get(
        historyKey(league, id)
      );
      const currentActions = history.content as Action[];
      const currentState = resolveEventState(reducer, currentActions);

      const newMeta: EventMeta = await EventCreateEditSchema.validate(
        req.body,
        { abortEarly: false, stripUnknown: true }
      );
      newMeta.id = id;
      newMeta.type = typeName;
      newMeta.homeTeam = (
        await DB.collection("_default").get(
          `Team/${newMeta.homeTeam as unknown as string}`
        )
      ).content;
      newMeta.awayTeam = (
        await DB.collection("_default").get(
          `Team/${newMeta.awayTeam as unknown as string}`
        )
      ).content;

      const newState = await stateSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      // We need to ensure that only the changed state keys make it into the history and to changes feed clients.
      // This is because, if we put the complete state in the Edit action, it will "capture" all the current
      // values of all the state fields, which will make any actions before this Edit not undo-able.
      const stateDelta = pickBy(
        newState,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (val, key) => !isEqual(val, (currentState as any)[key])
      );

      const editAction = wrapAction(
        Edit({
          ...newMeta,
          ...stateDelta,
        })
      );
      await DB.collection("_default").replace(metaKey(league, id), newMeta);
      await DB.collection("_default").mutateIn(
        historyKey(league, id),
        [MutateInSpec.arrayAppend("", editAction)],
        {
          cas: cas ?? history.cas,
        }
      );

      const finalState = {
        ...newMeta,
        ...resolveEventState(reducer, currentActions.concat(editAction)),
      };
      editAction.payload = finalState;
      await dispatchChangeToEvent(league, typeName, id, editAction);
      res.status(200).json(finalState);
    })
  );

  router.post(
    "/:id/_undo",
    authenticate("write"),
    asyncHandler(async (req, res) => {
      const { league, id } = req.params;
      invariant(typeof league === "string", "no league from url");
      invariant(typeof id === "string", "no id from url");
      const ts = req.body.ts;
      ensure(typeof ts === "number", BadRequest, "no ts given");

      const currentActionsResult = await DB.collection("_default").get(
        historyKey(league, id)
      );
      const currentActions = currentActionsResult.content as Action[];
      const undoneIndex = currentActions.findIndex((x) => x.meta.ts === ts);
      ensure(undoneIndex > -1, BadRequest, "no action with that ts");
      ensure(
        !currentActions[undoneIndex].type.startsWith("@@"),
        BadRequest,
        "can't undo internal actions"
      );
      const undoAction = wrapAction(Undo({ ts }));
      currentActions.push(undoAction);

      // Try to resolve the state with the new history. If this would crash the reducer,
      // we're in an invalid state.
      try {
        resolveEventState(reducer, currentActions);
      } catch (e) {
        logger.info("Test-resolve of undo failed", {
          error: e instanceof Error ? e.message : e,
        });
        throw new PreconditionFailed(
          "undoing that would result in an invalid state"
        );
      }

      await DB.collection("_default").mutateIn(
        historyKey(league, id),
        [MutateInSpec.arrayAppend("", undoAction)],
        {
          cas: currentActionsResult.cas,
        }
      );
      await dispatchChangeToEvent(league, typeName, id, undoAction);
      res.status(200).json(resolveEventState(reducer, currentActions));
    })
  );

  router.post(
    "/:id/_redo",
    authenticate("write"),
    asyncHandler(async (req, res) => {
      const { league, id } = req.params;
      invariant(typeof league === "string", "no league from url");
      invariant(typeof id === "string", "no id from url");
      const ts = req.body.ts;
      ensure(typeof ts === "number", BadRequest, "no ts given");

      const currentActionsResult = await DB.collection("_default").get(
        historyKey(league, id)
      );
      const currentActions = currentActionsResult.content as Action[];
      const redoneIndex = currentActions.findIndex((x) => x.meta.ts === ts);
      ensure(redoneIndex > -1, BadRequest, "no action with that ts");
      const redoAction = wrapAction(Redo({ ts }));

      // Special case: if the undo action was the last one, we can delete it,
      // rather than adding a redo.
      // We still need to dispatch a redo to the repo though.
      const spec: MutateInSpec[] = [];
      if (
        Undo.match(currentActions[currentActions.length - 1]) &&
        currentActions[currentActions.length - 1].payload.ts === ts
      ) {
        logger.debug("Redo: special case matched", {
          lastThree: currentActions.slice(currentActions.length - 3),
        });
        currentActions.splice(currentActions.length - 1, 1);
        // no +1 here as we've already removed the last action - really this is (currentActions.length - 1 + 1)
        spec.push(MutateInSpec.remove(`[${currentActions.length}]`));
      } else {
        logger.debug("Redo: special case NOT matched", {
          lastThree: currentActions.slice(currentActions.length - 3),
        });
        currentActions.push(redoAction);
        spec.push(MutateInSpec.arrayAppend("", redoAction));
      }

      // Try to resolve the state with the new history. If this would crash the reducer,
      // we're in an invalid state.
      try {
        resolveEventState(reducer, currentActions);
      } catch (e) {
        logger.info("Test-resolve of redo failed", {
          error: e instanceof Error ? e.message : e,
        });
        throw new PreconditionFailed(
          "redoing that would result in an invalid state"
        );
      }

      await DB.collection("_default").mutateIn(historyKey(league, id), spec, {
        cas: currentActionsResult.cas,
      });
      await dispatchChangeToEvent(league, typeName, id, redoAction);
      res.status(200).json(resolveEventState(reducer, currentActions));
    })
  );

  router.post(
    "/:id/_declareWinner",
    authenticate("write"),
    asyncHandler(async (req, res) => {
      const { league, id } = req.params;
      invariant(typeof league === "string", "no league from url");
      invariant(typeof id === "string", "no id from url");
      const winner: "home" | "away" = req.body.winner;
      ensure(
        typeof winner === "string" && (winner === "home" || winner === "away"),
        BadRequest,
        "invalid or no winner"
      );

      const metaResult = await DB.collection("_default").get(
        metaKey(league, id)
      );
      const historyResult = await DB.collection("_default").get(
        historyKey(league, id)
      );
      const meta = metaResult.content as EventMeta;

      meta.winner = winner;

      await DB.collection("_default").replace(metaKey(league, id), meta, {
        cas: metaResult.cas,
      });
      const finalState = {
        ...meta,
        ...resolveEventState(reducer, historyResult.content),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
      await dispatchChangeToEvent(
        league,
        typeName,
        id,
        wrapAction(Edit(finalState))
      );
      await updateTournamentSummary(
        logger.child({ _name: "tsWorker" }),
        league
      );
      res.status(200).json(finalState);
    })
  );

  router.post(
    "/:id/_resync",
    authenticate("write"),
    asyncHandler(async (req, res) => {
      const { league, id } = req.params;
      invariant(typeof league === "string", "no league from url");
      invariant(typeof id === "string", "no id from url");
      logger.debug("resyncing", { league, typeName, id });
      await resync(league, typeName, id);
      res.status(200).json({ ok: true });
    })
  );

  for (const actionType of Object.keys(actionCreators)) {
    router.post(
      `/:id/${actionType}`,
      authenticate("write"),
      asyncHandler(async (req, res) => {
        const { league, id } = req.params;
        invariant(typeof league === "string", "no league from url");
        invariant(typeof id === "string", "no id from url");
        const payload: ReturnType<TActions[typeof actionType]> =
          await actionPayloadValidators[actionType].validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
          });

        const metaResult = await DB.collection("_default").get(
          metaKey(league, id)
        );
        logger.debug("got meta", { meta: metaResult.content });
        const currentActionsResult = await DB.collection("_default").get(
          historyKey(league, id)
        );
        logger.debug("got history", { history: currentActionsResult.content });
        const currentActions = currentActionsResult.content as Action[];
        const currentState = resolveEventState(reducer, currentActions);

        const checkFn = actionValidChecks[actionType];
        if (typeof checkFn === "function") {
          if (!checkFn(currentState)) {
            throw new PreconditionFailed("action not valid at this time");
          }
        }

        const actionData = wrapAction(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          actionCreators[actionType](payload) as any
        );

        await DB.collection("_default").mutateIn(
          historyKey(league, id),
          [MutateInSpec.arrayAppend("", actionData)],
          {
            cas: currentActionsResult.cas,
          }
        );
        await dispatchChangeToEvent(league, typeName, id, actionData);
        res.status(200).json({
          ...metaResult.content,
          ...resolveEventState(reducer, currentActions.concat(actionData)),
        });
      })
    );
  }

  return router;
}

export function createEventTypesRouter() {
  const router = Router();
  for (const [typeName, info] of Object.entries(EVENT_TYPES)) {
    router.use(`/:league/${typeName}`, makeEventAPIFor(typeName, info));
  }
  return router;
}
