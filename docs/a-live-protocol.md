# Appendix A: Live Protocol

The Sports Graphics live data protocol uses JSON over WebSockets. Every object sent by either the client or server must have a `kind` property.

The API can operate in two modes:

- in "state mode", whenever an event changes, the client is sent the complete state of the event right now
- in "actions mode", whenever an event changes, the client is sent an object describing the change

## Connecting

The client should open a WebSocket connection to `https://<SERVER>/api/updates/stream/v2?token=<token>&mode=<mode>`, where `<token>` is a valid session ID and `mode` is either `state` or `actions` (discussed below). Optionally it can supply the `sid` and `last_mid` query parameters, discussed later.

If the user is valid, the server will send a `HELLO` message:

```json
{
  "kind": "HELLO",
  "sid": "<subscription ID>",
  "subs": [],
  "mode": "<mode>"
}
```

`sid` will be a random string that the client should remember for later use. `subs` will be all the event IDs that the client is subscribed to, which will be an empty array the first time it connects.

The server will now start periodically sending `PING` messages:

```json
{ "kind": "PING" }
```

The client must reply to each `PING` with a `PONG`, or the server will close the connection:

```json
{ "kind": "PONG" }
```

The client can also send its own `PING`s, to which the server will reply with `PONG`s.

## Getting Event Updates

To subscribe to an event the client sends a `SUBSCRIBE` message:

```json
{
  "kind": "SUBSCRIBE",
  "to": "Event/<league>/<type>/<id>"
}
```

If successful the server will reply with a `SUBSCRIBE_OK` message:

```json
{
  "kind": "SUBSCRIBE_OK",
  "to": "Event/<league>/<type>/<id>",
  "current": {}
}
```

The value of `current` depends on the mode:

- in state mode it is an object representing the current state of the event
- in actions mode it is an array with the full actions history so far

The server will now start sending messages whenever the event changes. In state mode it will send `CHANGE` messages:

```json
{
  "kind": "CHANGE",
  "changed": "Event/<league>/<type>/<id>",
  "mid": "<mid>",
  "data": {}
}
```

`data` is the current state of the event.

In actions mode the server will send `ACTION` messages:

```json
{
  "kind": "ACTION",
  "event": "Event/<league>/<type>/<id>",
  "mid": "<mid>",
  "type": "<action type>",
  "payload": {},
  "meta": {}
}
```

`payload` and `meta` are the action payload and metadata.

In both modes, `mid` is the Message ID - the client should remember the last `mid` it receives.

To unsubscribe, the client can send a `UNSUBSCRIBE`:

```json
{
  "kind": "UNSUBSCRIBE",
  "to": "Event/<league>/<type>/<id>"
}
```

The server will reply with a `UNSUBSCRIBE_OK`.

### Resyncing

A resync is when the server sends the client the complete event state (in state mode) or complete actions history (in actions mode). The client can request a resync by sending a `RESYNC` message:

```json
{
  "kind": "RESYNC",
  "what": "Event/<league>/<type>/<id>"
}
```

The server can also initiate a resync at any time. In either case, the server will either send the client a `CHANGE` as above (in state mode), or a `BULK_ACTIONS` (in actions mode):

```json
{
  "kind": "BULK_ACTIONS",
  "event": "Event/<league>/<type>/<id>",
  "actions": []
}
```

The client is expected to discard its knowledge of the action history and use the `actions` it has just received.

## Reconnecting

The internet is a scary place and connections can be lost. The server supports replaying the messages that a client missed while it was disconnected.

To do so, the client should establish a new connection as in [Connecting](#connecting), but also include the `sid` and `last_mid` query parameters, which should be the `sid` the server first sent on connecting and the `mid` of the last message it received before disconnecting.

If successful, the server will send a `HELLO` with a matching `sid`, followed by all the `CHANGE`s or `ACTION`s the client missed. The client will be re-subscribed with no need to send a `SUBSCRIBE` message.

If unsuccessful, the server will send a `HELLO` with a different `sid`. In this case the client is expected to discard its knowledge of the event state and send a `SUBSCRIBE` as if connecting for the first time.
