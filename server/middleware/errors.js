export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status = error.status ||
    (error.type === "entity.too.large" ? 413 :
      error.type === "entity.parse.failed" || error.name === "ValidationError" || error.name === "CastError" ? 400 :
        error.code === 11000 ? 409 : 500);
  if (status >= 500) console.error(error);
  const message =
    error.type === "entity.too.large" ? "Request body is too large." :
    error.type === "entity.parse.failed" ? "Request body must contain valid JSON." :
    error.code === 11000 ? "An account with this email already exists." :
    error.name === "ValidationError" ? error.message :
    error.name === "CastError" ? "A request field has an invalid value." :
    status >= 500 ? "An unexpected server error occurred." : error.message;
  res.status(status).json({ message });
}
