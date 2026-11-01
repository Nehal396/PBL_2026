import { Router } from "express";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Product from "../models/Product.js";
import { requireAuth, allowRoles, verifyCsrf } from "../middleware/auth.js";
import { HttpError, asyncHandler, isValidObjectId, pagination } from "../utils/http.js";
import { getRentalDays, parseDateOnly } from "../utils/rentalDates.js";

const router = Router();

router.post("/", requireAuth, verifyCsrf, allowRoles("customer"), asyncHandler(async (req, res) => {
  const productId = String(req.body.productId || "");
  if (!isValidObjectId(productId)) throw new HttpError(400, "Choose a valid product.");
  const startDate = parseDateOnly(req.body.startDate);
  const endDate = parseDateOnly(req.body.endDate);
  const rentalDays = startDate && endDate ? getRentalDays(startDate, endDate) : null;
  if (!rentalDays) throw new HttpError(400, "Choose a valid start date and a later return date.");
  if (rentalDays > 365) throw new HttpError(400, "A rental request cannot exceed 365 days.");
  if (startDate < new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z")) {
    throw new HttpError(400, "Rental start date cannot be in the past.");
  }
  const product = await Product.findOne({ _id: productId, isActive: true, availabilityStatus: "available" });
  if (!product) throw new HttpError(404, "This listing is not currently available.");
  if (String(product.owner) === req.user.id) throw new HttpError(400, "You cannot request a rental for your own listing.");
  const conflict = await Booking.exists({
    product: product.id,
    status: "confirmed",
    startDate: { $lt: endDate },
    endDate: { $gt: startDate }
  });
  if (conflict) throw new HttpError(409, "Those dates overlap an existing confirmed rental.");
  const subtotal = product.dailyPrice * rentalDays;
  const booking = await Booking.create({
    customer: req.user.id,
    product: product.id,
    startDate,
    endDate,
    rentalDays,
    dailyPriceSnapshot: product.dailyPrice,
    subtotal,
    securityDeposit: product.securityDeposit,
    totalAmount: subtotal + product.securityDeposit
  });
  res.status(201).json({ booking });
}));

router.get("/my", requireAuth, asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const [bookings, total] = await Promise.all([
    Booking.find({ customer: req.user.id }).populate("product", "title images category location owner").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Booking.countDocuments({ customer: req.user.id })
  ]);
  res.json({ bookings, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}));

router.patch("/:id/cancel", requireAuth, verifyCsrf, asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw new HttpError(400, "Invalid booking id.");
  const booking = await Booking.findOne({ _id: req.params.id, customer: req.user.id });
  if (!booking) throw new HttpError(404, "Booking not found.");
  const canCancel = booking.status === "pending" ||
    (booking.status === "confirmed" && booking.startDate.getTime() - Date.now() >= 24 * 60 * 60 * 1000);
  if (!canCancel) throw new HttpError(409, "This booking can no longer be cancelled online.");
  booking.status = "cancelled";
  await booking.save();
  res.json({ booking });
}));

router.get("/:id", requireAuth, asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw new HttpError(400, "Invalid booking id.");
  const booking = await Booking.findById(req.params.id).populate("product", "title images category location owner").populate("customer", "name email");
  if (!booking) throw new HttpError(404, "Booking not found.");
  const isOwner = booking.customer.id === req.user.id;
  const productOwner = booking.product && String(booking.product.owner) === req.user.id;
  if (!isOwner && !productOwner && req.user.role !== "admin") throw new HttpError(403, "You do not have access to this booking.");
  res.json({ booking });
}));

export default router;
