import jwt from 'jsonwebtoken';
import User from '../users/user.model.js';
import Organization from '../organizations/organization.model.js';
import env from '../../config/env.js';

export class AuthService {
  generateToken(user) {
    return jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        organizationId: user.organizationId ? user.organizationId.toString() : null,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );
  }

  async register({ email, password, name, organizationName, role = 'user' }) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new Error('User already exists with this email address');
    }

    let organizationId = null;
    if (organizationName) {
      const orgSlug = organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      let org = await Organization.findOne({ slug: orgSlug });
      if (!org) {
        org = await Organization.create({ name: organizationName, slug: orgSlug });
      }
      organizationId = org._id;
    }

    const user = new User({
      email,
      passwordHash: password, // Pre-save hook hashes with bcrypt
      name,
      organizationId,
      role,
    });

    await user.save();
    const token = this.generateToken(user);
    return { user: user.toPublic(), token };
  }

  async login({ email, password }) {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account has been deactivated');
    }

    const token = this.generateToken(user);
    return { user: user.toPublic(), token };
  }

  async seedDefaultUsers() {
    // Create demo organization
    let org = await Organization.findOne({ slug: 'acme-corp' });
    if (!org) {
      org = await Organization.create({
        name: 'Acme Corporation',
        slug: 'acme-corp',
      });
    }

    // Create demo user
    let user = await User.findOne({ email: 'user@acme.com' });
    if (!user) {
      user = new User({
        email: 'user@acme.com',
        passwordHash: 'Password123!',
        name: 'Jane Doe',
        organizationId: org._id,
        role: 'user',
      });
      await user.save();
    }

    // Create demo admin
    let admin = await User.findOne({ email: 'admin@acme.com' });
    if (!admin) {
      admin = new User({
        email: 'admin@acme.com',
        passwordHash: 'Admin123!',
        name: 'Alex Admin',
        organizationId: org._id,
        role: 'admin',
      });
      await admin.save();
    }

    return {
      organization: org,
      user: user.toPublic(),
      admin: admin.toPublic(),
    };
  }
}

const authService = new AuthService();
export default authService;

