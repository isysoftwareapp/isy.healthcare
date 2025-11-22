/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from "express";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongodb:27017/retail";
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

app.use(cors());
app.use(express.json());

let db: any;
let client: MongoClient;

// Connect to MongoDB
const connectDB = async () => {
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db('retail');
    console.log("✅ Connected to MongoDB (Retail Database)");

    // Create default admin user if not exists
    const admins = db.collection("admins");
    const existingAdmin = await admins.findOne({ username: "admin" });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await admins.insertOne({
        username: "admin",
        password: hashedPassword,
        createdAt: new Date(),
      });
      console.log(
        "✅ Default admin user created (username: admin, password: admin123)"
      );
    }

    // Create default content if not exists
    const contents = db.collection("contents");
    const existingContent = await contents.findOne({ type: "site" });

    if (!existingContent) {
      await contents.insertOne({
        type: "site",
        content: getDefaultContent(),
        updatedAt: new Date(),
      });
      console.log("✅ Default site content created");
    }
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

// Routes
app.get("/api/test", (req: Request, res: Response) => {
  res.json({ message: "API is working" });
});

app.post("/api/auth", async (req: Request, res: Response) => {
  console.log("🔐 Auth request received");
  console.log("Request body:", req.body);
  console.log("Request headers:", req.headers);

  try {
    const { username, password } = req.body;

    console.log("Username:", username, "Password length:", password ? password.length : 0);

    const admins = db.collection("admins");
    const admin = await admins.findOne({ username });

    if (!admin) {
      console.log("❌ Admin not found for username:", username);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, admin.password);

    if (!validPassword) {
      console.log("❌ Invalid password for username:", username);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ username: admin.username }, JWT_SECRET, {
      expiresIn: "24h",
    });

    console.log("✅ Auth successful for username:", username);
    res.json({ token, username: admin.username });
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
});

app.get("/api/content", async (req: Request, res: Response) => {
  try {
    const contents = db.collection("contents");
    const siteContent = await contents.findOne({ type: "site" });

    if (!siteContent) {
      return res.status(404).json({ error: "Content not found" });
    }

    res.json({ content: siteContent.content });
  } catch (error) {
    console.error("Fetch content error:", error);
    res.status(500).json({ error: "Failed to fetch content" });
  }
});

app.post("/api/content", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const contents = db.collection("contents");
    await contents.updateOne(
      { type: "site" },
      {
        $set: {
          content,
          updatedAt: new Date(),
          updatedBy: req.user.username,
        },
      },
      { upsert: true }
    );

    res.json({ success: true, message: "Content saved successfully" });
  } catch (error) {
    console.error("Save content error:", error);
    res.status(500).json({ error: "Failed to save content" });
  }
});

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Retail API Server running on port ${PORT}`);
  });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n⏳ Shutting down gracefully...");
  if (client) {
    await client.close();
    console.log("✅ MongoDB connection closed");
  }
  process.exit(0);
});

// Default content structure
function getDefaultContent() {
  return {
    hero: {
      badge: "Transform Your Business",
      titleLine1: "Modern POS & Kiosk",
      titleLine2: "Solutions",
      subtitle:
        "Streamline operations, boost sales, and deliver exceptional customer experiences with our cutting-edge technology.",
    },
    images: {
      logo: null,
      heroDashboard:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2370&auto=format&fit=crop",
      backgroundImage: null,
    },
    ecosystem: [
      {
        id: "eco-1",
        title: "Point of Sale",
        description:
          "Lightning-fast checkout with real-time inventory sync and payment processing.",
        icon: "Monitor",
        bgClass: "bg-blue-50",
      },
      {
        id: "eco-2",
        title: "Self-Service Kiosk",
        description:
          "Empower customers with intuitive ordering kiosks that reduce wait times.",
        icon: "Smartphone",
        bgClass: "bg-purple-50",
      },
      {
        id: "eco-3",
        title: "Analytics Dashboard",
        description:
          "Make data-driven decisions with comprehensive sales and performance insights.",
        icon: "LayoutGrid",
        bgClass: "bg-green-50",
      },
    ],
    features: [
      {
        id: "feat-1",
        tagline: "Seamless Integration",
        title: "All-in-One Platform",
        description:
          "Connect your entire business ecosystem with our unified platform that integrates POS, inventory, and customer management.",
        bullets: [
          "Real-time inventory synchronization",
          "Cloud-based data access anywhere",
          "Multi-location support",
          "Third-party integrations",
        ],
        image:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2370&auto=format&fit=crop",
        layout: "left",
        visualType: "image",
      },
    ],
    hardware: {
      title: "Complete Hardware Solutions",
      subtitle:
        "We provide enterprise-grade hardware designed for reliability and performance in demanding retail environments.",
      items: [
        {
          title: "POS Terminals",
          description:
            "High-performance touchscreen terminals with built-in payment processing.",
          icon: "Monitor",
        },
        {
          title: "Self-Service Kiosks",
          description:
            "Durable, user-friendly kiosks with customizable interfaces.",
          icon: "Smartphone",
        },
      ],
    },
    products: [
      {
        id: "p-1",
        category: "kiosk",
        name: "Premium Kiosk Pro",
        description:
          "Professional-grade self-service kiosk with advanced features.",
        image:
          "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=2000&auto=format&fit=crop",
        specs: [
          "24-inch touchscreen display",
          "Built-in printer and scanner",
          "Payment terminal integration",
          "Customizable branding",
        ],
        pricePurchase: "89000",
        priceRent: "3500",
      },
    ],
    pricing: [
      {
        name: "Starter",
        price: "2999",
        period: "/month",
        description: "Perfect for small businesses getting started.",
        features: [
          "1 POS terminal",
          "Basic analytics",
          "Email support",
          "Cloud storage",
        ],
      },
      {
        name: "Professional",
        price: "5999",
        period: "/month",
        description: "Ideal for growing businesses.",
        features: [
          "Up to 5 POS terminals",
          "Advanced analytics",
          "Priority support",
          "Multi-location support",
          "Custom integrations",
        ],
      },
      {
        name: "Enterprise",
        price: "Custom",
        period: "",
        description: "Tailored solutions for large operations.",
        features: [
          "Unlimited terminals",
          "Dedicated support",
          "Custom development",
          "White-label options",
          "SLA guarantee",
        ],
      },
    ],
    contact: {
      email: "info@isy.software",
      phone: "+66 813 392 9976",
    },
  };
}
