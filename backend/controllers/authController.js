const crypto = require('crypto');
const prisma = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const { generateToken } = require('../utils/jwt');
const { isValidEmail, isStrongPassword, sanitizeName, isValidPhone } = require('../utils/validation');
const { sendPasswordResetEmail } = require('../utils/emailService');

const RESET_TOKEN_EXPIRY_MINUTES = parseInt(process.env.RESET_TOKEN_EXPIRY_MINUTES || '60', 10);
const APP_BASE_URL = (process.env.APP_BASE_URL || process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

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
    const { email, firstName, lastName } = req.body;

    const updateData = {};

    // Validate and add email if provided
    if (email !== undefined) {
      const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

      if (!normalizedEmail) {
        return res.status(400).json({
          error: 'Email cannot be empty'
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

      updateData.email = normalizedEmail;
    }

    // Validate and add firstName if provided
    if (firstName !== undefined) {
      const safeFirstName = sanitizeName(firstName);
      if (!safeFirstName) {
        return res.status(400).json({
          error: 'First name cannot be empty'
        });
      }
      updateData.firstName = safeFirstName;
    }

    // Validate and add lastName if provided
    if (lastName !== undefined) {
      const safeLastName = sanitizeName(lastName);
      if (!safeLastName) {
        return res.status(400).json({
          error: 'Last name cannot be empty'
        });
      }
      updateData.lastName = safeLastName;
    }

    // Validate and add phone if provided
    if (req.body.phone !== undefined) {
      const normalizedPhone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
      if (!normalizedPhone) {
        return res.status(400).json({
          error: 'Phone number cannot be empty'
        });
      }
      if (!isValidPhone(normalizedPhone)) {
        return res.status(400).json({
          error: 'Please provide a valid phone number with country code'
        });
      }
      updateData.phone = normalizedPhone;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'No fields to update'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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

const requestPasswordReset = async (req, res) => {
  try {
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

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, firstName: true }
    });

    if (!user) {
      return res.json({
        message: 'If this email exists in our system, a reset link has been sent.'
      });
    }

    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true }
    });

    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt
      }
    });

    const resetLink = `${APP_BASE_URL}/reset-password?token=${plainToken}`;

    await sendPasswordResetEmail({
      to: user.email,
      resetLink,
      firstName: user.firstName
    });

    res.json({
      message: 'If this email exists in our system, a reset link has been sent.'
    });
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({
      error: 'Unable to process password reset request'
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Token and new password are required'
      });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        error: 'New password must be at least 8 characters and include upper, lower, number, and special character'
      });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const existingToken = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!existingToken) {
      return res.status(400).json({
        error: 'This reset link is invalid or has expired'
      });
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: existingToken.userId },
        data: { password: hashedPassword }
      }),
      prisma.passwordResetToken.update({
        where: { id: existingToken.id },
        data: { used: true }
      }),
      prisma.passwordResetToken.updateMany({
        where: {
          userId: existingToken.userId,
          used: false
        },
        data: { used: true }
      })
    ]);

    res.json({
      message: 'Password reset successfully. You can now sign in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'Unable to reset password'
    });
  }
};

module.exports = {
  signup,
  login,
  getProfile,
  checkProfileStatus,
  updateAccount,
  changePassword,
  requestPasswordReset,
  resetPassword
};
