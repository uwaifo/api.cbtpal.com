import { ApolloError, UserInputError } from "apollo-server-express";

import Admin from "../models/user_types/admin";
import Examiner from "../models/user_types/examiner";
import Assessment from "../models/assesment/assessment";
//

export const auth_examiner = async (user_id, assessment_id, assessment_url) => {
  try {
    //check if examiner
    //const find_examiner = await Examiner.findById(user_id);

    // const is_administrator = await Admin.findById(user_id);

    // Get the assessment
    /*
    const find_assesment = await Assessment.findOne({
      assessment_url: assessment_url,
    });
    */

    const find_assesment = await Assessment.findById(assessment_id);

    if (!find_assesment) {
      throw new ApolloError("Invalid assessment Link");
    }

    let find_examiner;

    // Loop through assigned examiners to verify that caller is assigned
    for (let enrolled_examiner of find_assesment.assigned_examiners) {
      if (enrolled_examiner == user_id) {
        // If found, get more details of examiner
        find_examiner = await Examiner.findById(user_id);
      }
    }

    return {
      assesment: find_assesment,
      examiner: find_examiner,
    };
    /*

    // Variable to store examiner info



    if (!q_examiner && !is_administrator) {
      return {
        message:
          "You are not an Examiner or Administrator assigned to this assessment. You can not add questions to it.",
        value: false,
      };
    } else {
      return {
        examiner: q_examiner,
        assesment: find_assesment,
      };
    }
    */
  } catch (error) {
    throw error;
  }
};
