import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { HttpError, asyncHandler } from "../utils/http.js";

export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.rentix_token;
  if (!token) throw new HttpError(401, "Please sign in to continue.");
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, "Your session has expired. Please sign in again.");
  }
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw new HttpError(401, "This account is unavailable.");
  req.user = user;
  req.csrfToken = payload.csrf;
  next();
});

export function verifyCsrf(req, res, next) {
  if (!req.csrfToken || req.get("X-CSRF-Token") !== req.csrfToken) {
    return next(new HttpError(403, "The request could not be verified. Refresh the page and try again."));
  }
  return next();
}

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new HttpError(403, "You do not have permission to perform this action."));
    }
    return next();
  };
}
