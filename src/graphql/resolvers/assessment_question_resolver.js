import { ApolloError, UserInputError } from "apollo-server-express";
import dotenv from "dotenv";
import { combineResolvers } from "graphql-resolvers";

import Assessment from "../../models/assesment/assessment";
import AssessmentQuestion from "../../models/assesment/assessment_question";
import Examiner from "../../models/user_types/examiner";

import { is_examiner } from "../../services/authorization";
import { isAuthenticated } from "../../services/authorization";
import Admin from "../../models/user_types/admin";
import { auth_examiner } from "../../services/auth_examiner";
import { question_input_validator } from "../../services/question_input_validator";

dotenv.config();

export default {
  add_essay_question: combineResolvers(
    is_examiner,
    async (_, { assessment_id, question_statement }, { user_id }) => {
      try {
        const valid_examiner = await question_input_validator(
          assessment_id,
          user_id
        );

        //TODO Check that answer_option is not greater than 4

        // Create new assessment question
        let new_question = AssessmentQuestion({
          assessment_id: valid_examiner.find_assesment._id,
          question_statement: question_statement,
          question_type: "essay",
        });

        // Add new assesment question object to collection
        new_question = await AssessmentQuestion.create(new_question);

        return {
          question: new_question,
          //question: new_question,
        };
      } catch (error) {
        throw error;
      }
    }
  ),
  //TODO change name to add_multiplechoice_question
  add_assessment_question: combineResolvers(
    is_examiner,
    async (
      _,
      {
        assessment_id,
        //assessment_url,
        question_statement,
        answer_options,
      },
      { user_id }
    ) => {
      try {
        //check if admin
        const is_admin = await Admin.findById(user_id);

        // Get the assessment
        const find_assesment = await Assessment.findById(assessment_id);
        /*
        const find_assesment = await Assessment.findOne({
          assessment_url: assessment_url,
        });
        */

        if (!find_assesment) {
          throw new ApolloError("Invalid assessment Link");
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

        // Check that answer_option is not greater than 4
        if (answer_options.length !== 4) {
          throw new UserInputError(
            "Answer option can not be greater or less than four"
          );
        }
        // Ensure that there is only one correct answer
        let count_correct = 0;
        for (let checker of answer_options) {
          if (checker.is_correct === true) {
            count_correct++;
          }
        }

        if (count_correct > 1) {
          throw new UserInputError("You  can only have one correct option");
        }

        // Create new assessment question
        let new_question = AssessmentQuestion({
          assessment_id: find_assesment._id,
          question_statement: question_statement,
          question_type: "multiple-choice",
          answer_options: answer_options,
        });

        // Add new assesment question object to collection
        new_question = await AssessmentQuestion.create(new_question);

        return {
          message: `Added new question to ${find_assesment.title}`,
          value: true,
          question: new_question,
          examiner: q_examiner,
          //question: new_question,
        };
      } catch (error) {
        throw error;
      }
    }
  ),

  all_assessment_questions: combineResolvers(
    is_examiner,
    async (_, { assessment_id, assessment_url }, { user_id }) => {
      try {
        // Note that only Examiners and Administrators should view a listing of questions for am assessment
        const valid_examiner = await auth_examiner(
          user_id,
          assessment_id,
          assessment_url
        );

        const get_questions = await AssessmentQuestion.find({
          assessment_id: valid_examiner.assesment._id,
        });

        return {
          message: `Here are questions for ${valid_examiner.assesment.title}.`,
          value: true,
          //assessment: valid_examiner.assesment._id,
          count: get_questions.length,
          questions: get_questions,
        };
      } catch (error) {
        throw error;
      }
    }
  ),

  get_assessment_question: combineResolvers(
    is_examiner,
    async (_, { question_id }, { user_id }) => {
      try {
        // get the qusetion from its ID
        const req_question = await AssessmentQuestion.findById(question_id);

        if (!req_question) {
          throw new UserInputError("Invalid question ID");
        }

        // Lookup the assessment
        const req_assessment = await Assessment.findById(
          req_question.assessment_id
        );

        //Verify that the caller is an enrolled  examiner for this questions assessment or an admin

        /*for (let assigned of req_assessment.assigned_examiners) {
          console.log(assigned);
          console.log(user_id);

          if (assigned == user_id) {
            console.log("assigned");
          }
        }
        */

        return {
          question: req_question,
        };
      } catch (error) {
        throw error;
      }
    }
  ),

  edit_assessment_question: combineResolvers(
    isAuthenticated,
    async (_, args, { user_id }) => {
      try {
        // get the qusetion from its ID
        const req_question = await AssessmentQuestion.findById(
          args.question_id
        );

        if (!req_question) {
          throw new ApolloError("Invalid question ID");
        }
        // Lookup the assessment
        const req_assessment = await Assessment.findById(
          req_question.assessment_id
        );

        // Verify that the caller is an enrolled  examiner for this questions assessment or an admin
        let eligible_user = false;
        for (let assigned of req_assessment.assigned_examiners) {
          if (assigned == user_id) {
            //update eligible

            eligible_user = true;
          }
        }
        if (eligible_user === false) {
          return {
            message:
              "You are not an examiner assigned to this course nor an Administrator.",
            value: false,
          };
        } else {
          // Edit the question
          const editable_question = await AssessmentQuestion.findByIdAndUpdate(
            req_question._id,
            {
              question_statement: args.question_statement,
              question_type: args.question_type,
              answer_options: args.answer_options,
            }
          );

          // Return notifification message
          return {
            //question: editable_question,
            message: "Successfully edited the question",
            value: true,
          };
        }
      } catch (error) {
        throw error;
      }
    }
  ),
  delete_assessment_question: combineResolvers(
    is_examiner,
    async (_, { question_id }, { user_id }) => {
      try {
        // get the qusetion from its ID
        const req_question = await AssessmentQuestion.findById(question_id);

        if (!req_question) {
          throw new UserInputError("Invalid question ID");
        }
        // Lookup the assessment
        const req_assessment = await Assessment.findById(
          req_question.assessment_id
        );

        // Verify that the caller is an enrolled  examiner for this questions assessment or an admin
        let eligible_user = false;
        for (let assigned of req_assessment.assigned_examiners) {
          if (assigned == user_id) {
            //update eligible

            eligible_user = true;
          }
        }
        if (eligible_user === false) {
          return {
            message:
              "You are not an examiner assigned to this course nor an Administrator.",
            value: false,
          };
        } else {
          //Delete the question
          const deletable_question = await AssessmentQuestion.findByIdAndDelete(
            req_question._id
          );

          // Return notifification message
          return {
            message: "Successfully deleted the question",
            value: false,
          };
        }
      } catch (error) {
        throw error;
      }
    }
  ),
};
