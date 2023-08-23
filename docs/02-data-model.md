# Data Model

## NoSQL recap

As you will have seen, Sports Graphics stores data using Couchbase Server, which is a NoSQL database. This may be a little different to other databases you may have used, especially relational (SQL) ones, so it's perhaps worth briefly recapping the idea.

In a NoSQL database there's no defined structure to your data - Couchbase Server groups it into "buckets"[^1] but that's about it. The only thing to identify your data is a so-called "key", a unique reference to a bit of data (called a "document"). Given a document's key you can get and update its value - blindingly quickly (as in, sub-millisecond at times).

The contents of a document can be anything, but most documents are JSON - though there are a few that aren't which are called out below. Beyond that though, there's no rules about what this JSON can store, which we take advantage of.

Couchbase Server does also allow us to query the contents of the documents using a language called [SQL++](https://docs.couchbase.com/server/current/getting-started/try-a-query.html), which should be familiar if you've used SQL.

[^1]: Couchbase does allow us to further segment the data into scopes and collections, though at the time of writing we only use the default collection.

## Sports Scores data

Given all that, how do we use Couchbase? This is perhaps best answered by listing all the "families" of documents we have, grouped by key:

- `League/<slug>`: stores some basic information about "leagues", which are used to group together events (such as all BUCS or Roses events) to make browsing easier
- `EventMeta/<league>/<type>/<id>`: stores some basic information about an event, such as the name, time, and teams that are playing
- `EventHistory/<league>/<type>/<id>`: stores the full history of everything that happened at an event - discussed further below
- `Team/<slug>`: stores information about a team
- `Attachment/<id>`: used to store team crest images (NB: this is not JSON - we store the raw contents of the image file as the document body, and the file format as the [extended attribute](https://docs.couchbase.com/server/current/learn/data/extended-attributes-fundamentals.html) `mimeType`)
- `User/<username>`: stores information about a user who can access the system, including their name, hash of their password, and what level of access they have.
- `Session/<id>`: used to sign in a user (NB: technically JSON, but the value is only a string representing the user's username)
- `BootstrapState`: used to remember whether this instance of Sports Graphics has been fully set up

## Event data model

Briefly mentioned above, but the information for an event is split up into the "metadata" and "history". The metadata stores some basic information like the name, start time, and participating teams, while the history is the full sequence of events.

The history is the more interesting of the two: it's one big JSON array with objects containing everything that has happened in a match, for example goals or timer starts/stops. Here's an (abridged) example:

```json
[
  {
    "type": "@@init",
    "payload": {
      // ...
      "clock": {
        "startingTime": 900000,
        "timeLastStartedOrStopped": 0,
        "wallClockLastStarted": 0,
        "state": "stopped",
        "type": "downward"
      },
      "scoreAway": 0,
      "scoreHome": 0,
      "players": {
        "away": [],
        "home": []
      }
    },
    "meta": {
      "ts": 1668253910811
    }
  },
  {
    "type": "netball/startNextQuarter",
    "payload": {},
    "meta": {
      "ts": 1668263425000
    }
  },
  ,
  {
    "type": "netball/goal",
    "payload": {
      "side": "home",
      "player": null
    },
    "meta": {
      "ts": 1668263941336
    }
  }
  // ...
]
```

Each entry in the history is an object, sometimes referred to as an "action" (if you've written applications that use [Redux](https://redux.js.org/) this will be _very_ familiar - though don't worry if not!), which represents, more or less, "something happened". In the above example, the event was created, a quarter started, and the "home" side scored a goal.

So how does the system get from that array to "the score is James 1 Derwent 0"? It runs the array of actions through a "reducer" function - the one for Netball lives in [common/sports/netball/index.tsx](../scores-src/src/common/sports/netball/index.tsx). It takes the current state and an action, and returns the new state - for example, given the state `{"scoreHome": 0, "scoreAway": 0}` and the action `{"type": "netball/goal", "payload": { "side": "home" }}`, it will return the state `{"scoreHome": 1, "scoreAway": 0}`.

But what's the point of going through all this hassle? In a word (or two), time travel!

If, for example, whoever's pitchside happens to make a mistake and enters a Derwent goal when James scored, they can simply undo the goal action, and the system will re-calculate the score while pretending that the mistaken goal never happened. Alternatively they can edit the action post-factum and the system will re-calculate the score with the corrected goal information. This wouldn't be possible without this data model.

This is enabled by the `meta.ts` ("time stamp") field, which is also used as an identifier for a specific action - you'll see `ts` thrown around a lot in the codebase.

So, after all that, why split the metadata and history? In fact, we didn't use to, and only stored the history array, however writing queries for it (such as "give me all events where James College are playing") is a bit of a pain on arrays like that, so the decision was made to split the two.
