import { ApolloError, UserInputError } from "apollo-server-express";
import dotenv from "dotenv";
import randomString from "randomstring";

import { combineResolvers } from "graphql-resolvers";
import { sendEmail } from "../../services/sendEmail";

import Assessment from "../../models/assesment/assessment";
import Examiner from "../../models/user_types/examiner";
import SeniorExaminer from "../../models/user_types/admin";

import { is_admin, is_examiner } from "../../services/authorization";

dotenv.config();

export default {
  add_examiner_manually: combineResolvers(
    is_admin,
    async (
      _,
      { full_name, email, phone_number, assessment_id },
      { user_id }
    ) => {
      try {
        const examiner_check = await Examiner.findOne({ email: email });

        if (examiner_check) {
          throw new UserInputError("An Examiner with Email already exist");
        }

        let new_examiner = new Examiner({
          full_name: full_name,
          email: email,
          email_verified_status: true,
          phone_number: phone_number,
          invited_by: user_id,
        });

        //hash password
        new_examiner.password = await new_examiner.hashPass(email);

        new_examiner = await Examiner.create(new_examiner);

        //Add examiner to assessment
        const assigned_assessment = await Assessment.findById(assessment_id);

        if (!assigned_assessment) {
          throw new UserInputError(
            `There is no assement  with the ID: ${assessment_id}`
          );
        }
        // Ensure that the examiner hasnt already assigned

        let is_assigned = await Assessment.findOne({
          assigned_examiners: new_examiner._id,
        });
        if (is_assigned) {
          return {
            message: "That examiner is already assigned to this assessment",
            value: false,
          };
        }

        await Assessment.findByIdAndUpdate(assessment_id, {
          $push: { assigned_examiners: new_examiner._id },
        });

        return {
          message: `New Examiner successfully assigned and enrolled to ${assigned_assessment.title}`,
          value: true,
        };
      } catch (err) {
        throw err;
      }
    }
  ),
  email_assign_multiple_examiner: combineResolvers(
    is_admin,
    async (_, { assessment_id, examiners_contacts }, { user_id }) => {
      try {
        let front_end = process.env.FRONT_END_URL;

        // Verify assessment ID
        const assessment = await Assessment.findById(assessment_id);

        if (!assessment) {
          throw new UserInputError(
            `There is no assement with the ID: ${assessment_id}`
          );
        }
        let batch_result = {
          new_registrations: [],
          new_assignments: [],
          failed_assignments: [],
        };

        // TODO recursively call invite_examiner
        for (let examiner_email of examiners_contacts) {
          //check that no such examiner email exists on the platform
          const check_examiner_email = await Examiner.findOne({
            email: examiner_email,
          });

          if (!check_examiner_email) {
            let new_examiner = new Examiner({
              full_name: " ",
              email: examiner_email,
              email_verified_status: true,
              is_examiner: true,
              invited_by: user_id,
            });

            // Generate random string to send to server as temporal password
            const temp_password = randomString.generate(6);

            new_examiner.password = await new_examiner.hashPass(temp_password);

            new_examiner = await Examiner.create(new_examiner);

            batch_result.new_registrations.push(new_examiner.email);

            await Assessment.findByIdAndUpdate(assessment_id, {
              $push: { assigned_examiners: new_examiner._id },
            });
            batch_result.new_assignments.push(new_examiner.email);

            //
            await sendEmail(
              new_examiner.email,
              "CBTPal Registration",
              `<div>
              <h3> Congratulations you have been enrolled to the ${assessment.title} assessment on CBT Pal</h3>
              <div>You may login with your email and the temporal password provided bellow.</div>
              <div>${temp_password}</div>
              <div>You may change your password uppon logging to your profile page</div>
              </div>`
            );
          } else {
            let is_assigned = await Assessment.findOne({
              assigned_examiners: check_examiner_email._id,
            });

            if (is_assigned) {
              batch_result.failed_assignments.push(check_examiner_email.email);
            } else {
              await Assessment.findByIdAndUpdate(assessment_id, {
                $push: { assigned_examiners: check_examiner_email._id },
              });

              batch_result.new_assignments.push(check_examiner_email.email);

              await sendEmail(
                check_examiner_email.email,
                "CBTPal Enrollment",
                `<div>
              <div>Access assessment on  <a href="${front_end}/${assessment.assessment_url}">here</a><img /></div>
               </div>`
              );
            }
          }
        }
        return {
          message: "Batch process completed successfully",
          batch_status: batch_result,
        };
      } catch (error) {
        throw error;
      }
    }
  ),
  invite_examiner: combineResolvers(
    is_admin,
    async (_, { email, assessment_url }, { user_id }) => {
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
            examiner: check_examiner_email,
          };
        }
        if (!asmt) {
          return {
            message: "That assessment group url is incorrect",
            value: false,
          };
        }

        const new_examiner = await Examiner.create({
          email,
          password: email,
          email_verified_status: true,
          //phone_number: phone_number,
          invited_by: user_id,
        });

        return {
          message: `Sending email invitation to ${email}`,
          value: true,
          //token: token,
          examiner: new_examiner,
        };
      } catch (error) {
        throw error;
      }
    }
  ),
  validate_examiner_email: async (_, { validation_link }) => {
    try {
      const verifying_examiner = await Examiner.findOne({
        email: validation_link,
        email_verified_status: false,
      });

      if (!verifying_examiner) {
        throw new UserInputError("Invalid or Expired validation link");
      }

      // Update verification
      const email_verfified_examiner = await Examiner.findByIdAndUpdate(
        { _id: verifying_examiner._id },
        { email_verified_status: true }
      );

      return {
        message:
          "Congratulations you are one step away from using the platform you may login following the instructions sent to your email",
        value: true,
        examiner: verifying_examiner,
      };
    } catch (error) {
      throw error;
    }
  },
  //assign an examiner to an assessment
  assign_examiner: async (_, { examiner_id, assessment_url }, { Id }) => {
    try {
      //check that the examiner exists on the platform
      const check_examiner = await Examiner.findById(examiner_id);

      // If examiner with such ID does not exist
      if (!check_examiner) {
        return {
          message: "An examiner with that ID does not exist on this platform",
          value: false,
        };
      }

      // Validate that the assessment exists and is published
      const asmt = await Assessment.findOne({
        assessment_url: assessment_url,
        // TODO validate that is is published ??
      });

      // If the url for the assessment is incorrect or non-existing
      if (!asmt) {
        return {
          message: "That assessment group url is incorrect",
          value: false,
        };
      }

      // TODO . Is it a one to many relationship between assessment :: examiners ?
      // Assign the examiner to the assessment
      const new_assignment = await Examiner.findOneAndUpdate(assessment_url, {
        $push: { assign_examiner: examiner_id },
      });

      return {
        message: "Examiner assigned to the assessment group",
        value: true,
        assessment: asmt,
      };
    } catch (error) {
      error;
    }
  },
  examiner_login: async (_, { email, password }) => {
    try {
      const login_examiner = await Examiner.findOne({
        email: email,
      });

      if (!login_examiner) {
        throw new UserInputError("Incorrect Email or Password");
      }

      // If User Exists then Compare Passwords
      const compare_password = login_examiner.verifyPass(password);
      if (!compare_password) {
        throw new UserInputError("Incorrect email or password");
      }
      const token = login_examiner.jwtToken();

      // response
      return {
        message: "Sucessfully logged in",
        token: token,
        value: true,
        examiner: login_examiner,
      };
    } catch (err) {
      throw err;
    }
  },

  view_examiner_profile: combineResolvers(is_examiner, async (_, args) => {
    try {
      // Find logged in user
      const examinerProfile = await Examiner.findById(args.examiner_id);

      if (!examinerProfile) {
        throw new ApolloError("Examiner Does Not Exist");
      }

      return examinerProfile;
    } catch (err) {
      throw err;
    }
  }),

  update_examiner_profile: combineResolvers(
    is_examiner,
    async (_, { full_name, profile_image, phone_number }, { user_id }) => {
      try {
        const updating_examiner = await Examiner.findById(user_id);
        if (!user_id) {
          return {
            message: "You are not an examiner",
            value: false,
          };
        }
        const updated_examiner = await Examiner.findByIdAndUpdate(
          { _id: updating_examiner._id },
          { full_name: full_name },
          { phone_number: phone_number }
          //{ profile_image: profile_image }
        );

        return {
          message: "Updated Examiner Profile",
          value: true,
          examiner: updated_examiner,
        };
      } catch (error) {}
    }
  ),

  delete_examiner: combineResolvers(
    is_admin,
    async (_, { examiner_id }, { user_id }) => {
      try {
        // Verify student id
        const is_valid_examiner = await Examiner.findById(examiner_id);

        if (!is_valid_examiner) {
          throw new ApolloError("Inavlid examiner_id");
        }
        //const deleting_student = await Student.findByIdAndDelete(student_id);
        const deleting_examiner = await Examiner.findByIdAndDelete(
          is_valid_examiner._id
        );

        //console.log(deleting_student);
        return {
          message: `Deleted examiner`,
          value: true,
        };
      } catch (error) {
        throw error;
      }
    }
  ),
  view_invited_examiners: combineResolvers(
    is_admin,
    async (_, __, { user_id }) => {
      try {
        const invited_examiners = await Examiner.find({
          invited_by: user_id,
        });
        if (!invited_examiners) {
          throw new UserInputError("You do not have any examiner ");
        }
        return {
          examiners: invited_examiners,
        };
      } catch (error) {
        throw error;
      }
    }
  ),
};

/*
INVITE EXAMINER
mutation {
  invite_examiner(
    email: "delemomodu@gmail.com"
    assessment_url: "practicing-erlang"
  ) {
    message
    value
    examiner {
      _id
      full_name
      email
      email_verified_status
    }
  }
}

VALIDATE AND EXAMINER 

mutation{
  validate_examiner_email(validation_link:"delemomodu@gmail.com"){
    message
    value
    examiner{
      _id
      email
      email_verified_status
    }
  }
 }

 EXAMINER LOGIN

 query {
  examiner_login(
    email: "delemomodu@gmail.com"
    password: "delemomodu@gmail.com"
  ) {
    message
    value
    token
    examiner{
      _id
      full_name
      email
      email_verified_status
    }
  }
}

VIEW EXAMINER PROFILE

ASSIGN EXAMINER TO ASSESSMENT


*/
