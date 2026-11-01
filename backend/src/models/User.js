import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      require: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    hashPassword: {
      type: String,
      require: true,
    },
    email: {
      type: String,
      require: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      require: true,
    },
    phone: {
      type: String,
      sparse: true,
    },
    role: {
      type: String,
      require: true,
    },
    avatarUrl: {
      type: String,
    },
    avatarId: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
