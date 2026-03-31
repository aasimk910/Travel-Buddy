// backend/utils/socket.js
// Socket.IO server logic for real-time group chat, E2E key exchange, and file attachments.
// Authenticates connections via JWT and persists messages to MongoDB.

// #region Imports
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");
const { uploadBase64Image } = require("./cloudinaryUpload");

// #endregion Imports
const JWT_SECRET = process.env.JWT_SECRET;

// Initializes all Socket.IO event handlers and JWT-based connection authentication.
function initSocket(io) {
  // Middleware: authenticate every socket connection using the JWT from handshake auth
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required."));
      const decoded = jwt.verify(token, JWT_SECRET);
      const socketUser = await User.findById(decoded.userId).select("_id name").lean();
      if (!socketUser) return next(new Error("User not found."));
      socket.data.userId = socketUser._id.toString();
      socket.data.userName = socketUser.name;
      next();
    } catch {
      next(new Error("Invalid authentication token."));
    }
  });

  io.on("connection", (socket) => {
    console.log("✅ a user connected");

    // Join a hike's chat room so the user receives messages broadcast to it
    socket.on("join_room", (data) => {
      const roomId = typeof data === "string" ? data : data.roomId;
      if (roomId) socket.join(roomId);
    });

    // Leave a hike chat room (e.g. when navigating away)
    socket.on("leave_room", (data) => {
      const roomId = typeof data === "string" ? data : data.roomId;
      if (roomId) socket.leave(roomId);
    });

    // E2E key exchange: new participant broadcasts a request for the room key
    socket.on("request_room_key", (data) => {
      const { roomId, requesterId, requesterPublicKeyJwk } = data || {};
      if (!roomId || !requesterId) return;
      socket.to(roomId).emit("room_key_requested", { roomId, requesterId, requesterPublicKeyJwk });
    });

    // An existing participant responds with a freshly wrapped copy of the AES room key
    socket.on("provide_room_key", (data) => {
      const { roomId, recipientId, wrappedKey, iv, senderPublicKeyJwk } = data || {};
      if (!roomId || !recipientId) return;
      io.to(roomId).emit("room_key_provided", { recipientId, wrappedKey, iv, senderPublicKeyJwk });
    });

    // Handles incoming chat messages — persists to DB, uploads attachments, and broadcasts
    socket.on("send_message", async (msg) => {
      if (!msg.roomId) return;
      try {
        const messageData = {
          hikeId: msg.roomId,
          senderId: socket.data.userId || msg.senderId,
          senderName: socket.data.userName || msg.senderName || msg.senderId,
          message: msg.message || "",
        };

        // Upload attachment to Cloudinary if present
        if (msg.attachment?.data) {
          try {
            const uploadResult = await uploadBase64Image(
              msg.attachment.data,
              "travel-buddy/chat-attachments"
            );
            messageData.attachment = {
              name: msg.attachment.name,
              type: msg.attachment.type,
              url: uploadResult.url,
              publicId: uploadResult.publicId,
            };
          } catch (uploadError) {
            console.error("Attachment upload failed:", uploadError);
            // Emit error to sender but still deliver the text message
            socket.emit("attachment_error", {
              message: "Image upload failed. Message sent without attachment.",
            });
          }
        }

        const savedMessage = await Message.create(messageData);

        io.to(msg.roomId).emit("receive_message", {
          _id: savedMessage._id,
          roomId: msg.roomId,
          senderId: savedMessage.senderId,
          senderName: savedMessage.senderName,
          message: msg.message,
          attachment: savedMessage.attachment,
          createdAt: savedMessage.createdAt,
        });
      } catch (err) {
        console.error("Error saving message:", err);
        socket.emit("message_error", { error: "Failed to save message. Please try again." });
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ user disconnected");
    });
  });
}

// #region Exports
module.exports = { initSocket };
// #endregion Exports
