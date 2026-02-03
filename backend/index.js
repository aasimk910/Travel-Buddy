// backend/index.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require('http');
const { Server } = require("socket.io");

dotenv.config(); // loads .env from backend folder

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust for production
    methods: ["GET", "POST"]
  }
});

// === Config ===
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is not defined in .env");
  process.exit(1);
}

console.log("🚀 Starting Travel Buddy backend...");

// === Middlewares ===
app.use(cors());
app.use(
  express.json({
    limit: "10mb",
  })
);

// Rate limiting
const { apiLimiter } = require("./middleware/rateLimiter");
app.use("/api/", apiLimiter);

// === Routes ===
app.get("/", (req, res) => {
  res.send("Travel Buddy API is running ✅");
});

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const reviewRoutes = require("./routes/reviews");
const photoRoutes = require("./routes/photos");
const hikeRoutes = require("./routes/hikes");
const tripRoutes = require("./routes/trips");
const itineraryRoutes = require("./routes/itinerary");
const Hike = require("./models/Hike");
const Message = require("./models/Message");
const { authenticateToken } = require("./middleware/auth");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/photos", photoRoutes);
app.use("/api/hikes", hikeRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/itinerary", itineraryRoutes);

// GET /api/user-trips - Get hikes the user has joined
app.get("/api/user-trips", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find hikes where user is either the creator or a participant
    const hikes = await Hike.find({
      $or: [
        { userId: userId },
        { participants: userId }
      ]
    }).sort({ date: 1 });
    
    res.json(hikes);
  } catch (err) {
    console.error("Fetch user trips error:", err);
    res.status(500).json({ message: "Unable to fetch user trips." });
  }
});

// GET /api/messages/:hikeId - Get messages for a hike chat room
app.get("/api/messages/:hikeId", async (req, res) => {
  try {
    const { hikeId } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    
    const messages = await Message.find({ hikeId })
      .sort({ createdAt: 1 })
      .limit(limit);
    
    res.json(messages);
  } catch (err) {
    console.error("Fetch messages error:", err);
    res.status(500).json({ message: "Unable to fetch messages." });
  }
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("💥 Server error:", err);
  res.status(500).json({ error: "Something went wrong on the server" });
});

// === Socket.IO ===
io.on('connection', (socket) => {
  console.log('✅ a user connected');

  socket.on('join_room', (data) => {
    const roomId = typeof data === 'string' ? data : data.roomId;
    if (roomId) {
      socket.join(roomId);
      console.log(`User joined room: ${roomId}`);
    }
  });

  socket.on('leave_room', (data) => {
    const roomId = typeof data === 'string' ? data : data.roomId;
    if (roomId) {
      socket.leave(roomId);
      console.log(`User left room: ${roomId}`);
    }
  });

  socket.on('send_message', async (msg) => {
    if (msg.roomId) {
      try {
        // Save message to database (including attachment if present)
        const messageData = {
          hikeId: msg.roomId,
          senderId: msg.senderId,
          senderName: msg.senderId,
          message: msg.message,
        };

        // Add attachment if present
        if (msg.attachment) {
          messageData.attachment = {
            name: msg.attachment.name,
            type: msg.attachment.type,
            data: msg.attachment.data,
          };
        }

        const savedMessage = await Message.create(messageData);
        
        // Broadcast to all users in the room with the saved message data
        io.to(msg.roomId).emit('receive_message', {
          _id: savedMessage._id,
          roomId: msg.roomId,
          senderId: msg.senderId,
          message: msg.message,
          attachment: savedMessage.attachment,
          createdAt: savedMessage.createdAt,
        });
      } catch (err) {
        console.error("Error saving message:", err);
        // Still broadcast even if save fails
        io.to(msg.roomId).emit('receive_message', msg);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ user disconnected');
  });
});

// === Start server & connect DB ===
async function startServer() {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: "travelbuddy",
    });
    console.log("✅ Connected to MongoDB");

    server.listen(PORT, () => {
      console.log(`✨ Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
