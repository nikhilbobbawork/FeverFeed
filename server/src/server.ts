import express, { type Request, type Response } from "express";
import session from "express-session";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { MongoClient, Db } from "mongodb";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

// Create HTTP server wrapping Express
const httpServer = createServer(app);

// Initialize Socket.io with CORS matching Express
export const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
    credentials: true,
  },
});

// User to Socket Mapping (userId -> socketId)
const activeUsers = new Map<string, string>();

io.on("connection", (socket: Socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Register user socket connection mapping with safe string conversion
  socket.on("register_user", (userId: unknown) => {
    if (!userId) return;
    const cleanUserId = String(userId).trim();
    activeUsers.set(cleanUserId, socket.id);
    console.log(`[Socket] Registered user ${cleanUserId} with socket ${socket.id}`);
  });

  // Handle disconnect cleanup
  socket.on("disconnect", () => {
    for (const [userId, socketId] of activeUsers.entries()) {
      if (socketId === socket.id) {
        activeUsers.delete(userId);
        console.log(`[Socket] Disconnected user ${userId} (socket ${socket.id})`);
        break;
      }
    }
  });
});

// Helper utility to target specific users in controllers
export const sendNotificationToUser = (recipientId: string, notification: Record<string, any>) => {
  const cleanRecipientId = String(recipientId).trim();
  const socketId = activeUsers.get(cleanRecipientId);

  if (socketId) {
    console.log(`[Socket] Emitting 'new_notification' to user ${cleanRecipientId} (socket ${socketId})`);
    io.to(socketId).emit("new_notification", notification);
  } else {
    console.warn(
      `[Socket] Could not send notification. User ${cleanRecipientId} is not in activeUsers map. Active users:`,
      Array.from(activeUsers.keys())
    );
  }
};

// Ensure uploads directory exists on disk
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "feverfeed_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,     // Must be false for local HTTP (true breaks on localhost)
      sameSite: "lax",   // Allows cookie persistence across local ports
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// Serve Static Files
app.use(express.static(path.join(__dirname, "public")));
app.use("/static", express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(uploadsDir));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "FeverFeed";

let client: MongoClient;
let dbInstance: Db;

export async function connectToDatabase(): Promise<Db> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();

    dbInstance = client.db(DB_NAME);
    console.log(`Connected successfully to database: ${DB_NAME}`);

    return dbInstance;
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1);
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  if (client) {
    await client.close();
    console.log("MongoDB connection closed.");
  }
}

// Basic Healthcheck Route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello from the TypeScript MERN backend!");
});

// Server Initialization (Listen on httpServer instead of app)
connectToDatabase()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server due to database connection error:", error);
  });