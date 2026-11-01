import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    rentalDays: { type: Number, required: true, min: 1 },
    dailyPriceSnapshot: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 1 },
    securityDeposit: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "rejected", "cancelled", "completed"],
      default: "pending",
      index: true
    },
    paymentStatus: { type: String, enum: ["demo_unpaid", "demo_paid", "refunded"], default: "demo_unpaid" }
  },
  { timestamps: true }
);

bookingSchema.index({ product: 1, status: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ status: 1, createdAt: -1 });
export default mongoose.model("Booking", bookingSchema);
