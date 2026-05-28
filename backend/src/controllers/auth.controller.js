import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma.js";
import logger from "../utils/logger.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        branch: true,
      },
    });

    if (!user) {
      logger.warn("Login failed - user or password is invalid", { email });
      return res.status(401).json({
        message: "Email or password is invalid.",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        message: "This account is not active.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Email or password is invalid.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: "Login success",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({
      message: "Something occurred can't login",
      error: error.message,
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { branch: true },
    });

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({
      message: "Somthing occurred can't get user",
      error: error.message,
    });
  }
};
