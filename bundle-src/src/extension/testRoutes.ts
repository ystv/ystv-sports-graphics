import { EventID } from "common/types/eventID";
import { Router } from "express";
import invariant from "tiny-invariant";
import { NodeCG } from "../../../../../types/server";
import { apiClient, authenticate } from "./scoresAPI";

export default function mountTestRoutes(nodecg: NodeCG, router: Router) {
  invariant(process.env.NODE_ENV === "test", "Not in test mode");
  nodecg.log.warn("Mounting test routes");

  const eidRep = nodecg.Replicant<EventID>("eventID");

  router.post("/_test/selectEvent", (req, res) => {
    const eventID = req.body.eventID;
    invariant(typeof eventID === "string", "eventID must be a string");
    eidRep.value = eventID;
    res.send("OK");
  });

  router.post("/_test/updateControl", (req, res) => {
    const eventType = req.query.eventType;
    invariant(typeof eventType === "string", "eventType must be a string");
    const fields = req.body as Record<string, unknown>;
    const controlRep = nodecg.Replicant<Record<string, unknown>>(
      "control-" + eventType
    );
    for (const [key, value] of Object.entries(fields)) {
      controlRep.value[key] = value;
    }
    res.send("OK");
  });

  router.post("/_test/reauthenticate", (req, res) => {
    authenticate(nodecg, req.body.username, req.body.password)
      .then(() => {
        res.send("OK");
      })
      .catch((err) => {
        res.status(500).send(err.message);
      });
  });

  router.get("/_test/checkAuth", (req, res) => {
    apiClient
      .get("/auth/me")
      .then((aR) => {
        res.status(200).json(aR.data);
      })
      .catch((err) => {
        res.status(500).send(err.message);
      });
  });
}
