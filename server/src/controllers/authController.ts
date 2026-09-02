import type { RequestHandler } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "../server.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

interface SignupRequestBody {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

interface LoginRequestBody {
  email?: string;
  password?: string;
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

export const handleSignup: RequestHandler<
  {},
  {},
  SignupRequestBody
> = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required." });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ message: "Passwords do not match." });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const db = await connectToDatabase();
    const usersCollection = db.collection("users");

    const existingUser = await usersCollection.findOne({
      email: normalizedEmail,
    });
    if (existingUser) {
      res.status(409).json({ message: "Email is already in use." });
      return;
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await usersCollection.insertOne({
      email: normalizedEmail,
      password: hashedPassword,
      createdAt: new Date(),
    });

    res.status(201).json({
      message: "User registered successfully!",
      user: {
        id: result.insertedId.toString(),
        email: normalizedEmail,
      },
    });
  } catch (error: unknown) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const handleLogin: RequestHandler<{}, {}, LoginRequestBody> = async (
  req,
  res
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required." });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const db = await connectToDatabase();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }

    const secret = process.env.JWT_SECRET || "fallback_secret";
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email },
      secret,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      ...COOKIE_OPTIONS,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(200).json({
      message: "Login successful!",
      user: { id: user._id.toString(), email: user.email },
    });
  } catch (error: unknown) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const handleLogout: RequestHandler = async (req, res) => {
  try {
    res.clearCookie("token", COOKIE_OPTIONS);
    res.status(200).json({ message: "Logged out successfully." });
  } catch (error: unknown) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const handleGetMe = async (
  req: AuthenticatedRequest,
  res: Parameters<RequestHandler>[1]
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error: unknown) {
    console.error("Error in handleGetMe:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};