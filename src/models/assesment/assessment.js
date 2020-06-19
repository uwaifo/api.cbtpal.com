import mongoose, { Schema, model } from "mongoose";
import URLSlugs from "mongoose-url-slugs";

const assessmemtSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Please add an assessment title"],
    },
    instruction: {
      type: String,
      required: [true, "Please add some instructions"],
    },
    duration_minutes: {
      type: Number,
      /*min: 0,
      max: 120,
      required: [false, "Time duration of between 10 and 60 minutes"],
      */
    },
    passing_percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
      required: [false, "Please add a passing percentage between 0 and 100"],
    },
    questioning_format: {
      type: String,
      required: [true, "Please indicate the type of question"],
      enum: ["multiple-choice", "essay"],
    },
    //Replacing option_view_result
    option_student_review_assessment: {
      type: Boolean,
      default: false,
    },
    //TODO Delete this field
    option_view_result: {
      type: Boolean,
      default: false,
    },
    option_retake_test: {
      type: Boolean,
      default: false,
    },
    option_instant_result: {
      type: Boolean,
      default: false,
    },
    assessment_url: {
      type: String,
      unique: true,
    },
    is_published: {
      type: Boolean,
      default: true,
    },

    cont_asmnt_id: {
      type: String,
      required: true,
    },
    assessment_percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    group_id: {
      type: Schema.Types.ObjectId,
      ref: "AssessmentGroup",
      required: true,
    },
    assigned_examiners: [
      {
        type: Schema.Types.ObjectId,
        ref: "Examiner",
        unique: true,
      },
    ],
  },
  { timestamps: true }
);
assessmemtSchema.plugin(URLSlugs("title", { field: "assessment_url" }));

export default model("Assessment", assessmemtSchema);
