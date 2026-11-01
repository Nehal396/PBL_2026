import { Router } from "express";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import Booking from "../models/Booking.js";
import { requireAuth, allowRoles, verifyCsrf } from "../middleware/auth.js";
import { HttpError, asyncHandler, isValidObjectId, pagination } from "../utils/http.js";

const router = Router();
router.use(requireAuth, allowRoles("provider", "admin"));

router.get("/products", asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const filter = req.user.role === "admin" ? {} : { owner: req.user.id };
  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filter)
  ]);
  res.json({ products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}));

router.get("/bookings", asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const ownerProducts = await Product.find(req.user.role === "admin" ? {} : { owner: req.user.id }).select("_id");
  const filter = { product: { $in: ownerProducts.map((item) => item.id) } };
  const [bookings, total] = await Promise.all([
    Booking.find(filter).populate("product", "title images").populate("customer", "name email").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Booking.countDocuments(filter)
  ]);
  res.json({ bookings, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}));

router.patch("/bookings/:id/status", verifyCsrf, asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!isValidObjectId(req.params.id)) throw new HttpError(400, "Invalid booking id.");
  if (!["confirmed", "rejected"].includes(status)) throw new HttpError(400, "Choose confirmed or rejected.");

  const session = await mongoose.startSession();
  let updated;
  try {
    await session.withTransaction(async () => {
      const booking = await Booking.findById(req.params.id).session(session);
      if (!booking) throw new HttpError(404, "Booking not found.");
      const product = await Product.findById(booking.product).session(session);
      if (!product || (req.user.role !== "admin" && String(product.owner) !== req.user.id)) {
        throw new HttpError(403, "You cannot manage this booking.");
      }
      if (booking.status !== "pending") throw new HttpError(409, "Only pending bookings can be updated.");

      if (status === "confirmed") {
        if (!product.isActive || product.availabilityStatus !== "available") throw new HttpError(409, "This listing is unavailable.");
        await Product.findOneAndUpdate(
          { _id: product.id },
          { $inc: { bookingVersion: 1 } },
          { session, new: true }
        );
        const conflict = await Booking.exists({
          _id: { $ne: booking.id },
          product: product.id,
          status: "confirmed",
          startDate: { $lt: booking.endDate },
          endDate: { $gt: booking.startDate }
        }).session(session);
        if (conflict) throw new HttpError(409, "Another confirmed rental overlaps these dates.");
      }
      booking.status = status;
      await booking.save({ session });
      updated = booking;
    });
  } finally {
    await session.endSession();
  }
  res.json({ booking: updated });
}));

export default router;
