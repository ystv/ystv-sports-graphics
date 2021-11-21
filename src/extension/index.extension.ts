import type { NodeCG } from "../../../../types/server";
// import fetch from "cross-fetch";
// import {
//   split,
//   HttpLink,
//   ApolloProvider,
//   ApolloClient,
//   InMemoryCache,
//   from,
//   gql,
//   Observable,
//   FetchResult,
// } from "@apollo/client";
// import { WebSocketLink } from "@apollo/client/link/ws";
// import { onError } from "@apollo/client/link/error";
// import { getMainDefinition } from "@apollo/client/utilities";
// import { w3cwebsocket } from "websocket";
// import { Event as SportsEvent } from "../common/generated/graphql";
//
export = (nodecg: NodeCG) => {};
// export = (nodecg: NodeCG) => {
//   console.log("Using data", nodecg.bundleConfig);
//
//   // SETUP APOLLO
//   const httpLink = new HttpLink({
//     uri: `https://${nodecg.bundleConfig.API}/graphql`,
//     fetch,
//   });
//
//   const wsLink = new WebSocketLink({
//     uri: `wss://${nodecg.bundleConfig.API}/graphql`,
//     options: {
//       reconnect: true,
//     },
//     webSocketImpl: w3cwebsocket,
//   });
//
//   const splitLink = split(
//     ({ query }) => {
//       const definition = getMainDefinition(query);
//       return (
//         definition.kind === "OperationDefinition" &&
//         definition.operation === "subscription"
//       );
//     },
//     wsLink,
//     httpLink
//   );
//
//   const link = onError(({ graphQLErrors, networkError }) => {
//     if (graphQLErrors)
//       graphQLErrors.map(({ message, locations, path }) =>
//         console.log(
//           `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
//         )
//       );
//     if (networkError) console.log(`[Network error]: ${networkError}`);
//   });
//
//   const masterLink = from([link, splitLink]);
//
//   const client = new ApolloClient({
//     link: masterLink,
//     cache: new InMemoryCache(),
//     credentials: "include",
//   });
//
//   // SETUP BASIC REPLICANT & MESSAGES
//
//   const allEvents = nodecg.Replicant("allEvents", { defaultValue: [] });
//   const currentEvent = nodecg.Replicant("currentEvent", {
//     defaultValue: {} as SportsEvent,
//   });
//
//   // callback handles switching events
//   nodecg.listenFor("currentEventChanged", (value, ack) => {
//     console.log(`currentEvent changed to ${value}`);
//
//     dataSubscription = client.subscribe({
//       query: DataSubscriptionQuery,
//       variables: {
//         id: value,
//       },
//     });
//
//     dataSubscription.subscribe({
//       start() {
//         console.log("Subscription started");
//       },
//       next(e) {
//         console.log("Event data received");
//
//         currentEvent.value = e.data;
//       },
//       error(e) {
//         console.log("Error");
//
//         console.error(e);
//       },
//       complete() {
//         console.log("Subscription completed");
//       },
//     });
//   });
//
//   // GQL QUERIES
//   let dataSubscription: Observable<
//     FetchResult<any, Record<string, any>, Record<string, any>>
//   >;
//
//   client.query({ query: AllEventsQuery }).then((e) => {
//     allEvents.value = JSON.parse(JSON.stringify(e.data.allEvents));
//   });
// };
//
// const FootballScoresFragment = gql`
//   fragment FootballLiveScores on FootballEvent {
//     homeTeam {
//       id
//       name
//       abbreviation
//       players {
//         id
//         name
//         designation
//         role
//       }
//     }
//     awayTeam {
//       id
//       name
//       abbreviation
//       players {
//         id
//         name
//         designation
//         role
//       }
//     }
//     halves {
//       timer {
//         state
//         timeClockStarted
//         timeWhenStarted
//       }
//       addedTime
//       score {
//         home
//         away
//       }
//       keyEvents {
//         footballType: type
//         team
//         player
//         time
//         incomingPlayer
//       }
//     }
//   }
// `;
//
// const DataSubscriptionQuery = gql`
//   subscription LiveScores_Data($id: ID!) {
//     eventChanges(eventId: $id) {
//       id
//       title
//       time
//       venue
//       type
//       #      ... on RugbyUnionEvent {
//       #        ...RugbyUnionLiveScores
//       #      }
//       ... on FootballEvent {
//         ...FootballLiveScores
//       }
//     }
//   }
//   ${FootballScoresFragment}
// `;
//
// const AllEventsQuery = gql`
//   {
//     allEvents {
//       id
//       title
//       time
//       venue
//       type
//     }
//   }
// `;
