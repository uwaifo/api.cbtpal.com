import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose_delete from "mongoose-delete";

dotenv.config();

const studentSchema = new Schema(
  {
    full_name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    email_verified_status: {
      default: false,
      type: Boolean,
    },
    contact_address: {
      type: String,
    },
    profile_avatar: {
      type: String,
    },

    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: 6,
    },
    phone_number: {
      type: String,
    },
    invited_by: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    is_student: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

studentSchema.plugin(mongoose_delete, { deletedAt: true });

studentSchema.methods = {
  // Sign token for user authorization
  jwtToken: function() {
    return jwt.sign(
      {
        user_id: this._id,
        is_student: this.is_student,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );
  },
  // Sign token for email verification
  emailToken: function() {
    return jwt.sign({ userId: this._id }, process.env.EMAIL_SECRET, {
      expiresIn: "3d",
    });
  },

  //Creating user token
  // Sign token for user authorization
  createToken: function() {
    return jwt.sign(
      { user_id: this._id, is_student: this.is_student },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );
  },

  //Hashing user password
  hashPassword(password) {
    return bcrypt.hash(password, 12);
  },

  // Verify user password
  verifyPass: async function(password) {
    let cp = await bcrypt.compare(password, this.password);

    return cp;
  },
  // DELETE THIS Verifying user password
  verifyPassword(password) {
    let comparePassword = bcrypt.compare(password, this.password);
    return comparePassword;
  },
};
export default mongoose.model("Student", studentSchema);
