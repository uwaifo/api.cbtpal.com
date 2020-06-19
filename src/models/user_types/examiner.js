import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
//import bcrypt from "bcrypt";

const examinerSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
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
    profile_image: {
      type: String,
    },
    phone_number: {
      type: String,
    },
    password: {
      type: String,
      //required: [true, "Please add a password"],
      //minlength: 6,
    },
    is_examiner: {
      type: Boolean,
      default: true,
    },
    invited_by: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

// Hash password before save to DB
examinerSchema.pre("save", async function(next) {
  if (this.isModified("password")) {
    this.password = await this.hashPass(this.password);
  }

  next();
});

examinerSchema.methods = {
  // Sign token for user authorization
  jwtToken: function() {
    return jwt.sign(
      {
        user_id: this._id,
        is_examiner: this.is_examiner,
        // is_admin: this.is_admin,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );
  },

  // Hash Password
  hashPass: async function(password) {
    return await bcrypt.hash(password, 12);
  },

  // Verify user password
  verifyPass: async function(password) {
    let cp = await bcrypt.compare(password, this.password);

    return cp;
  },
};

export default mongoose.model("Examinar", examinerSchema);
