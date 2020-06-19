import { UserInputError, ApolloError } from "apollo-server";
import Admin from "../../models/user_types/admin";
import Assessment from "../../models/assesment/assessment";
import AssessmentGroup from "../../models/assesment/assessment_group";

import { combineResolvers } from "graphql-resolvers";

import { is_admin } from "../../services/authorization";
export default {
  create_assessment: combineResolvers(
    is_admin,
    async (
      _,
      {
        title,
        instruction,
        duration_minutes,
        option_view_result,
        option_retake_test,
        option_instant_result,
        option_student_review_assessment,
        passing_percentage,
        questioning_format,
        group_id,
      },
      { user_id }
    ) => {
      try {
        //ensure that the admin is the creator of the group to which this assessment is to be added

        const find_admin = await Admin.findById(user_id);

        const is_group_creator = await AssessmentGroup.findOne({
          //created_by: find_admin._id,
          created_by: user_id,
        });

        if (!is_group_creator) {
          throw new UserInputError(
            "Sorry but you are not authorized to add assessments to this group"
          );
        }

        // Ensure that this assessment has a unique name/ doesnt exist in the database
        // Throw an input error if a similar titled group exists

        let new_assessment = await Assessment.findOne({
          title: title,
          group_id: group_id,
        });
        if (new_assessment) {
          throw new UserInputError(
            "The assessment title you entered is not unique within this group. Please try another title"
          );
        }
        new_assessment = await Assessment.create({
          title,
          instruction,
          duration_minutes,
          option_view_result,
          option_retake_test,
          option_student_review_assessment,
          option_instant_result,
          passing_percentage,
          questioning_format,
          group_id,
          assigned_examiners: [user_id],
        });

        return {
          assessment: new_assessment,
        };
      } catch (error) {
        throw error;
      }
    }
  ),
  publish_toggle_assessment: combineResolvers(
    is_admin,
    async (_, { assessment_id, is_published }, { Id }) => {
      try {
        const pub_toggle_assessment = await Assessment.findById(assessment_id);

        if (!pub_toggle_assessment) {
          throw new ApolloError("Invalid assessment_id");
        }

        // Toggle Boolean value of the is_published field

        let toggled = pub_toggle_assessment.is_published;
        await Assessment.findByIdAndUpdate(pub_toggle_assessment._id, {
          $set: {
            is_published: !toggled,
          },
        });
        return {
          message: `${pub_toggle_assessment.title} is_published: ${pub_toggle_assessment.is_published}`,
        };
      } catch (error) {
        throw error;
      }
    }
  ),
  get_assessment: combineResolvers(
    // isAuthenticated,
    async (_, { assessment_url }, { Id }) => {
      try {
        const find_assesment = await Assessment.findOne({
          assessment_url: assessment_url,
        });
        //console.log(find_assesment);

        if (find_assesment) {
          return {
            message: "Found assessment ",
            value: true,
            assessment: find_assesment,
          };
        } else {
          return {
            message: "Invalid assessment url or no such assessment",
            value: false,
          };
        }
      } catch (error) {
        throw error;
      }
    }
  ),
  /*
query {
  get_assessment(assessment_url: "learning-keras") {
    message
    value
    assessment {
      _id
      title
      assessment_url
    }
  }
}

  */ get_all_assessments: combineResolvers(
    is_admin,
    async (_, { groupId, cursor, limit }, { Id }) => {
      try {
        let all_assessments;
        if (cursor) {
          all_assessments = await Assessment.find({
            group_id: groupId,
            createdAt: { $lt: cursor },
          })
            .limit(limit + 1)
            .sort({ createdAt: -1 });
          /*
          if (all_assessments.length === 0) {
            return {
              edges: all_assessments,
            };

            /*
              
                
          } else if (all_assessments.length > 0) {
            const has_next_page = all_assessments.length > limit;
            const edges = has_next_page
              ? all_assessments.slice(0, -1)
              : all_assessments;
              */
          return {
            edges,
            page_info: {
              has_next_page,
              end_cursor: edges[edges.length - 1].createdAt,
            },
          };
          //}
        } else if (!cursor) {
          all_assessments = await Assessment.find({
            //created_by: Id,
            group_id: groupId,
          })
            .limit(limit + 1)
            .sort({ createdAt: -1 });

          /*
          if (all_assessments.length === 0) {
            return {
              edges: all_assessments,
            };
          } else if (all_assessments.length > 0) {
            */
          const has_next_page = all_assessments.length > limit;
          const edges = has_next_page
            ? all_assessments.slice(0, -1)
            : all_assessments;

          return {
            edges,
            page_info: {
              has_next_page,
              end_cursor: edges[edges.length - 1].createdAt,
            },
          };
        }
        // }
      } catch (error) {
        throw error;
      }
    }
  ),

  assessment_feed: combineResolvers(is_admin, async (_, args, { user_id }) => {
    try {
      //this feed is for both admins and students

      // First verify that the group is valid
      const find_group = await AssessmentGroup.findOne({
        group_url: args.group_url,
      });

      if (!find_group) {
        throw new UserInputError(
          `Incorrect Assessment group url : ${args.group_url}. `
        );
      }
      const group_assessments = await Assessment.find({
        group_id: find_group._id,
      });

      if (!group_assessments) {
        return {
          message: "No assessments where found in the requested group",
          value: false,
        };
      } else {
        return {
          //message: `Here are your assessments found in the ${find_group.title} group .`,
          //value: true,
          //group: find_group,
          assessments: group_assessments,
        };
      }
    } catch (error) {
      throw error;
    }
  }),

  //TODO To be deprecated
  get_admin_assessments: combineResolvers(
    is_admin,
    async (_, __, { user_id }) => {
      try {
        let all_admin_assessments = [];
        //get all groups created by the user
        const admin_groups = await AssessmentGroup.find({
          created_by: user_id,
        });
        if (!admin_groups) {
          throw new UserInputError("This admin has no groups nor assessments");
        }
        for (let group of admin_groups) {
          //console.log("GROUP:", group.title);
          let all_assessments = await Assessment.find({
            group_id: group._id,
          });
          // if (!all_assessments) {
          //throw new UserInputError("This admin has no assessments");
          // }
          for (let assesment of all_assessments) {
            //console.log("ASSESSMENT:", assesment.title);

            all_admin_assessments.push(assesment);
          }
        }

        return {
          message: "Done",
          assessments: all_admin_assessments,
        };
      } catch (error) {
        throw error;
      }
    }
  ),

  delete_assessment: combineResolvers(
    is_admin,
    async (_, { assessment_id }, { user_id }) => {
      try {
        // Verify student id
        const is_valid_assessment = await Assessment.findById(assessment_id);

        if (!is_valid_assessment) {
          throw new ApolloError("Inavlid assessment-id");
        }
        //const deleting_student = await Student.findByIdAndDelete(student_id);
        const deleting_assessment = await Assessment.findByIdAndDelete(
          is_valid_assessment._id
        );

        //console.log(deleting_student);
        return {
          message: `Deleted assessment`,
          value: true,
        };
      } catch (error) {
        throw error;
      }
    }
  ),
};

/*
CREATE ASSESSMENT
mutation {
  create_assessment(
    title: "Gadgets Four"
    instruction: "Gadgets"
    duration_minutes: 60
    option_view_result: false
    option_retake_test: false
    group_id: "5ec297824c22cb15d03269c7"
  ) {
    assessment {
      _id
      title
      instruction
      duration_minutes
      option_view_result
      option_retake_test
      assigned_examiners{
        _id
        full_name
      }
      group_id {
        _id
        title
      }
    }
  }
}
GET ASSESSMENT FEED 
query{
  assessment_feed(group_url: "computer-science") {
    message
    value
    assessments{
      _id
      title
       assessment_url
    }
  }
}

GET AN ASSESSMENT( USING URL)
query {
  get_assessment(assessment_url: "systems-design") {
    message
    value
    assessment {
      _id
      title
      instruction
      assessment_url
      duration_minutes
      option_view_result
      option_retake_test
      option_instant_result
      assigned_examiners{
        _id
        full_name
        email
        email_verified_status
      }

      group_id {
        _id
        title
        group_url
        icon_avatar
        created_by {
          _id
          full_name
          email
        }
      }
    }
  }
}
*/
