import { ApolloError, UserInputError } from "apollo-server-express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { authenticateGoogle } from "../../services/passport";
import { sendEmail } from "../../services/sendEmail";

import { combineResolvers } from "graphql-resolvers";

import Admin from "../../models/user_types/admin";
import Assessment from "../../models/assesment/assessment";
import Examiner from "../../models/user_types/examiner";
import { is_admin } from "../../services/authorization";
import { extract_from_link } from "../../services/verification";
import { processUpload } from "../../services/fileUploads";

dotenv.config();

const front_end = process.env.FRONT_END_URL;

export default {
  google_social_login: async (_, { input: { profile_object, auth_type } }) => {
    try {
      if (auth_type === "ADMIN_LOGIN") {
        if (profile_object) {
          const is_registered = await Admin.findOne({
            email: profile_object.email,
          });
          if (!is_registered) {
            throw new UserInputError("Not a registered administrator");
          } else {
            // Sign user token
            const token = is_registered.jwtToken();
            const auth_admin_profile = {
              full_name: profile_object.name,
              email: profile_object.email,
              profile_picture: profile_object.picture,
              auth_type: auth_type,
            };
            return {
              message: `Administrator ${is_registered.full_name} has successfully login`,
              //value: true,
              admin: is_registered,
              token: token,
              //google_profile: auth_admin_profile,
            };
          }
        }
      } else if (auth_type === "ADMIN_SIGNUP") {
        if (profile_object) {
          const is_registered = await Admin.findOne({
            email: profile_object.email,
          });
          if (is_registered) {
            throw new UserInputError(
              `Administrator ${is_registered.full_name} is already registered on this platform`
            );
          } else {
            const new_admin = new Admin({
              full_name: profile_object.name,
              email: profile_object.email,
              email_verified_status: true,
              password: profile_object.email,
              profile_picture: profile_object.picture,
            });

            // Register new admin and save to database
            const save_admin = await Admin.create(new_admin);

            const token = save_admin.jwtToken();
            return {
              admin: save_admin,
              token: token,
            };
          }
        }
      }
    } catch (error) {
      throw error;
    }
  },
  admin_google_login: async (_, { googleToken }) => {
    try {
      // Decode token from google
      let decodedToken = jwt.verify(
        googleToken,
        process.env.GOOGLE_CLIENT_SECRET
      );

      // Check if decode token is not set
      if (!decodedToken) {
        req.isAuth = false;
        return {
          message: "Invalid jwt token received from google",
        };
      }

      let email = decodedToken.email;
      let full_name = decodedToken.name;

      //Check if a user exists in the database
      let admin = await Admin.findOne({ email: email });

      // if user is not in db, Create a new account for the user
      if (!admin) {
        const newAdmin = new Admin({
          full_name,
          email,
          password,
        });

        const savedAdmin = await Admin.create(newAdmin);

        const token = savedAdmin.jwtToken();

        return {
          message: "Successfully registered a new admin via Google",
          value: true,
          admin: savedAdmin,
          token: token,
        };
      }

      const token = admin.createToken();

      return {
        message: `Administrator ${admin.full_name} has successfully login`,
        value: true,
        admin,
        token: token,
      };
    } catch (error) {
      throw error;
    }
  },
  create_admin: async (_, { full_name, email, phone_number, password }) => {
    try {
      const admin_check = await Admin.findOne({ email });

      if (admin_check) {
        throw new UserInputError("User with Email already exist");
      }

      const new_admin = new Admin({
        full_name,
        email,
        password,
        phone_number,
      });
      const token = new_admin.jwtToken();

      const saved_admin = await Admin.create(new_admin);

      //let verification_link = new_admin.provider_url + "#" + new_admin.email;
      let verification_link = new_admin.provider_url + "*" + new_admin.email;

      //sending email to user

      // Get front end url to process verification link
      await sendEmail(
        saved_admin.email,
        "CBTPal Registration",
        `<div>
        <div>Please click <a href="${front_end}/verification/?user=${verification_link}">here</a> to verify your admin account<img /></div>
        </div>`
      );

      return {
        //message: `Processing registration request. Sending verification link to ${saved_admin.email}`,
        //message: "Sucessfully created user",
        //next: `admin_verification + ${verification_link}`,
        //value: true,
        token: token,
        admin: saved_admin,
      };
    } catch (err) {
      throw err;
    }
  },
  admin_verification: async (_, { verification_link }) => {
    try {
      let check_link = extract_from_link(verification_link);
      // console.log(check_link);
      const registration_pending = await Admin.findOne({
        email: check_link.email,
        provider_url: check_link.author_url,
      });

      if (!registration_pending) {
        return {
          message: "Invalid Link",
          value: false,
        };
      } else if (registration_pending.email_verified_status == true) {
        return {
          message: "This user's email is already verified ",
          value: false,
        };
      } else {
        // Update admin email_verified_status to
        //console.log(registration_pending);

        const vett_admin = await Admin.findByIdAndUpdate(
          { _id: registration_pending._id },
          { email_verified_status: true }
        );
        return {
          message: `Administrator ${vett_admin.full_name}'s email has been verified`,
          // next: "admin_login",
          value: true,
          user: vett_admin,
        };
      }
    } catch (error) {
      throw error;
    }
  },
  admin_login: async (_, { email, password }) => {
    try {
      const admin = await Admin.findOne({ email });

      if (!admin) {
        throw new UserInputError("Incorrect login details");
      }

      const isMatch = await admin.verifyPass(password);

      if (!isMatch) throw new UserInputError("Incorrect login details");

      // Sign user token
      const token = admin.jwtToken();

      return {
        admin,
        token: token,
      };
    } catch (err) {
      throw err;
    }
  },

  admin_google_login: async (_, { googleToken }) => {
    try {
      // Decode token from google
      let decodedToken = jwt.verify(
        googleToken,
        process.env.GOOGLE_CLIENT_SECRET
      );

      // Check if decode token is not set
      if (!decodedToken) {
        req.isAuth = false;
        return {
          message: "Invalid jwt token received from google",
        };
      }

      let email = decodedToken.email;
      let full_name = decodedToken.name;

      //Check if a user exists in the database
      let admin = await Admin.findOne({ email: email });

      // if user is not in db, Create a new account for the user
      if (!admin) {
        const newAdmin = new Admin({
          full_name,
          email,
          password,
        });

        const savedAdmin = await Admin.create(newAdmin);

        const token = savedAdmin.jwtToken();

        return {
          message: "Successfully registered a new admin via Google",
          value: true,
          admin: savedAdmin,
          token: token,
        };
      }

      const token = admin.createToken();

      return {
        message: `Administrator ${admin.full_name} has successfully login`,
        value: true,
        admin,
        token: token,
      };
    } catch (error) {
      throw error;
    }
  },
  admin_profile: combineResolvers(is_admin, async (_, args, { user_id }) => {
    try {
      console.log(user_id);

      const admin_profile = await Admin.findById(user_id);
      if (!admin_profile) {
        return {
          message: "Not found",
          value: false,
        };
      }

      return {
        admin: admin_profile,
      };
    } catch (error) {
      throw error;
    }
  }),

  admin_profile_update: combineResolvers(
    is_admin,
    async (_, args, { user_id }) => {
      try {
        const admin_profile = await Admin.findById(user_id);

        if (!admin_profile) {
          throw new ApolloError("Administrator not found");
        }

        let admin_profile_update;

        // checking if the admin uploaded an image file to update
        if (args.fiile) {
          let upload_data = await processUpload(
            args.fiile,
            "staging.sumaryz-test.appspot.com"
          );

          // Attempt to update the profile avatar with the newly uploaded image
          admin_profile_update = await Admin.findByIdAndUpdate(
            user_id,
            {
              $set: {
                args,
                profile_avatar: upload_data,
              },
            },
            { new: true }
          );
        } else {
          // If there is no file upload the update admin account
          admin_profile_update = await Admin.findByIdAndUpdate(user_id, args, {
            new: true,
          });
        }

        return {
          admin: admin_profile_update,
        };
      } catch (error) {
        throw error;
      }
    }
  ),

  admin_forgot_password_request: async (_, { email }) => {
    try {
      // Verify admin and email is verified

      const valid_admin = await Admin.findOne({
        email: email,
        email_verified_status: true,
      });

      if (!valid_admin) {
        throw new ApolloError(
          "An administrator withh this email does not exist. If you have signed up previously kindly validate your email account from the mail that was sent to you."
        );
      }

      let verification_link =
        valid_admin.provider_url + "*" + valid_admin.email;

      //sending email to user

      // Get front end url to process verification link
      await sendEmail(
        valid_admin.email,
        "CBTPal Reset Password Link",
        `<div>
        <div>Please click <a href="${front_end}/reset_password/?user=${verification_link}"> here to reset you password. /></div>
        </div>`
      );

      return {
        message: "Please check your email to complete this process",
        value: true,
      };
    } catch (error) {
      throw error;
    }
  },

  admin_reset_password_request: async (
    _,
    { reset_link, new_password, confirm_password }
  ) => {
    try {
      // Verify admin and email is verified
      let check_link = extract_from_link(reset_link);
      // console.log(check_link);
      const valid_admin = await Admin.findOne({
        email: check_link.email,
        provider_url: check_link.author_url,
      });

      if (!valid_admin) {
        return {
          message: "Invalid Password Reset Link",
          value: false,
        };
      }

      // Reset the password

      if (new_password !== confirm_password) {
        throw new UserInputError("Passwords do not seem to match");
      }

      const updated_admin = await Admin.findByIdAndUpdate(
        valid_admin._id,
        { $set: { password: await valid_admin.hashPass(new_password) } },
        { new: true }
      );

      const token = updated_admin.jwtToken();

      return {
        admin: updated_admin,
        token: token,
      };
    } catch (error) {
      throw error;
    }
  },
  invite_examiner: async (_, { email, assessment_url }, { user_id }) => {
    try {
      //check that no such examiner email exists on the platform
      const check_examiner_email = await Examiner.findOne({
        email: email,
      });
      //validate assessment
      const asmt = await Assessment.findOne({
        assessment_url: assessment_url,
      });
      if (check_examiner_email) {
        return {
          message:
            "An examiner with that email exist on this platfor already, proceed with enrolling to an assessment",
          value: false,
          //examiner: check_email,
        };
      }
      if (!asmt) {
        return {
          message: "That assessment group url is incorrect",
          value: false,
        };
      }
      //save the sent email and auto enroll to designated assessment
      //access would be pending on email verification

      const new_examiner = new Examiner({
        email: email,
        password: email,
      });

      const add_examiner = await new_examiner.save();

      //console.log(new_enrollment);

      return {
        message: `Sending email invitation to ${email}`,
        value: true,
        token: token,
        examiner: add_examiner,
      };
    } catch (error) {
      error;
    }
  },
};

/*
CREATE A NEW ADMIN
mutation {
  create_admin(
    full_name: "Femi Balogun"
    email: "balogun@nafdac.org.ng"
    password: "femibalogun"
  ) {
    message
    value
    admin {
      _id
      email
      is_admin
    }
  }
}

ADMIN LOGIN
query {
  admin_login(email: "kalu@slok.com", password: "uzorkalu") {
    message
    value
    admin {
      _id
      email
      is_admin
    }
  }
}
*/
