import jwt from "jsonwebtoken";
import RefreshToken from "./models/RefreshToken";
import express from "express";
import { body, validationResult } from "express-validator";

export function AuthenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  //debug
  console.log("TOKEN: ", token);

  if (token == null) return res.sendStatus(401); // No token

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log("JWT VERIFY ERROR: ", err);
      return res.sendStatus(403); // Invalid token
    }
    console.log("JWT VERIFY USER: ", user);
    req.user = user;
    next();
  });
}

export async function CreateRefreshToken(user) {
  // Remove existing refresh tokens for this user
  await RefreshToken.deleteMany({ user: user.id });

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  await RefreshToken.create({
    user: user.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  return refreshToken;
}

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
}

export const userLoginValidation = [
  body("username")
    .trim()
    .isString()
    .withMessage("Username must be a string")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),

  body("password").isString().withMessage("Password must be a string"),

  validateRequest,
];

export const refreshTokenValidation = [
  body("refreshToken").isString().withMessage("Refresh token must be a string"),

  validateRequest,
];

export const packageUpdateValidation = [
  body("packageID").isUUID().withMessage("Invalid package ID format"),

  body("isDelivered")
    .isBoolean()
    .withMessage("Delivery status must be a boolean"),

  validateRequest,
];
