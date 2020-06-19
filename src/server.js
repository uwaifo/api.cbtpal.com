import express from "express";
import dotenv from "dotenv";
import { ApolloServer } from "apollo-server-express";
import http from "http";
const colors = require("colors");
import createGraphQLLogger from "graphql-log";
// import cors from "cors";

import "./config/db";
import constants from "./config/constants";
import typeDefs from "./graphql/schema";
import resolvers from "./graphql/resolvers";
// import routes from "./api/routes";
import authMiddlewares from "./config/middlewares";

const app = express();
// app.use(cors());
dotenv.config();
const port = process.env.PORT;
const playground = constants.GRAPHQL_PATH;
app.use(express.json());
// routes(app);
authMiddlewares(app);
//Dev logging
if (process.env.NODE_ENV === "development") {
  const logExecutions = createGraphQLLogger();
  logExecutions(resolvers);
}

// Apollo server set up for graphql (See Documentation)
const schema = new ApolloServer({
  typeDefs,
  resolvers,
  resolverValidationOptions: { requireResolversForResolveType: false },

  introspection: true, // To enable graphiql in Production Mode
  playground: true,
  context: ({ req, res, connection }) => {
    // Check for either a http request or a subscription
    if (connection) {
      return connection.context;
    } else {
      //{ req, res },

      const logged_in_user = req.isAuth;
      const user_id = req.user_id;
      const Id = req.userId;
      //const admin = req.isAdmin;
      const administrator = req.is_admin;
      const examiner = req.is_examiner;
      const student = req.is_student;

      return {
        req,
        res,
        logged_in_user,
        //Id,
        user_id,
        // admin,
        administrator,
        examiner,
        student,
      };
    }
  },
});

schema.applyMiddleware({ app, path: constants.GRAPHQL_PATH });

// Wrap the Express server, Server setup for websockets to use graphql subscriptions
const graphQLServer = http.createServer(app);
schema.installSubscriptionHandlers(graphQLServer);

graphQLServer.listen(port, () => {
  // console.log(`Server is Listening on Port ${port}`);
  console.log(
    `🚀 . . Server is Listening at http://localhost:${port}${playground}`.yellow
      .bold
  );
  console.log(
    `🚀 . . Subscriptions ready at ws://localhost:${port}${schema.subscriptionsPath}`
      .green.bold
  );
});
