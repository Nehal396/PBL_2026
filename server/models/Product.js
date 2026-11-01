import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    description: { type: String, required: true, trim: true, minlength: 20, maxlength: 3000 },
    category: {
      type: String,
      required: true,
      enum: ["Cameras", "Gaming consoles", "Projectors", "Bikes and scooters", "Electronics", "Other consumer goods"],
      index: true
    },
    images: [{ type: String, trim: true, maxlength: 1000 }],
    dailyPrice: { type: Number, required: true, min: 1, max: 1000000 },
    securityDeposit: { type: Number, default: 0, min: 0, max: 10000000 },
    condition: { type: String, enum: ["New", "Like new", "Good", "Fair"], default: "Good" },
    location: { type: String, trim: true, maxlength: 120, default: "" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    availabilityStatus: { type: String, enum: ["available", "unavailable"], default: "available", index: true },
    isActive: { type: Boolean, default: true, index: true },
    bookingVersion: { type: Number, default: 0, select: false }
  },
  { timestamps: true }
);

productSchema.index({ category: 1, dailyPrice: 1, createdAt: -1 });
productSchema.index({ isActive: 1, availabilityStatus: 1, createdAt: -1 });
export default mongoose.model("Product", productSchema);
