import mongoose, { Schema, model } from "mongoose";
import URLSlugs from "mongoose-url-slugs";

const groupResultSchema = new Schema(
  {
    group_id: {
      type: Schema.Types.ObjectId,
      ref: "AssessmentGroup",
      required: true,
    },
    continuous_assessments: [
      {
        assessment_id: {
          type: Schema.Types.ObjectId,
          ref: "Assessment",
          required: true,
        },
        assessment_percentage: {
          type: Number,
          min: 0,
          max: 100,
          default: 50,
        },
      },
    ],
  },
  { timestamps: true }
);
//assessmemtSchema.plugin(URLSlugs("title", { field: "assessment_url" }));

export default model("AssessmentResult", groupResultSchema);
