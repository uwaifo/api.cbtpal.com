import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import URLSlugs from "mongoose-url-slugs";

dotenv.config();

const adminSchema = new Schema(
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
    phone_number: {
      type: String,
      //unique: true,
      //required: true,
    },
    password: {
      type: String,
      //required: true,
    },
    profile_image: {
      type: String,
    },
    provider_url: {
      type: String,
    },

    is_admin: {
      type: Boolean,
      default: true,
    },

    is_examiner: {
      type: Boolean,
      default: true,
    },
    googleProvider: {
      id: String,
      token: String,
    },
    is_organization: {
      type: Boolean,
      default: false,
    },
    is_individual: {
      type: Boolean,
      default: true,
    },

    contact_address: {
      type: String,
    },
    profile_avatar: {
      type: String,
    },

    organization_name: {
      type: String,
    },
    organization_description: {
      type: String,
    },
    user_description: {
      type: String,
    },
  },
  { timestamps: true }
);
//

// Hash password before save to DB
adminSchema.pre("save", async function(next) {
  if (this.isModified("password")) {
    this.password = await this.hashPass(this.password);
  }

  next();
});

adminSchema.methods = {
  // Sign token for user authorization
  jwtToken: function() {
    return jwt.sign(
      {
        user_id: this._id,
        is_examiner: this.is_examiner,
        is_admin: this.is_admin,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
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
//
adminSchema.statics.upsertGoogleUser = async function({
  accessToken,
  refreshToken,
  profile,
}) {
  const Admin = this;

  const admin = await Admin.findOne({ "social.googleProvider.id": profile.id });

  // no user was found, lets create a new one
  if (!admin) {
    const newAdmin = await Admin.create({
      full_name:
        profile.displayName || `${profile.familyName} ${profile.givenName}`,
      email: profile.emails[0].value,
      "social.googleProvider": {
        id: profile.id,
        token: accessToken,
      },
    });

    return newAdmin;
  }
  return admin;
};
adminSchema.plugin(URLSlugs("full_name", { field: "provider_url" }));

export default mongoose.model("Admin", adminSchema);
