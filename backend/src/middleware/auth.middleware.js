import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import User from '../modules/users/user.model.js';

export async function requireAuth(req, res, next) {
  try {
    let token = null;

    // 1. Check httpOnly cookie
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 2. Check Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No session token provided.',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: err.name === 'TokenExpiredError' ? 'Session expired. Please log in again.' : 'Invalid session token.',
      });
    }

    // Lookup user in DB
    const userId = decoded.userId || decoded.id;
    const user = await User.findById(userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or deactivated.',
      });
    }

    // Attach user to request
    req.user = {
      _id: user._id,
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId ? user.organizationId.toString() : null,
    };

    next();
  } catch (err) {
    console.error('[AuthMiddleware] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Authentication service error.',
    });
  }
}

export default requireAuth;

