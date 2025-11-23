const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const { generateToken } = require('../utils/jwt');
const { isValidEmail, isStrongPassword, sanitizeName, isValidPhone } = require('../utils/validation');

const signup = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const safeFirstName = sanitizeName(firstName);
    const safeLastName = sanitizeName(lastName);
    const normalizedPhone = typeof phone === 'string' ? phone.trim() : '';

    // Validate input
    if (!normalizedEmail || !password || !safeFirstName || !safeLastName || !normalizedPhone) {
      return res.status(400).json({
        error: 'All fields are required: email, password, firstName, lastName, phone'
      });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        error: 'Please provide a valid email address'
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters and include upper, lower, number, and special character'
      });
    }

    if (!isValidPhone(normalizedPhone)) {
      return res.status(400).json({
        error: 'Please provide a valid phone number with country code'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User with this email already exists'
      });
    }

    const existingPhoneUser = await prisma.user.findUnique({
      where: { phone: normalizedPhone }
    });

    if (existingPhoneUser) {
      return res.status(409).json({
        error: 'User with this phone number already exists'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        firstName: safeFirstName,
        lastName: safeLastName,
        phone: normalizedPhone
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true
      }
    });

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    res.status(201).json({
      message: 'User created successfully',
      user,
      token
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      error: 'Internal server error during signup'
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    // Validate input
    if (!normalizedEmail || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        error: 'Please provide a valid email address'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Update last login timestamp
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    // Return user data (excluding password)
    const userData = {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phone: updatedUser.phone,
      createdAt: updatedUser.createdAt,
      lastLogin: updatedUser.lastLogin
    };

    res.json({
      message: 'Login successful',
      user: userData,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error during login'
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
        profile: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

const checkProfileStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    const hasProfile = Boolean(profile);

    res.json({
      hasProfile,
      profileComplete: hasProfile
    });
  } catch (error) {
    console.error('Check profile status error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

const updateAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email } = req.body;

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        error: 'Please provide a valid email address'
      });
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser && existingUser.id !== userId) {
      return res.status(409).json({
        error: 'This email is already in use'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true
      }
    });

    res.json({
      message: 'Account updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Current password and new password are required'
      });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        error: 'New password must be at least 8 characters and include upper, lower, number, and special character'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const isValidPassword = await comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Incorrect current password'
      });
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

module.exports = {
  signup,
  login,
  getProfile,
  checkProfileStatus,
  updateAccount,
  changePassword
};
