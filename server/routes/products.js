import { Router } from "express";
import Product from "../models/Product.js";
import Booking from "../models/Booking.js";
import { requireAuth, allowRoles, verifyCsrf } from "../middleware/auth.js";
import { HttpError, asyncHandler, isValidObjectId, pagination } from "../utils/http.js";

const router = Router();
const categories = ["Cameras", "Gaming consoles", "Projectors", "Bikes and scooters", "Electronics", "Other consumer goods"];

function productInput(body) {
  const fields = ["title", "description", "category", "dailyPrice", "securityDeposit", "condition", "location", "images", "availabilityStatus"];
  const input = Object.fromEntries(fields.filter((key) => body[key] !== undefined).map((key) => [key, body[key]]));
  if (input.images !== undefined) {
    if (!Array.isArray(input.images) || input.images.length > 5 || input.images.some((image) => typeof image !== "string" || image.length > 1000)) {
      throw new HttpError(400, "Provide up to five valid image URLs.");
    }
    for (const image of input.images) {
      let url;
      try { url = new URL(image); } catch { throw new HttpError(400, "Each product image must be a valid URL."); }
      if (!["http:", "https:"].includes(url.protocol)) throw new HttpError(400, "Product image URLs must use HTTP or HTTPS.");
    }
  }
  for (const key of ["dailyPrice", "securityDeposit"]) {
    if (input[key] !== undefined && (typeof input[key] !== "number" || !Number.isFinite(input[key]))) {
      throw new HttpError(400, `${key === "dailyPrice" ? "Daily price" : "Security deposit"} must be a number.`);
    }
  }
  return input;
}

router.get("/", asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const filter = { isActive: true };
  if (req.query.category && categories.includes(req.query.category)) filter.category = req.query.category;
  if (req.query.category && !categories.includes(req.query.category)) throw new HttpError(400, "Unknown product category.");
  if (req.query.available === "true") filter.availabilityStatus = "available";
  if (req.query.q) {
    const q = String(req.query.q).trim().slice(0, 100);
    filter.$or = [{ title: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }, { description: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }];
  }
  const min = req.query.minPrice === undefined ? undefined : Number(req.query.minPrice);
  const max = req.query.maxPrice === undefined ? undefined : Number(req.query.maxPrice);
  if ((min !== undefined && (!Number.isFinite(min) || min < 0)) || (max !== undefined && (!Number.isFinite(max) || max < 0))) {
    throw new HttpError(400, "Price filters must be non-negative numbers.");
  }
  if (min !== undefined || max !== undefined) {
    filter.dailyPrice = {};
    if (min !== undefined) filter.dailyPrice.$gte = min;
    if (max !== undefined) filter.dailyPrice.$lte = max;
  }
  const sort = req.query.sort === "price_asc" ? { dailyPrice: 1 } :
    req.query.sort === "price_desc" ? { dailyPrice: -1 } : { createdAt: -1 };
  const [products, total] = await Promise.all([
    Product.find(filter).populate("owner", "name").sort(sort).skip(skip).limit(limit),
    Product.countDocuments(filter)
  ]);
  res.json({ products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw new HttpError(400, "Invalid product id.");
  const product = await Product.findOne({ _id: req.params.id, isActive: true }).populate("owner", "name");
  if (!product) throw new HttpError(404, "Product not found.");
  res.json({ product });
}));

router.post("/", requireAuth, verifyCsrf, allowRoles("provider", "admin"), asyncHandler(async (req, res) => {
  const product = await Product.create({ ...productInput(req.body), owner: req.user.id });
  res.status(201).json({ product });
}));

router.patch("/:id", requireAuth, verifyCsrf, allowRoles("provider", "admin"), asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw new HttpError(400, "Invalid product id.");
  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, "Product not found.");
  if (req.user.role !== "admin" && String(product.owner) !== req.user.id) throw new HttpError(403, "You can only edit your own listings.");
  Object.assign(product, productInput(req.body));
  await product.save();
  res.json({ product });
}));

router.delete("/:id", requireAuth, verifyCsrf, allowRoles("provider", "admin"), asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw new HttpError(400, "Invalid product id.");
  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, "Product not found.");
  if (req.user.role !== "admin" && String(product.owner) !== req.user.id) throw new HttpError(403, "You can only remove your own listings.");
  const hasActiveBookings = await Booking.exists({ product: product.id, status: { $in: ["pending", "confirmed"] } });
  if (hasActiveBookings) throw new HttpError(409, "Resolve pending or confirmed bookings before removing this listing.");
  product.isActive = false;
  await product.save();
  res.json({ message: "Listing removed." });
}));

export default router;
