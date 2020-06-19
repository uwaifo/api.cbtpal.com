import { ApolloError, UserInputError } from "apollo-server-express";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { combineResolvers } from "graphql-resolvers";

import Admin from "../../models/user_types/admin";
import { is_admin } from "../../services/authorization";
import { authenticateGoogle } from "../../services/passport";

dotenv.config();

export default {
  authGoogle: async (
    _,
    { input: { accessToken, auth_type } },
    { req, res }
  ) => {
    //Grab the accessToken
    req.body = {
      ...req.body,
      access_token: accessToken,
    };

    try {
      //determine validation type

      let message = "";

      if (auth_type === "ADMIN_LOGIN") {
        // message = "Login administrator";

        // Verify account
        const { data, info } = await authenticateGoogle(req, res);

        if (data) {
          const is_registered = await Admin.findOne({
            email: data.profile._json.email,
          });
          if (!is_registered) {
            return {
              message: "Not a registered Administrator",
              value: false,
            };
          } else {
            // Sign user token
            const token = is_registered.jwtToken();
            const auth_admin_profile = {
              full_name: data.profile.displayName,
              email: data.profile._json.email,
              profile_picture: data.profile._json.picture,
              auth_type: auth_type,
            };
            return {
              message: `Administrator ${is_registered.full_name} has successfully login`,
              value: true,
              admin: is_registered,
              token: token,
              google_profile: auth_admin_profile,
            };
          }
        }
      } else if (auth_type === "ADMIN_SIGNUP") {
        // data contains the accessToken, refreshToken and profile from passport
        const { data, info } = await authenticateGoogle(req, res);

        if (data) {
          //console.log(data);
          const is_registered = await Admin.findOne({
            email: data.profile._json.email,
          });
          if (is_registered) {
            return {
              message: `Administrator ${is_registered.full_name} is already registered on this platform`,
              value: false,
            };
          } else {
            const newAdmin = new Admin({
              full_name: data.profile.displayName,
              email: data.profile._json.email,
              googleProvider: data.accessToken,
            });
            const savedAdmin = await Admin.create(newAdmin);

            const token = savedAdmin.jwtToken();
            const auth_admin_profile = {
              full_name: data.profile.displayName,
              email: data.profile._json.email,
              profile_picture: data.profile._json.picture,
              auth_type: auth_type,
            };

            return {
              message: "Successfully registered a new admin.",
              value: true,
              admin: savedAdmin,
              token: token,
              google_profile: auth_admin_profile,
            };
          }
          /*
          const google_dump = {
            token: data.accessToken,
            full_name: data.profile.displayName,
            first_name: data.profile._json.given_name,
            last_name: data.profile._json.family_name,
            email: data.profile._json.email,
            profile_picture: data.profile._json.picture,
            auth_type: auth_type,
          };*/
        }

        if (info) {
          console.log(info);
          switch (info.code) {
            case "ETIMEDOUT":
              return new Error("Failed to reach Google: Try Again");
            default:
              return new Error("something went wrong");
          }
        }
        return Error("server error");
      } else {
        throw new UserInputError("Invalid authentication type");
      }
    } catch (error) {
      return error;
    }
  },
};

/*
 ADMIN_LOGIN
 mutation {
  authGoogle(
    input: {
      accessToken: "ya29.a0Ae4lvC2nGIW0F_qFxiUVoZtfxvRpnnhAeEbfH8zy8YVTPI517Mc2BA4nliE-BQW0fRkhQcinMzifLdAgrll8ksde4Ii_cBVKVY4JX4WFq76K9e74FnShS4um-1hjFB9dy-9_cvHl-H3eN9TgW5rW95I-NgHmCPWNq-8w"
      auth_type: ADMIN_LOGIN
    }
  ) {
    message
    value
    token
    admin{
      _id
      full_name
      email
    }
    google_profile {
      full_name
      email
      auth_type
      profile_picture
    }
     
  }
}
*/
