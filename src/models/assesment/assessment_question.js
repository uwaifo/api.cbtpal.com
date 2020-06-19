import mongoose, { Schema } from "mongoose";

const questionSchema = new Schema({
  question_statement: {
    type: String,
    required: [true, "Please enter a question"],
    unique: true,
  },

  question_type: {
    type: String,
    required: [true, "Please indicate the type of question"],
    enum: ["multiple-choice", "essay"],
  },
  question_diagram_url: {
    type: String,
    default: "no_diagram.jpg",
  },
  answer_essay: {
    type: String,
  },
  answer_options: [
    {
      option_statement: {
        type: String,
        required: true,
      },
      is_correct: {
        type: Boolean,
        default: false,
        required: true,
      },
      correct_answer_explanation: {
        type: String,
        maxlength: [600, "Explanations can not be more than 600 characters"],
      },
    },
  ],

  assessment_id: {
    type: Schema.Types.ObjectId,
    ref: "Assessment",
  },
});

export default mongoose.model("AssesmentQuestion", questionSchema);
