// src/seeds/seed.ts
import mongoose from "mongoose";
// import { UserModel } from "../models/User";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/backend-api";

async function seed() {
  await mongoose.connect(MONGO_URI);
//   const exist = await UserModel.findOne({ username: "admin" });
//   if (!exist) {
//     await UserModel.create({
//       username: "admin",
//       password: "...",
//       role: "admin",
//     });
//     console.log("Seeded admin user.");
//   }
  mongoose.disconnect();
}

seed();
