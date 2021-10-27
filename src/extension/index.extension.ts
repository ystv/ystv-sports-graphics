import type { NodeCG } from "../../../../types/server";
import fetch from "cross-fetch";
import {
  split,
  HttpLink,
  ApolloProvider,
  ApolloClient,
  InMemoryCache,
  from,
  gql,
} from "@apollo/client";
import { WebSocketLink } from "@apollo/client/link/ws";
import { onError } from "@apollo/client/link/error";
import { getMainDefinition } from "@apollo/client/utilities";

export = (nodecg: NodeCG) => {
  const httpLink = new HttpLink({
    uri: `http://${process.env.REACT_APP_API}/graphql`,
    fetch,
  });

  const wsLink = new WebSocketLink({
    uri: `ws://${process.env.REACT_APP_API}/graphql`,
    options: {
      reconnect: true,
    },
  });

  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === "OperationDefinition" &&
        definition.operation === "subscription"
      );
    },
    wsLink,
    httpLink
  );

  const link = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors)
      graphQLErrors.map(({ message, locations, path }) =>
        console.log(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
        )
      );
    if (networkError) console.log(`[Network error]: ${networkError}`);
  });

  const masterLink = from([link, splitLink]);

  const client = new ApolloClient({
    link: masterLink,
    cache: new InMemoryCache(),
    credentials: "include",
  });

  const dataSubscription = client.subscribe({
    query: DataSubscriptionQuery,
    variables: {
      id: "0762b425-ffb2-4b94-ad4e-9922e673047f",
    },
  });

  dataSubscription.subscribe({
    next(e) {
      console.log(e);
    },
    error(e) {
      console.error(e);
    },
  });
};

const FootballScoresFragment = gql`
  fragment FootballLiveScores on FootballEvent {
    homeTeam {
      id
      name
      abbreviation
      players {
        id
        name
        designation
        role
      }
    }
    awayTeam {
      id
      name
      abbreviation
      players {
        id
        name
        designation
        role
      }
    }
    halves {
      timer {
        state
        timeClockStarted
        timeWhenStarted
      }
      addedTime
      score {
        home
        away
      }
      keyEvents {
        footballType: type
        team
        player
        time
        incomingPlayer
      }
    }
  }
`;

const DataSubscriptionQuery = gql`
  subscription LiveScores_Data($id: ID!) {
    eventChanges(eventId: $id) {
      type
      ... on RugbyUnionEvent {
        ...RugbyUnionLiveScores
      }
      ... on FootballEvent {
        ...FootballLiveScores
      }
    }
  }
  ${FootballScoresFragment}
`;
