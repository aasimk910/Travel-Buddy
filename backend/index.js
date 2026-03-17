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
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
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
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. same-origin, mobile, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
}));
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
const expenseRoutes = require("./routes/expenses");
const adminRoutes = require("./routes/admin");
const paymentRoutes = require("./routes/payment");
const roomRoutes = require("./routes/rooms");
const Hike = require("./models/Hike");
const Message = require("./models/Message");
const User = require("./models/User");
const Review = require("./models/Review");
const { authenticateToken } = require("./middleware/auth");
const { uploadBase64Image } = require("./utils/cloudinaryUpload");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/photos", photoRoutes);
app.use("/api/hikes", hikeRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/itinerary", itineraryRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/rooms", roomRoutes);

// GET /api/stats - Public site-wide statistics
app.get("/api/stats", async (req, res) => {
  try {
    const [hikeCount, userCount, trailCount, reviewCount] = await Promise.all([
      Hike.countDocuments(),
      User.countDocuments(),
      Hike.countDocuments({ "startPoint.lat": { $exists: true } }),
      Review.countDocuments(),
    ]);
    res.json({ hikeCount, userCount, trailCount, reviewCount });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: "Unable to fetch stats." });
  }
});

// GET /api/user-trips - Get hikes the user has joined
app.get("/api/user-trips", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find hikes where user is a participant
    const hikes = await Hike.find({
      participants: userId
    }).sort({ date: 1 });
    
    res.json(hikes);
  } catch (err) {
    console.error("Fetch user trips error:", err);
    res.status(500).json({ message: "Unable to fetch user trips." });
  }
});

// GET /api/messages/:hikeId - Get messages for a hike chat room (authenticated)
app.get("/api/messages/:hikeId", authenticateToken, async (req, res) => {
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

  // E2E key exchange: when a user lacks the room key, they broadcast a request
  // to all online peers in the room; any peer that has the key responds directly.
  socket.on('request_room_key', (data) => {
    const { roomId, requesterId, requesterPublicKeyJwk } = data || {};
    if (!roomId || !requesterId) return;
    // Broadcast to all OTHER members in the room (exclude the requester)
    socket.to(roomId).emit('room_key_requested', { roomId, requesterId, requesterPublicKeyJwk });
  });

  // A peer responds with a freshly wrapped copy of the room key for the requester.
  // The payload is addressed by requesterId so only that socket acts on it.
  socket.on('provide_room_key', (data) => {
    const { roomId, recipientId, wrappedKey, iv, senderPublicKeyJwk } = data || {};
    if (!roomId || !recipientId) return;
    // Broadcast into the room; the recipient filters on their own ID.
    io.to(roomId).emit('room_key_provided', { recipientId, wrappedKey, iv, senderPublicKeyJwk });
  });

  socket.on('send_message', async (msg) => {
    if (msg.roomId) {
      try {
        console.log("Received message, has attachment:", !!msg.attachment);
        
        // Save message to database (including attachment if present)
        const messageData = {
          hikeId: msg.roomId,
          senderId: msg.senderId,
          senderName: msg.senderId,
          message: msg.message || "",
        };

        // Upload attachment to Cloudinary if present
        if (msg.attachment && msg.attachment.data) {
          try {
            console.log("Uploading image to Cloudinary...");
            // Upload to Cloudinary
            const uploadResult = await uploadBase64Image(
              msg.attachment.data, 
              'travel-buddy/chat-attachments'
            );
            
            console.log("Image uploaded successfully:", uploadResult.url);
            
            messageData.attachment = {
              name: msg.attachment.name,
              type: msg.attachment.type,
              url: uploadResult.url,
              publicId: uploadResult.publicId,
            };
          } catch (uploadError) {
            console.error("Error uploading attachment to Cloudinary:", uploadError);
            // If upload fails, store base64 as fallback (or skip attachment)
            messageData.attachment = {
              name: msg.attachment.name,
              type: msg.attachment.type,
              url: msg.attachment.data, // Fallback to base64
            };
          }
        }

        const savedMessage = await Message.create(messageData);
        console.log("Message saved with attachment:", !!savedMessage.attachment);
        
        const messageToSend = {
          _id: savedMessage._id,
          roomId: msg.roomId,
          senderId: msg.senderId,
          message: msg.message,
          attachment: savedMessage.attachment,
          createdAt: savedMessage.createdAt,
        };
        
        console.log("Emitting message with attachment:", !!messageToSend.attachment);
        if (messageToSend.attachment) {
          console.log("Attachment URL:", messageToSend.attachment.url);
        }
        
        // Broadcast to all users in the room with the saved message data
        io.to(msg.roomId).emit('receive_message', messageToSend);
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
