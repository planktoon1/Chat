import { ApolloServer, gql } from "apollo-server-lambda";
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
} from "graphql";

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "RootQueryType", // an arbitrary name
    fields: {
      // the query has a field called 'greeting'
      greeting: {
        // we need to know the user's name to greet them
        args: { firstName: { type: new GraphQLNonNull(GraphQLString) } },
        // the greeting message is a string
        type: GraphQLString,
        // resolve to a greeting message
        resolve: (parent, args) => "Greeting resolver",
      },
    },
  }),
  mutation: new GraphQLObjectType({
    name: "RootMutationType", // an arbitrary name
    fields: {
      changeNickname: {
        args: {
          firstName: { type: new GraphQLNonNull(GraphQLString) },
          nickname: { type: new GraphQLNonNull(GraphQLString) },
        },
        type: GraphQLString,
        resolve: (parent, args) => "Change nickname resolver",
      },
    },
  }),
});

const server = new ApolloServer({
  schema,

  // By default, the GraphQL Playground interface and GraphQL introspection
  // is disabled in "production" (i.e. when `process.env.NODE_ENV` is `production`).
  //
  // If you'd like to have GraphQL Playground and introspection enabled in production,
  // the `playground` and `introspection` options must be set explicitly to `true`.
  playground: true,
  introspection: true,
});

exports.graphqlHandler = server.createHandler();
