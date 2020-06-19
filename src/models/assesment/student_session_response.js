import mongoose, { Schema } from "mongoose";

const sessionResponseSchema = new Schema(
  {
    student_id: {
      type: Schema.Types.ObjectId,
      ref: "Student",
    },
    assessment_id: {
      type: Schema.Types.ObjectId,
      ref: "AssessmentSession",
    },
    assessment_score: {
      type: Number,
      min: 0,
      max: 100,
    },

    pass_fail: {
      type: Boolean,
    },

    //REMOVE assessment_question_id
    assessment_question_id: {
      type: Schema.Types.ObjectId,
      ref: "AssesmentQuestion",
    },
    //
    question_response_pairs: [
      {
        question_id: {
          type: Schema.Types.ObjectId,
          // ref: "AssesmentQuestion",
          //required: true,
        },
        correct_option_id: {
          type: Schema.Types.ObjectId,
          //ref: "",
          //required: true,
        },
        selected_answer_option: {
          type: Schema.Types.ObjectId,
          //ref: "",
          //required: true,
        },
        is_correct: {
          type: Boolean,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("SessionResponse", sessionResponseSchema);
