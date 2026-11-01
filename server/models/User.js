import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["customer", "provider", "admin"], default: "customer", index: true },
    phone: { type: String, trim: true, maxlength: 30, default: "" },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

userSchema.index({ createdAt: -1 });
export default mongoose.model("User", userSchema);
