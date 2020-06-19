import mongoose, { Schema } from "mongoose";
import URLSlugs from "mongoose-url-slugs";
import mongoose_delete from "mongoose-delete";

const assessmentGroupSchema = new Schema(
  {
    created_by: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    title: {
      type: String,
      required: [true, "Please add a title"],
      unique: true,
      //trim: true,
      maxlength: [50, "Name can not be more than 50 characters"],
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
      //trim: true,
      maxlength: [160, "Name can not be more than 160 characters"],
    },
    icon_avatar: {
      type: String,
      default: "AG",
    },
    group_url: {
      type: String,
    },
    assessmansts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Assessment",
      },
    ],
    enrolled_students: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student",
        //unique: true,
      },
    ],
  },
  { timestamps: true }
);

assessmentGroupSchema.plugin(mongoose_delete, { deletedAt: true });
// Save slugs to 'myslug' field.
assessmentGroupSchema.plugin(
  URLSlugs("title", { field: "group_url", maxlength: 5 })
);
// assessmentGroupSchema.plugin(URLSlugs("title", { field: "icon_avatar" }));

export default mongoose.model("AssessmentGroup", assessmentGroupSchema);
