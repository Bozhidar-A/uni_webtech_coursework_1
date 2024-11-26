import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./models/User";
import dotenv from "dotenv";
import connectDB from "./db";
import Package from "./models/Package";
import uuid4 from "uuid4";
import {
  AuthenticateToken,
  CreateRefreshToken,
  packageUpdateValidation,
  refreshTokenValidation,
  userLoginValidation,
} from "./util";
import RefreshToken from "./models/RefreshToken";

const routes = {
  root: "/",
  login: "/login",
  refreshToken: "/refresh-token",
  packages: "/packages",
  packageDeliveryStatusUpdate: "/packages/update-delivery-status",
};

dotenv.config();

connectDB();

const app = express();
app.use(express.json()); // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies

app.get(routes.root, (req, res) => {
  res.send("API Online");
});

app.post(routes.login, userLoginValidation, async (req, res) => {
  try {
    //destrcut user
    const { username, password } = req.body;

    //exists?
    const user = await User.findOne({
      username: username,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    //is pass valid?
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    //generate token
    const accessToken = jwt.sign(
      {
        username,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
      }
    );

    const refreshToken = await CreateRefreshToken(user);

    res.status(200).json({
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  } catch (error) {
    console.log("INTERNAL SERVER ERROR: ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post(routes.refreshToken, refreshTokenValidation, async (req, res) => {
  const { refreshToken } = req.body;

  try {
    //verify token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    //token exists?
    const storedToken = await RefreshToken.findOne({
      token: refreshToken,
      user: decoded.id,
    });

    if (!storedToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    //token expired?
    if (storedToken.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ _id: storedToken._id });
      return res.status(403).json({ message: "Refresh token expired" });
    }

    //find user
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(403).json({ message: "User not found" });
    }

    //gen new token
    const newAccessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const newRefreshToken = await CreateRefreshToken(user);
    // Optional: Generate new refresh token for additional security

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }
});

app.get(routes.packages, AuthenticateToken, async (req, res) => {
  try {
    const packages = await Package.find();

    res.status(200).json(packages);
  } catch (error) {
    console.log("INTERNAL SERVER ERROR: ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post(
  routes.packageDeliveryStatusUpdate,
  AuthenticateToken,
  packageUpdateValidation,
  async (req, res) => {
    try {
      //destruct data
      const { packageID, isDelivered } = req.body;

      //does package exist?
      const workedPackage = await Package.findOne({
        id: packageID,
      });

      if (!workedPackage) {
        return res.status(404).json({ message: "Package not found" });
      }

      //update package
      const requestStatus = await Package.updateOne(
        { id: packageID },
        { $set: { isDelivered } }
      );

      if (requestStatus.matchedCount === 0) {
        console.log("This was already checked? WHAT?!?!?");
        return res.status(404).json({ message: "Package not found" });
      }

      if (requestStatus.modifiedCount === 0) {
        return res.status(500).json({ message: "Failed to update package" });
      }

      res.status(200).json({ message: "Package updated" });
    } catch (error) {
      console.log("INTERNAL SERVER ERROR: ", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

app.listen(process.env.EXPRESS_PORT || 3000, async () => {
  console.log(
    `Server is running on port ${process.env.EXPRESS_PORT} with backup 3000`
  );

  //seed setup
  //project doesnt require user signup
  //so we will create a default user
  //with username: admin and password: admin

  //does user exist?
  const defaultUser = await User.findOne({
    username: "admin",
  });

  if (!defaultUser) {
    //hash password
    const hashedPassword = await bcrypt.hash("admin", 12);

    //create user
    await User.create({
      username: "admin",
      password: hashedPassword,
    });

    console.log("Default user created");
  } else {
    console.log("Default user already exists");
  }

  //in the same way we will create some default packages
  //the project does not require package creation, but needs some packages to work with

  //does packages exist?
  const packages = await Package.find();

  if (packages.length === 0) {
    //create packages
    await Package.create([
      {
        id: uuid4(),
        recipientName: "Pesho",
        address: "Ruse, Bulgaria",
        deliveryPrice: 20,
        isDelivered: false,
      },
      {
        id: uuid4(),
        recipientName: "KrisiPisi",
        address: "Varna, Bulgaria",
        deliveryPrice: 30,
        isDelivered: true,
      },
      {
        id: uuid4(),
        recipientName: "Boiko",
        address: "Kurdgali, Bulgaria",
        deliveryPrice: 40,
        isDelivered: false,
      },
      {
        id: uuid4(),
        recipientName: "Bogko",
        address: "Pleven, Bulgaria",
        deliveryPrice: 50,
        isDelivered: false,
      },
    ]);

    console.log("Default packages created");
  } else {
    console.log("Default packages already exist");
  }
});