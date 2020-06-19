import { UserInputError, ApolloError } from "apollo-server";

import AssessmentGroup from "../../models/assesment/assessment_group";
import Student from "../../models/user_types/student";

import { combineResolvers } from "graphql-resolvers";

import {
  isAuthenticated,
  is_admin,
  is_student,
} from "../../services/authorization";
import Admin from "../../models/user_types/admin";
export default {
  create_assessment_group: combineResolvers(
    is_admin,
    async (_, args, { user_id }) => {
      try {
        let group_owner = await Admin.findById(user_id);

        if (group_owner.email_verified_status === false) {
          throw new ApolloError(
            "Please verify your email to complete this action"
          );
        }

        // Check if an assessment-group of similar title exist
        // this will refactored to use a unique url
        let new_assessment_group = await AssessmentGroup.findOne({
          title: args.title,
        });

        // Throw an input error if a similar titled group exists
        if (new_assessment_group) {
          throw new ApolloError(
            "There is already an assessment group with that title"
          );
        }

        // If it doesnt exist, attempt to save

        new_assessment_group = await AssessmentGroup.create({
          title: args.title,
          description: args.description,
          created_by: group_owner._id,
        });

        return {
          //message: "Assessment group created successfully",
          //value: true,
          group: new_assessment_group,
          //title: new_assessment_group.title,
          //description: new_assessment_group.description,
        };
      } catch (error) {
        throw error;
      }
    }
  ),
  delete_assessment_group: combineResolvers(
    is_admin,
    async (_, { group_id }, { user_id }) => {
      try {
        // Find the group
        const deletable_group = await AssessmentGroup.findById(group_id);

        if (!deletable_group) {
          throw new UserInputError("Group does not exist");
        }
        // And ensure it belongs to the calling admin
        else if (deletable_group.created_by != user_id) {
          throw new UserInputError(
            `You are not the creator of the group ${deletable_group.title}, you may not delete it`
          );
        } else {
          const delete_group = await AssessmentGroup.findByIdAndDelete(
            deletable_group._id
          );
          /*
          const delete_group = await AssessmentGroup.delete({
            _id: deletable_group._id,
          });
          */
        }

        return {
          message: "Group was deleted successfully",
          value: true,
          next: "admin_assessment_groups",
        };
      } catch (error) {
        throw error;
      }
    }
  ),

  // Returns groups created by a specifid administrator
  admin_assessment_groups: combineResolvers(
    is_admin,
    async (_, __, { user_id }) => {
      //get calling users info
      const group_owner = await Admin.findById(user_id);

      // get all groups created by admit
      const admins_groups = await AssessmentGroup.find({
        created_by: group_owner._id,
        //deleted: true,
      });

      if (admins_groups.length < 1) {
        return {
          message: `No groups found for the user ${group_owner.full_name}`,
          value: false,
        };
      } else {
        return {
          groups: admins_groups,
        };
      }
    }
    /*
    query {
  admin_assessment_groups{
    groups{
      _id
      title
      description
    }
  }
}
    */
  ),

  get_one_assessment_group: combineResolvers(
    is_admin,
    async (_, { group_id }, { user_id }) => {
      //get calling users info
      const group_owner = await Admin.findById(user_id);

      //CHECKING ONLY BY GROUP_URL
      if (group_id) {
        const groupCheck = await AssessmentGroup.findOne({
          _id: group_id,
          // created_by: group_owner._id,
        });

        if (groupCheck) {
          return {
            group: groupCheck,
          };
        }
        if (!groupCheck) {
          throw new UserInputError("Not found");
        }
      }
    }
  ),
  invite_student: combineResolvers(is_admin, async (_, { email }, { Id }) => {
    //verify admin sending out the invitation
    //verify email format
    //veirfy that email is not in db and verification status
    //get group url and format invitation link
    //send email invitation with invitation link
  }),

  get_all_assessment_groups: combineResolvers(
    is_admin,
    async (_, { cursor, limit }, { user_id }) => {
      try {
        let asmt_groups;
        if (cursor) {
          asmt_groups = await AssessmentGroup.find({
            created_by: user_id,
            createdAt: { $lt: cursor },
          })
            .limit(limit + 1)
            .sort({ createdAt: -1 });

          if (asmt_groups.length === 0) {
            return {
              edges: asmt_groups,
            };

            /*
            
              */
          } else if (asmt_groups.length > 0) {
            const has_next_page = asmt_groups.length > limit;
            const edges = has_next_page
              ? asmt_groups.slice(0, -1)
              : asmt_groups;
            return {
              edges,
              page_info: {
                has_next_page,
                end_cursor: edges[edges.length - 1].createdAt,
              },
            };
          }
        } else if (!cursor) {
          asmt_groups = await AssessmentGroup.find({
            created_by: user_id,
          })
            .limit(limit + 1)
            .sort({ createdAt: -1 });

          if (asmt_groups.length === 0) {
            return {
              edges: asmt_groups,
            };
          } else if (asmt_groups.length > 0) {
            const has_next_page = asmt_groups.length > limit;
            const edges = has_next_page
              ? asmt_groups.slice(0, -1)
              : asmt_groups;

            return {
              edges,
              page_info: {
                has_next_page,
                end_cursor: edges[edges.length - 1].createdAt,
              },
            };
          }
        }
      } catch (error) {
        throw error;
      }
    }
  ),

  // Add student enrollment resolvers.
  // This should be called only after the student email has been vefified
  enroll_single_student: combineResolvers(
    isAuthenticated,
    async (_, { group_id, student_id }) => {
      try {
        // validate assessment group
        const asmt_group = await AssessmentGroup.findById(group_id);

        if (!asmt_group) {
          throw new UserInputError(
            `There is no assement group with the ID: ${group_id}`
          );
        }

        // Ensure thet the student has been registered on the platform and email verification is completed
        const student = await Student.findById(student_id);

        if (!student) {
          // Replace error handling since its less likely to be thrown directly by user input
          throw new UserInputError(`That student does not exist `);
        }

        // Ensure that the student hasnt already enrolled

        let isEnrolled = await AssessmentGroup.findOne({
          enrolled_students: student_id,
        });
        if (isEnrolled) {
          return {
            message: "That user is already enrolled",
            value: false,
          };
        }

        // add student to enrollment for assessment group

        await AssessmentGroup.findByIdAndUpdate(group_id, {
          $push: { enrolled_students: student_id },
          //optional
          //$inc: { no_of_posts: +1 },
        });
        /*
        const enrollment = await CandidateEnrollment.create({
          group_id,
          candidate_id,
        });
        */

        // Return enrollment
        return {
          message: "Student has been successfully enrolled",
          value: true,
          //group: asmt_group,

          //group: enrollment.group_id,
          //student: enrollment.student_id,
        };
      } catch (error) {
        throw error;
      }
    }
  ),
  // STUDENT REQUEST FOR ASSESSMENT RESOURCES
  get_student_groups: combineResolvers(
    is_student,
    async (_, args, { user_id }) => {
      try {
        const student = await Student.findById(user_id);
        if (!student) {
          throw new ApolloError("Invalid student ID");
        }

        // TODO . It may be ber to remove this block since student.invited_by holds the same id, but may be deleted at the time of call request
        // TODO . Consider implimenting soft delete to keep deleted refrence ID avilable to dependent collections

        const student_admin = await Admin.findById(student.invited_by);
        if (!student_admin) {
          throw new ApolloError(
            "Inviting admin for this student could not be found"
          );
        }

        const eligible_groups = await AssessmentGroup.find({
          created_by: student_admin._id,
          enrolled_students: user_id,
        });

        return {
          groups: eligible_groups,
        };
      } catch (error) {
        throw error;
      }
    }
  ),
};

/*
CREATE GROUP
mutation {
  create_assessment_group(
    title: "Estate Mnagaement 101"
    description: "Estate Mnagaement 101"
  ) {
    message
    value
    group{
      _id
      title
      created_by{
        _id
        full_name
        email
      }
    }
  }
}

GET ALL GROUPS BELONGING TO THE CURRENT ADMIN
query {
  admin_assessment_groups {
    message
    value
    groups{
      _id
      title
      group_url
    }
  }
}
GET ALL GROUPS BELONGING TO THE CURRENT ADMIN & PAGINATED

query {
  get_all_assessment_groups(limit: 10) {
    edges {
      _id
      title
      group_url
      created_by {
        _id
        email
      }
    }
    page_info {
      has_next_page
      end_cursor
    }
  }
}
query {
  get_one_assessment_group(group_url: "machine-learning-102") {
    message
    value
    group {
      _id
      group_url
      created_by{
        full_name
      }
      enrolled_students {
        _id
        full_name
      }
    }
  }
}

ENROLL SINGLE STUDENT
mutation {
  enroll_single_student(
    group_id: "5eaafbc98d0340208a278012"
    student_id: "5eac53e6ee397c765ffe59c4"
  ) {
    message
    value
    group{
      group_url
    }
    student {
      full_name
    }
  }
}

*/
