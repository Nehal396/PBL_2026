import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import rateLimit from "express-rate-limit";
import User from "../models/User.js";
import { requireAuth, verifyCsrf } from "../middleware/auth.js";
import { HttpError, asyncHandler } from "../utils/http.js";

const router = Router();
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many sign-in attempts. Try again in 15 minutes." }
});

function setSessionCookie(res, userId) {
  const csrf = randomBytes(32).toString("hex");
  const token = jwt.sign({ sub: userId, csrf }, process.env.JWT_SECRET, { expiresIn: "2h" });
  res.cookie("rentix_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 2 * 60 * 60 * 1000
  });
  return csrf;
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone };
}

router.post("/register", authLimit, asyncHandler(async (req, res) => {
  const { name, email, password, role = "customer", phone = "" } = req.body;
  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80) {
    throw new HttpError(400, "Name must be between 2 and 80 characters.");
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new HttpError(400, "Enter a valid email address.");
  }
  if (typeof password !== "string" || password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    throw new HttpError(400, "Password must be at least 8 characters and no more than 72 UTF-8 bytes.");
  }
  if (!["customer", "provider"].includes(role)) throw new HttpError(400, "Choose a customer or provider account.");
  if (typeof phone !== "string" || phone.length > 30) throw new HttpError(400, "Phone number cannot exceed 30 characters.");
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), passwordHash, role, phone });
  const csrf = setSessionCookie(res, user.id);
  res.status(201).json({ user: publicUser(user), csrf });
}));

router.post("/login", authLimit, asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (typeof password !== "string" || Buffer.byteLength(password, "utf8") > 72) {
    throw new HttpError(401, "Email or password is incorrect.");
  }
  const user = await User.findOne({ email: String(email || "").toLowerCase().trim() }).select("+passwordHash");
  if (!user || !user.isActive || !(await bcrypt.compare(String(password || ""), user.passwordHash))) {
    throw new HttpError(401, "Email or password is incorrect.");
  }
  const csrf = setSessionCookie(res, user.id);
  res.json({ user: publicUser(user), csrf });
}));

router.post("/logout", requireAuth, verifyCsrf, (req, res) => {
  res.clearCookie("rentix_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
  });
  res.json({ message: "Signed out." });
});

router.get("/me", requireAuth, (req, res) => res.json({ user: publicUser(req.user), csrf: req.csrfToken }));
router.patch("/me", requireAuth, verifyCsrf, asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  if (name !== undefined && (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80)) {
    throw new HttpError(400, "Name must be between 2 and 80 characters.");
  }
  if (phone !== undefined && (typeof phone !== "string" || phone.length > 30)) {
    throw new HttpError(400, "Phone number cannot exceed 30 characters.");
  }
  if (name !== undefined) req.user.name = name.trim();
  if (phone !== undefined) req.user.phone = phone.trim();
  await req.user.save();
  res.json({ user: publicUser(req.user), csrf: req.csrfToken });
}));

export default router;
