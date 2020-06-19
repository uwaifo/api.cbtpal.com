import { ApolloError, UserInputError } from "apollo-server-express";
import dotenv from "dotenv";
import { combineResolvers } from "graphql-resolvers";

import Assessment from "../../models/assesment/assessment";
import AssessmentQuestion from "../../models/assesment/assessment_question";
import AssessmentGroup from "../../models/assesment/assessment_group";
//import AssessmentSession from "../../models/assesment/student_session";
import { is_student, is_examiner } from "../../services/authorization";
import { isAuthenticated } from "../../services/authorization";
import Student from "../../models/user_types/student";
import SessionResponse from "../../models/assesment/student_session_response";
import { test_countdown, time_left } from "../../services/test_countdown";
import { pubsub } from "../../config/pubsub";

const TEST_SESSION_COUNTDOWN = "TEST_SESSION_COUNTDOWN";

dotenv.config();

export default {
  asessment_session_page: combineResolvers(
    is_student,
    async (_, args, { user_id }) => {
      try {
        // Verify student
        const test_student = await Student.findById(args.student_id);

        // Verify that the assessment to be taken belongs to the group
        const test_assessment = await Assessment.findById(args.assessment_id);

        // Get the associated questions for this assessment
        const test_questions = await AssessmentQuestion.find({
          assessment_id: test_assessment._id,
        });
        let counter = test_assessment.duration_minutes;
        // test_countdown(counter);

        let tiker = time_left;
        /*
       
        let intervalId = setInterval(() => {
          //console.log(`Time Left : ${counter}`);
          //counter += 1;
          counter--;
          tiker = `Time Left : ${counter}`;
          //time_left = `Time Left : ${counter}`;
          if (counter === 0) {
            console.log("Done");
            clearInterval(intervalId);
          }
        }, 1000);
        */

        //test_countdown(test_assessment.duration_minutes);
        // pubsub.publish(POST_ADDED, { postAdded: args });
        pubsub.publish(TEST_SESSION_COUNTDOWN, {
          session_countdown: tiker,
        });

        return {
          student: test_student,
          assessment: test_assessment,
          questions: test_questions,
          count: test_questions.length,
        };
      } catch (error) {
        throw error;
      }
    }
  ),

  start_assessment_test: combineResolvers(
    is_student,
    async (_, { student_id, assessment_id }, { user_id }) => {
      try {
        // Verify student
        const test_student = await Student.findById(student_id);
        if (!test_student) {
          throw new ApolloError("Invalid student ID");
        }

        // Verify that the assessment to be taken belongs to the group
        const test_assessment = await Assessment.findById(assessment_id);
        if (!test_assessment) {
          throw new ApolloError("Invalid assessment ID");
        }
      } catch (error) {
        throw error;
      }
    }
  ),

  session_countdown: {
    subscribe: () => pubsub.asyncIterator([TEST_SESSION_COUNTDOWN]),
  },

  // Submit an assessment test from a student
  submit_assessment_test: combineResolvers(
    //is_student,
    //is_examiner,
    async (
      _,
      { input: { student_id, assessment_id, question_response_pairs } },
      { user_id }
    ) => {
      try {
        // Verify student
        const test_student = await Student.findById(student_id);
        if (!test_student) {
          throw new ApolloError("Invalid student ID");
        }

        // Verify that the assessment to be taken belongs to the group
        const test_assessment = await Assessment.findById(assessment_id);
        if (!test_assessment) {
          throw new ApolloError("Invalid assessment ID");
        }

        // Get the associated questions for this assessment
        const test_questions = await AssessmentQuestion.find({
          assessment_id: test_assessment._id,
        });

        if (!test_questions) {
          throw new ApolloError("Could not fetch those questions");
        }

        // Create an array of question_response_pairs
        let new_qr_pairs = [];
        let correct_answer_count = 0;
        for (let index of question_response_pairs) {
          // Check if the students response option is correct by correct_option_id
          let check_correct_option = await AssessmentQuestion.findById(
            index.question_id
          );
          let right_one;
          //let option_set = check_correct_option.answer_options;

          //TODO Improve by searching through the previouslly gotten test_questions object
          for (let option of check_correct_option.answer_options) {
            if (option.is_correct == true) {
              right_one = option;
            }
          }

          // Compare student inputed answer opting with right one

          let new_pair = {
            question_id: index.question_id,
            selected_answer_option: index.selected_answer_option,
            //correct_answer_option: right_one,
            is_correct: right_one._id == index.selected_answer_option,
          };

          //
          new_qr_pairs.push(new_pair);

          if (new_pair.is_correct == true) {
            correct_answer_count++;
          }
        }

        //Coalate percentage
        let calc_score = 100 / (test_questions.length / correct_answer_count);
        //TODO get pass mark form assessment settings
        let calc_pass_fail = calc_score >= 50;
        //console.log(new_qr_pairs);

        let student_test_input = new SessionResponse({
          student_id: test_student._id,
          assessment_id: test_assessment._id,
          pass_fail: calc_pass_fail,
          assessment_score: calc_score.toFixed(0),
          question_response_pairs: new_qr_pairs,
        });

        //console.log(student_test_input);

        // Save the computed result

        const saved_assessment_score = await SessionResponse.create(
          student_test_input
        );

        return {
          message: "ok",
          count: question_response_pairs.length,
          //result: student_test_input,
          result: student_test_input,
        };
      } catch (error) {
        throw error;
      }
    }
  ),
};

/*
mutation {
  submit_assessment_test(
    input: {
      student_id: "5ec62076ad269800208eaa2d"
      assessment_id: "5ec2c126dc1b6e21f1124692"
      question_response_pairs: [
        {
          question_id: "5ec4b7dfbc05cb8b99648303"
          selected_answer_option: "5ec4b7dfbc05cb8b99648304"
        }
        {
          question_id: "5ec4d5dc9085cc9262f282a3"
          selected_answer_option: "5ec4d5dc9085cc9262f282a5"
        }
      ]
    }
  ) {
    message
    count
    result {
      student_id
      assessment_id
      assessment_score
      pass_fail
      question_response_pairs {
        question_id
        selected_answer_option
        is_correct
        
      }
    }
  }
}
#Use mongoose to find in an Array of Objects
#https://kb.objectrocket.com/mongo-db/use-mongoose-to-find-in-an-array-of-objects-1206
#https://www.thoughtco.com/javascript-by-example-use-of-the-ternary-operator-2037394


*/
