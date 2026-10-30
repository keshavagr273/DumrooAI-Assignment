export function requireIdempotencyKey(req, res, next) {
  const idempotencyKey =
    req.headers['idempotency-key'] ||
    req.headers['Idempotency-Key'] ||
    req.body.idempotencyKey;

  if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.trim().length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Idempotency-Key header is required (valid unique identifier string, min 8 characters).',
    });
  }

  req.idempotencyKey = idempotencyKey.trim();
  next();
}

export default requireIdempotencyKey;
