import { Router } from "express";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Booking from "../models/Booking.js";
import { requireAuth, allowRoles, verifyCsrf } from "../middleware/auth.js";
import { HttpError, asyncHandler, isValidObjectId, pagination } from "../utils/http.js";

const router = Router();
router.use(requireAuth, allowRoles("admin"));

router.get("/stats", asyncHandler(async (req, res) => {
  const [users, products, bookings, statusCounts] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Booking.countDocuments(),
    Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
  ]);
  res.json({ stats: { users, products, bookings, bookingStatuses: Object.fromEntries(statusCounts.map(({ _id, count }) => [_id, count])) } });
}));

router.get("/users", asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const [users, total] = await Promise.all([
    User.find().select("-passwordHash").sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments()
  ]);
  res.json({ users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}));

router.patch("/users/:id/status", verifyCsrf, asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw new HttpError(400, "Invalid user id.");
  if (typeof req.body.isActive !== "boolean") throw new HttpError(400, "Provide an active status.");
  if (req.params.id === req.user.id && !req.body.isActive) throw new HttpError(400, "You cannot deactivate your own account.");
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true }).select("-passwordHash");
  if (!user) throw new HttpError(404, "User not found.");
  res.json({ user });
}));

router.get("/products", asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const [products, total] = await Promise.all([
    Product.find().populate("owner", "name email").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments()
  ]);
  res.json({ products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}));

router.patch("/products/:id/status", verifyCsrf, asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw new HttpError(400, "Invalid product id.");
  if (typeof req.body.isActive !== "boolean") throw new HttpError(400, "Provide an active status.");
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true });
  if (!product) throw new HttpError(404, "Product not found.");
  res.json({ product });
}));

export default router;
