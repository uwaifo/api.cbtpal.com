"use strict";
import { ApolloError, UserInputError } from "apollo-server-express";

import Admin from "../models/user_types/admin";
import Assessment from "../models/assesment/assessment";
import Examiner from "../models/user_types/examiner";

export const question_input_validator = async (assessment_id, user_id) => {
  //check if admin
  const is_admin = await Admin.findById(user_id);

  // Get the assessment
  const find_assesment = await Assessment.findById(assessment_id);
  if (!find_assesment) {
    throw new ApolloError("Invalid assessment ID");
  }
  // Variable to store examiner info
  let q_examiner; //= Examiner;

  // Loop through assigned examiners to verify that caller is assigned
  for (let enrolled_examiner of find_assesment.assigned_examiners) {
    if (enrolled_examiner == user_id) {
      // If found, get more details of examiner
      q_examiner = await Examiner.findById(user_id);
    }
  }

  if (!q_examiner && !is_admin) {
    return {
      message:
        "You are not an Examiner or Administrator assigned to this assessment. You can not add questions to it.",
      value: false,
    };
  }

  return {
    find_assesment,
  };
};
