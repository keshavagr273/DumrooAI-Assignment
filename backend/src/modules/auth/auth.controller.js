import authService from './auth.service.js';
import env from '../../config/env.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: env.JWT_COOKIE_MAX_AGE_MS || 7 * 24 * 60 * 60 * 1000,
};

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const { user, token } = await authService.login({ email, password });
    res.cookie('token', token, COOKIE_OPTIONS);

    return res.json({
      success: true,
      message: 'Login successful',
      data: { user, token },
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: err.message });
  }
}

export async function register(req, res, next) {
  try {
    const { email, password, name, organizationName, role } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'Email, password, and name are required' });
    }

    const { user, token } = await authService.register({
      email,
      password,
      name,
      organizationName,
      role: role === 'admin' ? 'admin' : 'user',
    });

    res.cookie('token', token, COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user, token },
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function getMe(req, res) {
  return res.json({
    success: true,
    data: { user: req.user },
  });
}

export async function logout(req, res) {
  res.clearCookie('token');
  return res.json({
    success: true,
    message: 'Logged out successfully',
  });
}

export async function seed(req, res, next) {
  try {
    const result = await authService.seedDefaultUsers();
    return res.json({
      success: true,
      message: 'Default users seeded successfully (user@acme.com / Password123!, admin@acme.com / Admin123!)',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
