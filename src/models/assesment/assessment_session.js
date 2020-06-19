import mongoose, { Schema } from "mongoose";

const assessmentSessionSchema = new Schema(
  {
    student_id: {
      type: Schema.Types.ObjectId,
      ref: "Student",
    },
    assessment_id: {
      type: Schema.Types.ObjectId,
      ref: "AssessmentSession",
    },
  },
  { timestamps: true }
);

export default mongoose.model("AssessmentSession", assessmentSessionSchema);
