import * as Yup from "yup";
import { DB } from "./db";
import { v4 as uuidv4 } from "uuid";
import { Router } from "express";
import asyncHandler from "express-async-handler";
import { PreconditionFailed } from "http-errors";
import { DocumentExistsError, MutateInSpec } from "couchbase";
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
  EventMeta,
  EventMetaSchema,
  EventTypeInfo,
} from "../common/types";
import { doUpdate as updateTournamentSummary } from "./updateTournamentSummary.job";

export function makeEventAPIFor<
  TState extends BaseEventStateType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TActions extends { [K: string]: (payload?: any) => { type: string } }
>(typeName: string, info: EventTypeInfo<TState, TActions>) {
  const logger = getLogger("eventTypeAPI").child({
    type: typeName,
  });
  const router = Router();

  const metaKey = (id: string) => `EventMeta/${typeName}/${id}`;
  const historyKey = (id: string) => `EventHistory/${typeName}/${id}`;
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
      const result = await DB.query(
        `SELECT RAW e
        FROM _default e
        WHERE meta(e).id LIKE 'Event/${typeName}/%'
        ORDER BY MILLIS(ARRAY_REVERSE(ARRAY x.payload.startTime FOR x IN e WHEN x.type = '@@init' OR x.type = '@@edit' END)[0])`
      );
      res.json(result.rows.map((row) => resolveEventState(reducer, row)));
    })
  );

  router.get(
    "/:id",
    authenticate("read"),
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      const meta = await DB.collection("_default").get(metaKey(id));
      const history = await DB.collection("_default").get(historyKey(id));
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
      const id = req.params.id;
      const data = await DB.collection("_default").get(historyKey(id));
      res.json(data.content);
    })
  );

  router.post(
    "/",
    authenticate("write"),
    asyncHandler(async (req, res) => {
      const meta: EventMeta = await (
        EventMetaSchema.omit(["type", "id"]) as typeof EventMetaSchema
      ).validate(req.body, { abortEarly: false, stripUnknown: true });
      const initialState = await stateSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      meta.type = typeName;

      let id: string;
      for (;;) {
        try {
          id = uuidv4();
          meta.id = id;
          await DB.collection("_default").insert(metaKey(id), meta);
          break;
        } catch (e) {
          if (e instanceof DocumentExistsError) {
            continue;
          }
          throw e;
        }
      }

      const initAction = wrapAction(Init(initialState));
      await DB.collection("_default").insert(historyKey(id), [initAction]);

      const finalState = {
        ...meta,
        ...initialState,
      };
      initAction.payload = finalState;
      await dispatchChangeToEvent(typeName, id, initAction);
      res.statusCode = 201;
      res.json(finalState);
    })
  );

  router.put(
    "/:id",
    authenticate("write"),
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      const cas = req.params["cas"] ?? undefined;
      const meta = await DB.collection("_default").get(metaKey(id));
      const history = await DB.collection("_default").get(historyKey(id));
      const currentActions = history.content as Action[];

      const newMeta: EventMeta = await (
        EventMetaSchema.omit(["type", "id"]) as typeof EventMetaSchema
      ).validate(req.body, { abortEarly: false, stripUnknown: true });
      newMeta.id = id;
      newMeta.type = typeName;
      const newState = await stateSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      // We need to ensure that anyone listening to the changes feed gets the *full*
      // state (essentially remaining blissfully unaware of the concept of meta).
      // FIXME: No! We need this to only contain the fields that changed in this edit,
      // otherwise undo/redo will get horribly confused and undo the edit (which isn't
      // normally possible).
      // @@edit will shallow-apply the payload to the previous state, so it's safe.
      const editAction = wrapAction(Edit(newState));
      await DB.collection("_default").replace(metaKey(id), newMeta);
      await DB.collection("_default").mutateIn(
        historyKey(id),
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
      await dispatchChangeToEvent(typeName, id, editAction);
      res.status(200).json(finalState);
    })
  );

  router.post(
    "/:id/_undo",
    authenticate("write"),
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      invariant(typeof id === "string", "route didn't give us a string id");
      const ts = req.body.ts;
      ensure(typeof ts === "number", BadRequest, "no ts given");

      const currentActionsResult = await DB.collection("_default").get(
        historyKey(id)
      );
      const currentActions = currentActionsResult.content as Action[];
      const undoneIndex = currentActions.findIndex((x) => x.meta.ts === ts);
      ensure(undoneIndex > -1, BadRequest, "no action with that ts");
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
        historyKey(id),
        [MutateInSpec.arrayAppend("", undoAction)],
        {
          cas: currentActionsResult.cas,
        }
      );
      await dispatchChangeToEvent(typeName, id, undoAction);
      res.status(200).json(resolveEventState(reducer, currentActions));
    })
  );

  router.post(
    "/:id/_redo",
    authenticate("write"),
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      invariant(typeof id === "string", "route didn't give us a string id");
      const ts = req.body.ts;
      ensure(typeof ts === "number", BadRequest, "no ts given");

      const currentActionsResult = await DB.collection("_default").get(
        historyKey(id)
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

      await DB.collection("_default").mutateIn(historyKey(id), spec, {
        cas: currentActionsResult.cas,
      });
      await dispatchChangeToEvent(typeName, id, redoAction);
      res.status(200).json(resolveEventState(reducer, currentActions));
    })
  );

  router.post(
    "/:id/_declareWinner",
    authenticate("write"),
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      invariant(typeof id === "string", "route didn't give us a string id");
      const winner: "home" | "away" = req.body.winner;
      ensure(
        typeof winner === "string" && (winner === "home" || winner === "away"),
        BadRequest,
        "invalid or no winner"
      );

      const metaResult = await DB.collection("_default").get(metaKey(id));
      const historyResult = await DB.collection("_default").get(historyKey(id));
      const meta = metaResult.content as EventMeta;

      meta.winner = winner;

      await DB.collection("_default").replace(metaKey(id), meta, {
        cas: metaResult.cas,
      });
      const finalState = {
        ...meta,
        ...resolveEventState(reducer, historyResult.content),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
      await dispatchChangeToEvent(typeName, id, wrapAction(Edit(finalState)));
      await updateTournamentSummary(logger.child({ _name: "tsWorker" }));
      res.status(200).json(finalState);
    })
  );

  //FIXME
  router.post(
    "/:id/_resync",
    authenticate("write"),
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      invariant(typeof id === "string", "route didn't give us a string id");
      await resync(typeName, id);
      res.status(200).json({ ok: true });
    })
  );

  for (const actionType of Object.keys(actionCreators)) {
    router.post(
      `/:id/${actionType}`,
      authenticate("write"),
      asyncHandler(async (req, res) => {
        const id = req.params.id;
        invariant(typeof id === "string", "route didn't give us a string id");
        const payload: ReturnType<TActions[typeof actionType]> =
          await actionPayloadValidators[actionType].validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
          });

        const metaResult = await DB.collection("_default").get(metaKey(id));
        logger.debug("got meta", { meta: metaResult.content });
        const currentActionsResult = await DB.collection("_default").get(
          historyKey(id)
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
          historyKey(id),
          [MutateInSpec.arrayAppend("", actionData)],
          {
            cas: currentActionsResult.cas,
          }
        );
        await dispatchChangeToEvent(typeName, id, actionData);
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
    router.use(`/${typeName}`, makeEventAPIFor(typeName, info));
  }
  return router;
}
