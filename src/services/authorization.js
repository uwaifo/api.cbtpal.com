import { AuthenticationError } from "apollo-server-express";
import { combineResolvers, skip } from "graphql-resolvers";

/*
    Functions to protect resolvers based on permission levels (role based authorization)
*/

// Check if a user is logged in
export const isAuthenticated = (_, __, { logged_in_user }) =>
  logged_in_user ? skip : new AuthenticationError("Authorization Denied");

// Check if a user is an admin
/*
export const isAdmin = combineResolvers(isAuthenticated, (_, __, { admin }) =>
  admin === true ? skip : new AuthenticationError("Not authorized as an admin")
);
*/

// Check if a user is an admin
export const is_admin = combineResolvers(
  isAuthenticated,
  (_, __, { administrator }) =>
    administrator === true
      ? skip
      : new AuthenticationError("Not authorized as an administrator")
);

//isExaminer

export const is_examiner = combineResolvers(
  isAuthenticated,
  (_, __, { examiner }) => {
    examiner === true
      ? skip
      : new AuthenticationError("Not Authorized as an Examiner");
  }
);

// Check if user is a student (Role based authentication)
export const is_student = combineResolvers(
  isAuthenticated,
  (_, __, { student }) => {
    student === true
      ? skip
      : new AuthenticationError("Not Authorized as a Student");
  }
);
