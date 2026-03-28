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
const isProduction = process.env.NODE_ENV === "production";

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5000",
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

// === Config ===
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is not defined in .env");
  process.exit(1);
}

console.log("🚀 Starting Travel Buddy backend...");

// === Middlewares ===
// Trust the first proxy (needed for rate limiting behind load balancers/nginx)
app.set('trust proxy', 1);
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. same-origin, mobile, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
// Handle preflight requests for all routes
app.options("*", cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
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
const hotelRoutes = require("./routes/hotels");
const bookingRoutes = require("./routes/bookings");
const khaltiPaymentRoutes = require("./routes/khalti-payments");
const Hike = require("./models/Hike");
const Message = require("./models/Message");
const User = require("./models/User");
const Review = require("./models/Review");
const Photo = require("./models/Photo");
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
app.use("/api/payments", khaltiPaymentRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/bookings", bookingRoutes);

// GET /api/stats - Public site-wide statistics
app.get("/api/stats", async (req, res) => {
  try {
    const now = new Date();
    const [hikeCount, userCount, photoCount, upcomingHikes] = await Promise.all([
      Hike.countDocuments(),
      User.countDocuments(),
      Photo.countDocuments(),
      Hike.countDocuments({ date: { $gte: now } }),
    ]);
    res.json({ hikeCount, userCount, photoCount, upcomingHikes });
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
// Supports cursor-based pagination: pass ?before=<messageId>&limit=<n>
app.get("/api/messages/:hikeId", authenticateToken, async (req, res) => {
  try {
    const { hikeId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const before = req.query.before; // message _id cursor — fetch messages older than this

    if (before && !mongoose.Types.ObjectId.isValid(before)) {
      return res.status(400).json({ message: "Invalid cursor value." });
    }

    const query = { hikeId };
    if (before) {
      query._id = { $lt: before };
    }

    const messages = await Message.find(query)
      .sort({ _id: -1 })
      .limit(limit);

    // Return in ascending order so the client renders oldest-first
    messages.reverse();

    res.json({
      messages,
      hasMore: messages.length === limit,
    });
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
const jwt = require('jsonwebtoken');
const JWT_SECRET_SOCKET = process.env.JWT_SECRET;

// Authenticate socket connections via JWT passed in handshake auth
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication required."));
    }
    const decoded = jwt.verify(token, JWT_SECRET_SOCKET);
    const socketUser = await User.findById(decoded.userId).select('_id name').lean();
    if (!socketUser) {
      return next(new Error("User not found."));
    }
    socket.data.userId = socketUser._id.toString();
    socket.data.userName = socketUser.name;
    next();
  } catch {
    next(new Error("Invalid authentication token."));
  }
});

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
        // Use server-verified identity from JWT; fall back to client-supplied values only
        // if socket has no verified identity (e.g. anonymous/unauthenticated connections).
        const messageData = {
          hikeId: msg.roomId,
          senderId: socket.data.userId || msg.senderId,
          senderName: socket.data.userName || msg.senderName || msg.senderId,
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
            // Skip attachment entirely — storing raw base64 in MongoDB risks
            // exceeding the 16 MB document limit and degrades DB performance.
            socket.emit("attachment_error", { message: "Image upload failed. Message sent without attachment." });
          }
        }

        const savedMessage = await Message.create(messageData);
        console.log("Message saved with attachment:", !!savedMessage.attachment);
        
        const messageToSend = {
          _id: savedMessage._id,
          roomId: msg.roomId,
          senderId: savedMessage.senderId,
          senderName: savedMessage.senderName,
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
        socket.emit('message_error', { error: 'Failed to save message. Please try again.' });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ user disconnected');
  });
});

// === Start server & connect DB ===
function mongoUriHasDbName(uri) {
  // MongoDB URI format: mongodb(+srv)://[creds@]hosts[/dbName][?options]
  // If the segment after the first '/' is empty or starts with '?', no db is specified.
  const withoutProtocol = uri.replace(/^mongodb(\+srv)?:\/\//, "");
  const firstSlash = withoutProtocol.indexOf("/");
  if (firstSlash === -1) return false;
  const afterSlash = withoutProtocol.slice(firstSlash + 1);
  if (!afterSlash) return false;
  if (afterSlash.startsWith("?")) return false;
  const dbName = afterSlash.split("?")[0];
  return Boolean(dbName);
}

async function startServer() {
  try {
    const connectOptions = {};
    if (!mongoUriHasDbName(MONGO_URI)) {
      connectOptions.dbName = MONGO_DB_NAME || "travelbuddy";
    }

    await mongoose.connect(MONGO_URI, connectOptions);
    console.log("✅ Connected to MongoDB");

    server.listen(PORT, () => {
      console.log(`✨ Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}

// === Handle unhandled promise rejections ===
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

startServer();

module.exports = app;
