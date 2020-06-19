import { ApolloError, UserInputError } from "apollo-server-express";
import { combineResolvers } from "graphql-resolvers";
import randomString from "randomstring";

import { sendEmail } from "../../services/sendEmail";
import { extract_from_link } from "../../services/verification";
import { processUpload } from "../../services/fileUploads";

import {
  is_student,
  is_admin,
  isAuthenticated,
} from "../../services/authorization";

import Student from "../../models/user_types/student";
import Admin from "../../models/user_types/admin";
import AssessmentGroup from "../../models/assesment/assessment_group";
import Assessment from "../../models/assesment/assessment";
import SessionResponse from "../../models/assesment/student_session_response";

const front_end = process.env.STUDENT_FRONT_END_URL;

export default {
  //
  invite_one_student: async () => {},
  invite_multiple_student: async () => {},
  confirm_student_email: async () => {},
  update_default_password: async () => {},

  // Creates a new super admin
  add_student_manually: combineResolvers(
    is_admin,
    async (_, { full_name, email, phone_number, group_id }, { user_id }) => {
      try {
        const student_check = await Student.findOne({ email: email });

        if (student_check) {
          throw new UserInputError("student with Email already exist");
        }

        let new_student = new Student({
          full_name: full_name,
          email: email,
          email_verified_status: true,
          phone_number: phone_number,
          invited_by: user_id,
        });

        //new_student.password = await new_student.hashPassword(email);
        const temp_password = randomString.generate(6);

        // Generate random string to send to server as temporal password
        new_student.password = await new_student.hashPassword(temp_password);

        new_student = await Student.create(new_student);

        //Add student to group
        const enrolling_group = await AssessmentGroup.findById(group_id);

        if (!enrolling_group) {
          throw new UserInputError(
            `There is no assement group with the ID: ${group_id}`
          );
        }
        // Ensure that the student hasnt already enrolled

        let isEnrolled = await AssessmentGroup.findOne({
          enrolled_students: new_student._id,
        });
        if (isEnrolled) {
          return {
            message: "That user is already enrolled",
            value: false,
          };
        }

        await AssessmentGroup.findByIdAndUpdate(group_id, {
          $push: { enrolled_students: new_student._id },
        });

        let enrolled_group_link = enrolling_group.group_url;

        await sendEmail(
          new_student.email,
          "CBTPal Enrollment",
          `<div>

          <div>Please click <a href="${front_end}/${enrolled_group_link}">here</a> to login to your student account<img /></div>

          <div>You may login with your email and the temporal password provided bellow.</div>
          <div>${temp_password}</div>
          <div>You may change your password uppon logging to your profile page</div>
          </div>`
        );

        return {
          message: `New student successfully added and enrolled to ${enrolling_group.title}`,
          value: true,
          //student: new_student,
          //admin: new_admin,
        };
      } catch (err) {
        throw err;
      }
    }
  ),
  csv_enroll_multiple_students: combineResolvers(
    is_admin,
    async (_, { group_id, student_contacts_csv }, { user_id }) => {
      try {
        let sample = [
          {
            full_name: "Glory Michael",
            email: "glory@email.com",
            phone_number: "08181880242",
          },
          {
            full_name: "Glorios Johnson",
            email: "glory@email.com",
            phone_number: "08182692980242",
          },
        ];
        //
        // Verify group ID
        const enrolling_group = await AssessmentGroup.findById(group_id);

        if (!enrolling_group) {
          throw new UserInputError(
            `There is no assement group with the ID: ${group_id}`
          );
        }

        let batch_result = {
          new_registrations: [],
          new_enrollments: [],
          failed_enrollments: [],
        };

        //Loop through arry of contact objects
        for (let contact_obj of student_contacts_csv) {
          const student_check = await Student.findOne({
            email: contact_obj.email,
          });
          if (!student_check) {
            let new_student = new Student({
              full_name: contact_obj.full_name,
              email: contact_obj.email,
              email_verified_status: true,
              phone_number: contact_obj.phone_number,
              invited_by: user_id,
            });

            // Generate random string to send to server as temporal password
            const temp_password = randomString.generate(6);

            new_student.password = await new_student.hashPassword(
              //contact_obj.email
              temp_password
            );

            new_student = await Student.create(new_student);

            batch_result.new_registrations.push(new_student.email);

            await AssessmentGroup.findByIdAndUpdate(group_id, {
              $push: { enrolled_students: new_student._id },
            });

            batch_result.new_enrollments.push(new_student.email);

            let enrolled_group_link = enrolling_group.group_url;

            await sendEmail(
              new_student.email,
              "CBTPal Enrollment",
              `<div>

              <div>Please click <a href="${front_end}/${enrolled_group_link}">here</a> to verify your student account<img /></div>

              <div>Your current email ${contact_obj.email} will servere as your temporal password to the CBT Pal Platform</div>
              <div>You may change your password uppon logging to your profile page</div>
              </div>`
            );
          } else {
            let is_enrolled = await AssessmentGroup.findOne({
              enrolled_students: student_check._id,
            });

            if (is_enrolled) {
              batch_result.failed_enrollments.push(student_check.email);
            } else {
              await AssessmentGroup.findByIdAndUpdate(group_id, {
                $push: { enrolled_students: student_check._id },
              });

              batch_result = new_enrollments.push(student_check.email);

              await sendEmail(
                new_student.email,
                "CBTPal Enrollment",
                `<div>
  
                <div>Please click <a href="${front_end}/${enrolled_group_link}">here</a> to login to your student account<img /></div>
  
                <div>You may login with your email and the temporal password provided bellow.</div>
                <div>${temp_password}</div>
                <div>You may change your password uppon logging to your profile page</div>
                </div>`
              );
            }
          }
        }

        return {
          message: "Batch processed CSV completed successfully",
          batch_status: batch_result,
        };
      } catch (error) {
        throw error;
      }
    }
  ),

  email_enroll_multiple_students: combineResolvers(
    is_admin,
    async (_, { group_id, student_contacts }, { user_id }) => {
      try {
        let front_end = process.env.FRONT_END_URL;

        // Verify group ID
        const enrolling_group = await AssessmentGroup.findById(group_id);

        if (!enrolling_group) {
          throw new UserInputError(
            `There is no assement group with the ID: ${group_id}`
          );
        }
        let enrolled_group_link = enrolling_group.group_url;

        //console.log(enrolling_group.enrolled_students);

        let batch_result = {
          new_registrations: [],
          new_enrollments: [],
          failed_enrollments: [],
        };

        // Loop through array of student email to

        for (let contact_email of student_contacts) {
          const student_check = await Student.findOne({ email: contact_email });

          if (!student_check) {
            // At tthis point the student does not exist on the pla=tform

            // 1. CREATE NEW STUDENT ACCOUNT
            let new_student = new Student({
              full_name: " ",
              email: contact_email,
              email_verified_status: false,
              //phone_number: phone_number,
              invited_by: user_id,
            });

            // Generate random string to send to server as temporal password
            const temp_password = randomString.generate(6);
            // hash password

            new_student.password = await new_student.hashPassword(
              //contact_obj.email
              temp_password
            );

            /*
            new_student.password = await new_student.hashPassword(
              contact_email
            );
            */

            new_student = await Student.create(new_student);

            // Update coalator
            batch_result.new_registrations.push(new_student.email);

            // 2. ENROLL TO GROUP
            await AssessmentGroup.findByIdAndUpdate(group_id, {
              $push: { enrolled_students: new_student._id },
            });

            batch_result.new_enrollments.push(new_student.email);

            // 3. Send invitation email and await email_confirmation
            // let enrolled_group_link = enrolling_group.group_url;

            // 3. SEND EMAIL TO STUDENT

            await sendEmail(
              new_student.email,
              "CBTPal Enrollment",
              `<div>

              <div>Please click <a href="${front_end}/${enrolled_group_link}">here</a> to login to your student account<img /></div>

              <div>You may login with your email and the temporal password provided bellow.</div>
              <div>${temp_password}</div>
              <div>You may change your password uppon logging to your profile page</div>
              </div>`
            );
          } else {
            // At this point the student already exists on the platform

            // 1. ENSURE THE STUDENT HAS NOT BEEN ENROLLED ALREADY

            let isEnrolled = await AssessmentGroup.findOne({
              _id: group_id,
              enrolled_students: student_check._id,
            });
            if (isEnrolled) {
              batch_result.failed_enrollments.push(student_check.email);
            }
            // Else we enroll the student
            else {
              // 2. ENROLL THE XISTING STUDENT
              await AssessmentGroup.findByIdAndUpdate(group_id, {
                $push: { enrolled_students: student_check._id },
              });

              // i. Update coalator
              batch_result.new_enrollments.push(student_check.email);
              // 3. SEND EMAIL NOTIFICATION TO STUDENT

              await sendEmail(
                student_check.email,
                "CBTPal Enrollment",
                `<div>
              <div>Access assessment on  <a href="${front_end}/${enrolled_group_link}">here</a><img /></div>
               </div>`
              );
            }
          }
        }
        //console.log(batch_result);
        return {
          message: "Batch process completed successfully",
          batch_status: batch_result,
        };
      } catch (error) {
        throw error;
      }
    }
  ),
  // Login for students
  student_login: async (_, { email, password }) => {
    try {
      // Check for user details in DB
      const find_student = await Student.findOne({
        email: email,
        email_verified_status: true,
      });

      if (!find_student) {
        throw new UserInputError("Incorrect Email or Password");
      }

      // If User Exists then Compare Passwords
      //const compare_password = find_student.verifyPassword(password);
      const compare_password = await find_student.verifyPass(password);
      if (!compare_password) {
        throw new UserInputError("Incorrect email or password");
      }
      const token = find_student.createToken();

      // response
      return {
        student: find_student,
        token: token,
      };
    } catch (err) {
      throw err;
    }
  },
  // Load student profile(Private Route: Only for students)
  student_profile: combineResolvers(
    is_student,
    async (_, args, { user_id }) => {
      try {
        // Find logged in user
        const studentProfile = await Student.findById(user_id);

        if (!studentProfile) {
          throw new ApolloError("User Does Not Exist");
        }

        return { student: studentProfile };
      } catch (err) {
        throw err;
      }
    }
  ),

  delete_student: combineResolvers(
    is_admin,
    async (_, { student_id }, { user_id }) => {
      try {
        // Verify student id
        const is_valid_student = await Student.findById(student_id);

        if (!is_valid_student) {
          throw new UserInputError("Inavlid student id");
        }
        //const deleting_student = await Student.findByIdAndDelete(student_id);
        const deleting_student = await Student.findByIdAndDelete(
          is_valid_student._id
        );

        //console.log(deleting_student);
        return {
          message: `Deleted student`,
          value: true,
        };
      } catch (error) {
        throw error;
      }
    }
  ),
  get_all_students: combineResolvers(
    is_admin,
    async (_, { cursor, limit }, { user_id }) => {
      try {
        // Cursor based paginated lists of students
        let students;
        if (cursor) {
          students = await Student.find({
            invited_by: user_id,
            createdAt: { $lt: cursor },
          })
            .limit(limit + 1)
            .sort({ createdAt: -1 });

          const has_next_page = students.length > limit;
          const edges = has_next_page ? students.slice(0, -1) : students;

          return {
            edges,
            page_info: {
              has_next_page,
              end_cursor: edges[edges.length - 1].createdAt,
            },
          };
        } else if (!cursor) {
          students = await Student.find({
            invited_by: user_id,
          })
            .limit(limit + 1)
            .sort({ createdAt: -1 });

          const has_next_page = students.length > limit;
          const edges = has_next_page ? students.slice(0, -1) : students;
          return {
            edges,
            page_info: {
              has_next_page,
              end_cursor: edges[edges.length - 1].createdAt,
            },
          };
        }
      } catch (error) {
        throw error;
      }
    }
  ),
  eligible_assessments: combineResolvers(
    is_student,
    async (_, args, { user_id }) => {
      try {
        console.log(user_id);
        // Student information
        const student_profile = await Student.findById(user_id);
        if (!student_profile) {
          throw new UserInputError("You are not a student on this platform");
        }

        // Used to ensure the student is enrolled in the group
        const is_enrolled = await AssessmentGroup.findOne({
          _id: args.group_id,
          enrolled_students: student_profile._id,
          //enrolled_students: args.student_id,
        });

        if (!is_enrolled) {
          throw new ApolloError(`Student is not enrolled to this group`);
        }
        // console.log(is_enrolled);

        const group_assessments = await Assessment.find({
          group_id: args.group_id,
        });

        return {
          count: group_assessments.length,
          assessments: group_assessments,
        };
      } catch (error) {
        throw error;
      }
    }
  ),
  ///////////////
  student_profile_update: combineResolvers(
    is_student,
    async (_, args, { user_id }) => {
      try {
        // console.log(user_id);

        const student_profile = await Student.findById(user_id);

        if (!student_profile) {
          throw new ApolloError("Student not found");
        }

        let student_profile_update;

        // checking if the admin uploaded an image file to update
        if (args.fiile) {
          let upload_data = await processUpload(
            args.fiile,
            "staging.sumaryz-test.appspot.com"
          );

          // Attempt to update the profile avatar with the newly uploaded image
          student_profile_update = await Student.findByIdAndUpdate(
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
          student_profile_update = await Student.findByIdAndUpdate(
            user_id,
            args,
            {
              new: true,
            }
          );
        }

        return {
          student: student_profile_update,
        };
      } catch (error) {
        throw error;
      }
    }
  ),
  //
  student_password_update: combineResolvers(
    is_student,
    async (
      _,
      { old_password, new_password, confirm_new_password },
      { user_id }
    ) => {
      // Get the student
      const student_profile = await Student.findById(user_id);

      if (!student_profile) {
        throw new ApolloError("Invalid student ID");
      }

      // Confirm validity of the old password
      const valid_old_password = await student_profile.verifyPass(old_password);

      if (!valid_old_password)
        throw new UserInputError("Incorrect old password");

      // Confirm new password

      if (new_password !== confirm_new_password) {
        throw new UserInputError("Passwords do not seem to match");
      }

      const updated_student = await Student.findByIdAndUpdate(
        student_profile._id,
        {
          $set: { password: await student_profile.hashPassword(new_password) },
        },
        { new: true }
      );

      const token = updated_student.createToken();
      return {
        student: updated_student,
        token: token,
      };

      try {
      } catch (error) {
        throw error;
      }
    }
  ),

  student_forgot_password_request: async (_, { email }) => {
    try {
      // Verify admin and email is verified

      const valid_student = await Student.findOne({
        email: email,
        email_verified_status: true,
      });

      if (!valid_student) {
        throw new ApolloError(
          "A student with this email does not exist. If you have signed up previously kindly validate your email account from the mail that was sent to you."
        );
      }

      let verification_link = valid_student.password + "*" + valid_admin.email;

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

  student_reset_password_request: async (
    _,
    { reset_link, new_password, confirm_password }
  ) => {
    try {
      // Verify admin and email is verified
      let check_link = extract_from_link(reset_link);
      // console.log(check_link);
      const valid_student = await Student.findOne({
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

      const updated_student = await Admin.findByIdAndUpdate(
        valid_student._id,
        { $set: { password: await valid_student.hashPass(new_password) } },
        { new: true }
      );

      const token = updated_student.jwtToken();

      return {
        student: updated_student,
        token: token,
      };
    } catch (error) {
      throw error;
    }
  },

  attempted_assessments: combineResolvers(
    is_student,
    async (_, args, { user_id }) => {
      try {
        // Search for assessments taken by the student
        const past_assessments = await SessionResponse.find({
          student_id: user_id,
        });
        if (!past_assessments) {
          return {};
        }

        // Loop through SessionResponse

        console.log(past_assessments);
        return {
          assessments: past_assessments,
        };
      } catch (error) {
        throw error;
      }
    }
  ),
};

/*
ADD ONE STUDENT MANUALLY
mutation{
  add_student_manually(
    full_name:"Sammy Tremlo "
    email: "stremlo@gmail.com"
    phone_number:"6796678976987"
    ) {
    message
    value
    student {
      _id
      full_name
      email
      phone_number
      email_verified_status
     }
  }
}
STUDENT_LOGIN
mutation {
  student_login(email: "fhq38093@bcaoo.com", password: "R07P28x") {
    student {
      _id
      email
      full_name
      contact_address
    }
    token
  }
}
VIEW_STUDENT_PROFILE
query {
  view_student_profile(student_id: "5eac4b8c19fb5e744f799119") {
    _id
    full_name
    email 
  }
}


*/
