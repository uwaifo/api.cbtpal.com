import { combineResolvers } from "graphql-resolvers";
//import { isAdmin } from "../../services/authorization";
import AssessmentGroup from "../../models/assesment/assessment_group";
import Assessment from "../../models/assesment/assessment";

import { ApolloError, UserInputError } from "apollo-server";

export default {
  compose_group_result: combineResolvers(
    //isAdmin,
    async (_, { group_id, continuous_assessments }, { user_id }) => {
      try {
        const result_group = await AssessmentGroup.findById(group_id);

        if (!result_group) {
          throw new ApolloError("Invalid Group ID ");
        }

        const group_assessments = await Assessment.find({
          group_id: group_id,
        });

        //

        let assessment_values = [];
        const total_percentages = 100;
        let coalated_percentages = 0;
        for (let i of continuous_assessments) {
          // Get the assessment

          coalated_percentages = coalated_percentages + i.assessment_percentage;
          let f_asmnt = group_assessments.find((x) => x._id == i.assessment_id);

          let new_pair = {
            assessment: f_asmnt,
            assessment_percentile: i.assessment_percentage,
          };

          assessment_values.push(new_pair);
        }

        if (coalated_percentages != total_percentages) {
          throw new UserInputError(
            `Total percentile value of each assessment must ammount to 100`
          );
        }

        return {
          message: "ok",
          group: result_group,
          mark_count: coalated_percentages,
          assessment_values: assessment_values,
        };
      } catch (error) {
        throw error;
      }
    }
  ),
};
