import "dotenv/config";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { connectDatabase } from "./config/db.js";
import mongoose from "mongoose";
import User from "./models/User.js";
import Product from "./models/Product.js";

const samples = [
  ["Sony Alpha a6400", "Cameras", 55, 250, "Like new", "Compact mirrorless camera with a sharp 16–50mm lens, ideal for travel and weekend shoots.", "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85"],
  ["Canon EOS 200D II", "Cameras", 42, 200, "Good", "A beginner-friendly DSLR with an 18–55mm lens, crisp autofocus and a fully articulated screen.", "https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&w=1200&q=85"],
  ["PlayStation 5 Slim", "Gaming consoles", 38, 150, "Like new", "PS5 Slim console with one DualSense controller. Great for a game night or a longer stay.", "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1200&q=85"],
  ["Nintendo Switch OLED", "Gaming consoles", 25, 100, "Good", "Portable OLED gaming console with dock, charger and two Joy-Con controllers.", "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=1200&q=85"],
  ["Epson Full HD Projector", "Projectors", 48, 250, "Like new", "Bright 1080p projector with HDMI connectivity. Includes remote and a portable carry case.", "https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=1200&q=85"],
  ["BenQ Portable Projector", "Projectors", 35, 175, "Good", "Easy-to-carry projector for movie nights and presentations, with clear Full HD playback.", "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1200&q=85"],
  ["Trek FX 2 Hybrid Bike", "Bikes and scooters", 30, 100, "Good", "Comfortable hybrid bicycle with an aluminium frame, tuned for city commutes and park trails.", "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=85"],
  ["Ather 450X Electric Scooter", "Bikes and scooters", 70, 500, "Like new", "Electric scooter for local trips. Helmet included; renter must hold a valid driving licence.", "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=85"],
  ["JBL PartyBox Speaker", "Electronics", 28, 125, "Good", "Portable Bluetooth party speaker with punchy sound and a rechargeable battery.", "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1200&q=85"],
  ["Camping Tent for Two", "Other consumer goods", 18, 75, "Good", "Lightweight two-person tent with rainfly, groundsheet and a compact carry bag.", "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1200&q=85"]
];

try {
  await connectDatabase();
  let provider = await User.findOne({ email: "sample-provider@rentix.local" });
  if (!provider) {
    provider = await User.create({
      name: "Rentix Community",
      email: "sample-provider@rentix.local",
      passwordHash: await bcrypt.hash(randomUUID(), 12),
      role: "provider"
    });
  }
  for (const [title, category, dailyPrice, securityDeposit, condition, description, image] of samples) {
    await Product.updateOne(
      { title, owner: provider.id },
      { $setOnInsert: { title, category, dailyPrice, securityDeposit, condition, description, images: [image], owner: provider.id, location: "Bengaluru" } },
      { upsert: true }
    );
  }
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    if (process.env.ADMIN_PASSWORD.length < 12 || Buffer.byteLength(process.env.ADMIN_PASSWORD, "utf8") > 72) {
      throw new Error("ADMIN_PASSWORD must be at least 12 characters and no more than 72 UTF-8 bytes.");
    }
    const email = process.env.ADMIN_EMAIL.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    await User.findOneAndUpdate(
      { email },
      { $set: { name: "Rentix Administrator", email, passwordHash, role: "admin", isActive: true } },
      { upsert: true, new: true, runValidators: true }
    );
    console.info(`Admin account provisioned for ${email}.`);
  }
  console.info("Sample products are ready.");
} finally {
  await mongoose.disconnect();
}
