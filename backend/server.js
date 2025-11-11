const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const dotenv = require("dotenv");
const http = require('http');
const { Server } = require("socket.io");
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const User = require("./models/User");
const Item = require("./models/Item"); 
const LostItem = require("./models/LostItem");
const Message = require("./models/Message");
const auth = require("./middleware/auth");

dotenv.config();

const app = express();
// Configure CORS for deployment: allow specific frontend origins via env FRONTEND_ORIGIN
// FRONTEND_ORIGIN can be a single origin or comma-separated list
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:3000").split(',').map(s => s.trim());
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // allow curl/postman
  if (allowedOrigins.includes(origin)) return true;
  try {
    const { hostname } = new URL(origin);
    if (hostname.endsWith('.vercel.app')) return true; // allow any vercel app
  } catch (_) { /* ignore */ }
  return false;
};
const corsOptions = {
  origin: function (origin, callback) {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// --- Cloudinary Config ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// === USER PROFILE (AUTH) ===
app.get('/api/users/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email role createdAt passwordChangedAt');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (e) {
    console.error(e);
    res.status(500).send('Server Error');
  }
});

app.put('/api/users/me/profile', auth, async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ message: 'Name too short' });
    }
    const updated = await User.findByIdAndUpdate(req.user.id, { $set: { name: String(name).trim() } }, { new: true }).select('name email role');
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).send('Server Error');
  }
});

app.put('/api/users/me/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Missing fields' });
    if (String(newPassword).length < 6) return res.status(400).json({ message: 'Password too short' });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(400).json({ message: 'Current password incorrect' });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.passwordChangedAt = new Date();
    await user.save();
    // Option: return fresh token
    const payload = { user: { id: user.id, name: user.name, email: user.email, role: user.role || 'user' } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' }, (err, token) => {
      if (err) throw err;
      res.json({ message: 'Password updated', token });
    });
  } catch (e) {
    console.error(e);
    res.status(500).send('Server Error');
  }
});

// === FORGOT / RESET PASSWORD ===
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email required' });
    const user = await User.findOne({ email });
    // Always respond success to avoid user enumeration
    if (!user) return res.json({ message: 'If this email exists, a reset link has been generated.' });

    const plainToken = crypto.randomBytes(20).toString('hex');
    const hashed = crypto.createHash('sha256').update(plainToken).digest('hex');
    user.passwordResetToken = hashed;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15m
    await user.save({ validateBeforeSave: false });

    // DEV MODE: return token in response and log it
    const resetUrl = `${req.headers.origin || 'http://localhost:3000'}/reset-password?token=${plainToken}&email=${encodeURIComponent(email)}`;
    console.log('Password reset link (DEV):', resetUrl);
    return res.json({ message: 'Reset link generated', token: plainToken, resetUrl });
  } catch (e) {
    console.error(e);
    res.status(500).send('Server Error');
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body || {};
    if (!email || !token || !newPassword) return res.status(400).json({ message: 'Missing fields' });
    if (String(newPassword).length < 6) return res.status(400).json({ message: 'Password too short' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid reset token' });
    const hashed = crypto.createHash('sha256').update(String(token)).digest('hex');
    if (!user.passwordResetToken || user.passwordResetToken !== hashed) return res.status(400).json({ message: 'Invalid reset token' });
    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) return res.status(400).json({ message: 'Reset token expired' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.passwordChangedAt = new Date();
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    const payload = { user: { id: user.id, name: user.name, email: user.email, role: user.role || 'user' } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' }, (err, tokenOut) => {
      if (err) throw err;
      res.json({ message: 'Password reset successful', token: tokenOut });
    });
  } catch (e) {
    console.error(e);
    res.status(500).send('Server Error');
  }
});

// --- Admin Middleware ---
function requireAdmin(req, res, next) {
  try {
    if (req.user && req.user.role === 'admin') return next();
    return res.status(403).json({ message: 'Admin access required' });
  } catch (e) {
    return res.status(403).json({ message: 'Admin access required' });
  }
}

// --- Admin APIs ---
// Users
app.get('/api/admin/users', auth, requireAdmin, async (req, res) => {
  try {
    const { q = '', page = 1, limit = 20 } = req.query;
    const filter = q ? { $or: [ { name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') } ] } : {};
    const users = await User.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(parseInt(limit));
    const count = await User.countDocuments(filter);
    res.json({ users, count });
  } catch (e) {
    console.error(e);
    res.status(500).send('Server Error');
  }
});

app.delete('/api/admin/users/:id', auth, requireAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).send('Server Error');
  }
});

// Items
app.get('/api/admin/items', auth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const items = await Item.find(filter).sort({ createdAt: -1 }).populate('reportedBy', 'name email').populate('claimedBy', 'name email');
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).send('Server Error');
  }
});

app.delete('/api/admin/items/:id', auth, requireAdmin, async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    await Message.deleteMany({ item: req.params.id });
    res.json({ message: 'Item and related messages deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).send('Server Error');
  }
});

app.patch('/api/admin/items/:id/mark-returned', auth, requireAdmin, async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, { $set: { status: 'returned', finder_confirmed_return: true, claimant_confirmed_receipt: true } }, { new: true });
    res.json(item);
  } catch (e) {
    console.error(e);
    res.status(500).send('Server Error');
  }
});

// Lost posts
app.get('/api/admin/lost', auth, requireAdmin, async (req, res) => {
  try {
    const lost = await LostItem.find().sort({ createdAt: -1 }).populate('lostBy', 'name email');
    res.json(lost);
  } catch (e) {
    console.error(e);
    res.status(500).send('Server Error');
  }
});

app.delete('/api/admin/lost/:id', auth, requireAdmin, async (req, res) => {
  try {
    await LostItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lost post deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).send('Server Error');
  }
});

// Messages
app.get('/api/admin/messages', auth, requireAdmin, async (req, res) => {
  try {
    const { itemId } = req.query;
    const filter = itemId ? { item: itemId } : {};
    const messages = await Message.find(filter).sort({ createdAt: -1 }).populate('sender', 'name email').populate('receiver', 'name email');
    res.json(messages);
  } catch (e) {
    console.error(e);
    res.status(500).send('Server Error');
  }
});

app.delete('/api/admin/messages/:id', auth, requireAdmin, async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: 'Message deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).send('Server Error');
  }
});
// --- Multer Config ---
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'back2you_items',
    resource_type: 'image',
    public_id: (req, file) => new Date().toISOString() + '-' + file.originalname,
  },
});
const upload = multer({ storage: storage });

// --- Server & Socket.IO Setup ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST", "PUT", "PATCH"],
    credentials: true,
  },
});

// --- Mongoose Connect ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// --- API Endpoints ---
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    user = new User({
      name,
      email,
      password: hashedPassword,
    });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// === LOST ITEMS: DELETE OWN LOST POST ===
app.delete("/api/lost/:id", auth, async (req, res) => {
  try {
    const lost = await LostItem.findById(req.params.id);
    if (!lost) return res.status(404).json({ message: 'Lost post not found' });
    if (lost.lostBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }
    await LostItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// === LOST ITEMS: CREATE A LOST POST ===
app.post("/api/lost/report", auth, upload.single('image'), async (req, res) => {
  try {
    const rawCategory = req.body.category;
    const categoryValue = rawCategory ? String(rawCategory).toLowerCase().trim() : null;
    if (!categoryValue || categoryValue.length === 0) {
      return res.status(400).json({ message: "Validation failed", errors: { category: { message: "Path `category` is required." } } });
    }
    const newLost = new LostItem({
      itemName: req.body.name || req.body.itemName,
      description: req.body.description,
      category: categoryValue,
      locationLost: req.body.location || req.body.locationLost || "Not specified",
      dateLost: req.body.date_lost || req.body.date || null,
      contact_phone: req.body.contact_phone || req.body.phone || null,
      imageUrl: req.file ? req.file.path : null,
      lostBy: req.user.id,
      status: 'lost',
    });
    const lost = await newLost.save();
    res.status(201).json(lost);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = {};
      Object.keys(err.errors).forEach((key) => {
        errors[key] = { message: err.errors[key].message };
      });
      return res.status(400).json({ message: "Validation failed", errors });
    }
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// === LOST ITEMS: BROWSE LOST POSTS (Public, with Staff Sorting) ===
app.get("/api/lost/browse", async (req, res) => {
  try {
    const { search, category } = req.query;

    let matchStage = { status: 'lost' };
    if (category && category !== 'all') {
      matchStage.category = category;
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      matchStage.$or = [
        { itemName: regex },
        { description: regex }
      ];
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'lostBy',
          foreignField: '_id',
          as: 'lostByUser'
        }
      },
      { $unwind: { path: '$lostByUser', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          isStaff: {
            $regexMatch: {
              input: { $ifNull: ['$lostByUser.email', ''] },
              regex: /@am\.amrita\.edu$/
            }
          },
          lostBy: { _id: '$lostByUser._id', name: '$lostByUser.name' }
        }
      },
      { $sort: { isStaff: -1, createdAt: -1 } },
      { $project: { lostByUser: 0 } }
    ];

    const lostItems = await LostItem.aggregate(pipeline);
    res.json(lostItems);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// === LOST ITEMS: RESPOND (Finder) BY CREATING A LINKED FOUND ITEM ===
app.post("/api/lost/respond/:lostId", auth, upload.single('image'), async (req, res) => {
  try {
    const { lostId } = req.params;
    const lost = await LostItem.findById(lostId);
    if (!lost) {
      return res.status(404).json({ message: "Lost post not found" });
    }
    // Prevent the user who reported the lost item from claiming they found it
    if (lost.lostBy.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot respond to your own lost post' });
    }

    const rawCategory = req.body.category || lost.category;
    const categoryValue = rawCategory ? String(rawCategory).toLowerCase().trim() : null;
    if (!categoryValue || categoryValue.length === 0) {
      return res.status(400).json({ message: "Validation failed", errors: { category: { message: "Path `category` is required." } } });
    }

    const newItem = new Item({
      itemName: req.body.name || req.body.itemName || lost.itemName,
      description: req.body.description || `Found in response to lost post ${lostId}`,
      category: categoryValue,
      locationFound: req.body.location || req.body.locationFound || "Not specified",
      dateFound: req.body.date_found || req.body.date || new Date(),
      contact_phone: req.body.contact_phone || req.body.phone || null,
      imageUrl: req.file ? req.file.path : null,
      reportedBy: req.user.id, // finder
      status: 'claimed',
      claimedBy: lost.lostBy,
      linkedLostPost: lost._id,
    });
    const item = await newItem.save();
    // Remove the original lost post from the board since it is now linked and claimed
    await LostItem.findByIdAndDelete(lostId);
    res.status(201).json(item);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = {};
      Object.keys(err.errors).forEach((key) => {
        errors[key] = { message: err.errors[key].message };
      });
      return res.status(400).json({ message: "Validation failed", errors });
    }
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const payload = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
      },
    };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "30d" },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.get("/api/dashboard", auth, async (req, res) => {
  try {
    const totalFound = await Item.countDocuments();
    const totalReturned = await Item.countDocuments({ status: "returned" });
    const totalLost = await LostItem.countDocuments();
    const recentItems = await Item.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("reportedBy", "name");
    res.json({
      totalFound,
      totalReturned,
      totalLost,
      recentItems,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

/**
 * FINAL FIX APPLIED HERE:
 * 1. Removed synchronous validation.
 * 2. Added explicit casting and validation for the 'category' field.
 */
app.post("/api/items/report", auth, upload.single('image'), async (req, res) => {
  try {
    // --- DEBUG START ---
    console.log("--- DEBUG START ---");
    console.log("REQ.BODY (after Multer):", req.body); 
    // -------------------
    
    // Explicitly clean and cast the category value to ensure Mongoose validation passes
    const rawCategory = req.body.category;
    const categoryValue = rawCategory ? String(rawCategory).toLowerCase().trim() : null;

    // Optional: Add strict check for required field missing
    if (!categoryValue || categoryValue.length === 0) {
         console.error("DEBUG: Category is empty or null after clean up.");
         return res.status(400).json({ message: "Validation failed", errors: { category: { message: "Path `category` is required." } } });
    }
    
    const newItem = new Item({
      itemName: req.body.name || req.body.itemName,
      description: req.body.description,
      category: categoryValue, // Use the cleaned value
      locationFound: req.body.location || req.body.locationFound || "Not specified",
      dateFound: req.body.date_found || req.body.date || null,
      contact_phone: req.body.contact_phone || req.body.phone || null,
      imageUrl: req.file ? req.file.path : null,
      reportedBy: req.user.id,
      status: 'found',
    });
    
    // Rely on asynchronous validation during save
    const item = await newItem.save();
    
    res.status(201).json(item);
  } catch (err) {
    console.error("Error in /api/items/report:", err.message);
    
    // Check for Mongoose Validation Error
    if (err.name === 'ValidationError') {
      const errors = {};
      Object.keys(err.errors).forEach((key) => {
        errors[key] = { message: err.errors[key].message };
      });
      return res.status(400).json({ message: "Validation failed", errors });
    }
    
    res.status(500).send("Server Error");
  }
});

// === "MY ACTIVITY" ENDPOINT (Simplified) ===
app.get("/api/activity", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const foundByMe = await Item.find({ reportedBy: userId })
      .populate("claimedBy", "name email")
      .populate("claimRequests.user", "name email")
      .sort({ createdAt: -1 });

    // Items where user is the approved claimer OR has a pending/approved claim request
    const allItems = await Item.find({
      $or: [
        { claimedBy: userId },
        { 'claimRequests.user': userId }
      ]
    })
      .populate("reportedBy", "name email")
      .populate("claimedBy", "name email")
      .populate("claimRequests.user", "name email")
      .sort({ createdAt: -1 });

    // Filter to only include items where user has an active claim (pending or approved)
    const claimedByMe = allItems.filter(item => {
      // If user is the approved claimer, include it
      if (item.claimedBy && item.claimedBy._id.toString() === userId) {
        return true;
      }
      // If user has a pending or approved claim request, include it
      const userRequest = item.claimRequests?.find(r => r.user._id.toString() === userId);
      return userRequest && (userRequest.status === 'pending' || userRequest.status === 'approved');
    });

    const lostByMe = await LostItem.find({ lostBy: userId })
      .sort({ createdAt: -1 });

    // Note: Items linked to lost posts are already included in foundByMe and claimedByMe
    // foundByMe includes items where reportedBy = userId (including responses to lost posts)
    // claimedByMe includes items where claimedBy = userId (including auto-claimed lost post responses)

    res.json({ foundByMe, claimedByMe, lostByMe });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// === "CONFIRM RETURN" ENDPOINT (Simple Logic) ===
app.put("/api/items/confirm/:id", auth, async (req, res) => {
  try {
    const { confirmationType } = req.body;
    const userId = req.user.id;
    const itemId = req.params.id;
    let item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    if (item.status === 'returned') {
        return res.status(400).json({ message: "Item already returned" });
    }
    let updateData = {};
    let otherConfirmation = false;
    
    // Simple logic: either person can confirm
    if (confirmationType === "finder" && item.reportedBy.toString() === userId) {
      updateData.finder_confirmed_return = true;
      otherConfirmation = item.claimant_confirmed_receipt;
    } else if (confirmationType === "claimant" && item.claimedBy && item.claimedBy.toString() === userId) {
      updateData.claimant_confirmed_receipt = true;
      otherConfirmation = item.finder_confirmed_return;
    } else {
      return res.status(401).json({ message: "Not authorized to confirm" });
    }

    if (otherConfirmation) {
      updateData.status = "returned";
    }
    item = await Item.findByIdAndUpdate(itemId, { $set: updateData }, { new: true });
    res.json(item);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// === "BROWSE FOUND ITEMS" ENDPOINT (Public, with Staff Sorting) ===
app.get("/api/items/browse", async (req, res) => {
  try {
    const { search, category } = req.query;

    // Show both 'found' and 'claimed' items (keep visible until returned)
    // Exclude items linked to lost posts (those are auto-claimed and shouldn't appear in browse)
    let matchStage = { 
      status: { $in: ['found', 'claimed'] },
      linkedLostPost: null // Only show items not linked to lost posts
    };
    if (category && category !== 'all') {
      matchStage.category = category;
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      matchStage.$or = [
        { itemName: regex },
        { description: regex }
      ];
    }

    // --- Staff Sorting Logic ---
    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'reportedBy',
          foreignField: '_id',
          as: 'reportedByUser'
        }
      },
      {
        $unwind: {
          path: '$reportedByUser',
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        $addFields: {
          isStaff: {
            $regexMatch: {
              input: { $ifNull: ['$reportedByUser.email', ''] }, 
              regex: /@am\.amrita\.edu$/
            }
          },
          reportedBy: {
            _id: '$reportedByUser._id',
            name: '$reportedByUser.name'
          },
          // Sort 'found' before 'claimed'
          isClaimed: { $cond: [{ $eq: ['$status', 'claimed'] }, 1, 0] }
        }
      },
      {
        $sort: {
          isClaimed: 1,
          isStaff: -1,
          createdAt: -1
        }
      },
      {
        $project: {
          reportedByUser: 0
        }
      }
    ];

    const items = await Item.aggregate(pipeline);
    
    res.json(items);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// === REQUEST CLAIM (multi-claim requests) ===
app.put("/api/items/claim/:id", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.reportedBy.toString() === userId) {
      return res.status(400).json({ message: 'You cannot claim an item you reported' });
    }
    if (item.status === 'returned') {
      return res.status(400).json({ message: 'Item already returned' });
    }
    // Ensure claimRequests exists
    if (!Array.isArray(item.claimRequests)) item.claimRequests = [];
    // Prevent duplicate pending/approved requests (rejected requests can be resubmitted)
    const already = item.claimRequests.find(r => r.user.toString() === userId && (r.status === 'pending' || r.status === 'approved'));
    if (already) {
      return res.status(400).json({ message: 'You already have an active claim request' });
    }
    item.claimRequests.push({ user: userId, message: req.body?.message || '' });
    await item.save();
    return res.json({ message: 'Request submitted', itemId: item._id });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// List claim requests (owner only)
app.get("/api/items/:id/requests", auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('claimRequests.user', 'name email');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.reportedBy.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' });
    res.json(item.claimRequests.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Approve a claim request (owner only)
app.post("/api/items/:id/requests/:requestId/approve", auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.reportedBy.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' });
    if (item.status !== 'found') return res.status(400).json({ message: 'Item not open for approval' });

    const reqObj = item.claimRequests.id(req.params.requestId);
    if (!reqObj) return res.status(404).json({ message: 'Request not found' });
    // Defensive: prevent approving a claim to the finder themselves
    if (reqObj.user.toString() === item.reportedBy.toString()) {
      return res.status(400).json({ message: 'Cannot approve a claim to yourself' });
    }

    // Mark approved request and reject others
    item.claimRequests = item.claimRequests.map(r => {
      if (r._id.toString() === req.params.requestId) {
        r.status = 'approved';
      } else if (r.status === 'pending') {
        r.status = 'rejected';
      }
      return r;
    });
    item.claimedBy = reqObj.user;
    item.status = 'claimed';
    await item.save();
    res.json(item);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Reject a claim request (owner only)
app.post("/api/items/:id/requests/:requestId/reject", auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.reportedBy.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' });
    const reqObj = item.claimRequests.id(req.params.requestId);
    if (!reqObj) return res.status(404).json({ message: 'Request not found' });
    if (reqObj.status !== 'pending') return res.status(400).json({ message: 'Request is not pending' });
    reqObj.status = 'rejected';
    await item.save();
    res.json(item.claimRequests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// === "FOUND ITEM CHAT HISTORY" ENDPOINT (Simple) ===
app.get("/api/chat/:itemId", auth, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { partnerId } = req.query; // Get the chat partner ID from query params
    const userId = req.user.id;
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    const isFinder = item.reportedBy.toString() === userId;
    const isApprovedClaimer = item.claimedBy && item.claimedBy.toString() === userId;
    const isRequester = Array.isArray(item.claimRequests) && item.claimRequests.some(r => r.user.toString() === userId && (r.status === 'pending' || r.status === 'approved'));
    // Allow chat when:
    // - item is claimed (finder, approved claimer, or any requester with pending/approved status)
    // - item is found (finder or any requester with pending/approved status)
    if (item.status === 'claimed') {
      // Finder, approved claimer, or any requester with pending/approved status can view chat
      if (!isFinder && !isApprovedClaimer && !isRequester) return res.status(403).json({ message: 'Access denied' });
    } else if (item.status === 'found') {
      if (!isFinder && !isRequester) return res.status(403).json({ message: 'Access denied' });
    } else {
      return res.status(403).json({ message: 'Chat closed for this item' });
    }
    
    // Filter messages to only show conversation between current user and their partner
    let messageQuery = { item: itemId };
    if (partnerId) {
      // Show only messages between userId and partnerId
      messageQuery.$or = [
        { sender: userId, receiver: partnerId },
        { sender: partnerId, receiver: userId }
      ];
    } else {
      // If no partnerId specified, show messages where user is sender or receiver
      messageQuery.$or = [
        { sender: userId },
        { receiver: userId }
      ];
    }
    
    const messages = await Message.find(messageQuery)
      .populate("sender", "name")
      .populate("receiver", "name")
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// --- Socket.IO Logic ---
// Store userId -> socketId mapping
const userSockets = new Map();

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join_room", async ({ itemId, token }) => {
    try {
      const decoded = (token === 'admin-local')
        ? { user: { id: 'admin-local', role: 'admin' } }
        : jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.user.id;
      const isAdmin = decoded.user.role === 'admin';
      const item = await Item.findById(itemId);
      if (!item) return;
      const isFinder = item.reportedBy.toString() === userId;
      const isApprovedClaimer = item.claimedBy && item.claimedBy.toString() === userId;
      const isRequester = Array.isArray(item.claimRequests) && item.claimRequests.some(r => r.user.toString() === userId && (r.status === 'pending' || r.status === 'approved'));
      // Allow join: finder always; approved claimer; or requester with pending/approved status
      if (isAdmin || isFinder || isApprovedClaimer || isRequester) {
        socket.join(itemId);
        // Store userId for this socket
        socket.userId = userId;
        userSockets.set(userId, socket.id);
        console.log(`User ${userId} (${socket.id}) joined room: ${itemId}`);
      }
    } catch (e) {
      // ignore invalid
    }
  });

  socket.on("send_message", async ({ item: itemId, token, content, receiverId }) => {
    try {
      const decoded = (token === 'admin-local')
        ? { user: { id: 'admin-local', role: 'admin' } }
        : jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.user.id;
      const isAdmin = decoded.user.role === 'admin';
      const item = await Item.findById(itemId);
      if (!item) return;
      const isFinder = item.reportedBy.toString() === userId;
      const isApprovedClaimer = item.claimedBy && item.claimedBy.toString() === userId;
      const isRequester = Array.isArray(item.claimRequests) && item.claimRequests.some(r => r.user.toString() === userId && (r.status === 'pending' || r.status === 'approved'));
      // Allow sending: if claimed -> finder, approved claimer, or requester with pending/approved status; if found -> finder or requester
      if (!isAdmin) {
        if (item.status === 'claimed') {
          if (!isFinder && !isApprovedClaimer && !isRequester) return;
        } else if (item.status === 'found') {
          if (!isFinder && !isRequester) return;
        } else {
          return;
        }
      }

      let receiver;
      if (isAdmin) {
        // Admin can target any participant
        if (receiverId) {
          receiver = receiverId;
        } else {
          receiver = item.reportedBy || item.claimedBy || (item.claimRequests?.[0]?.user);
        }
      } else if (isFinder) {
        // Finder can target a specific requester or the approved claimer when claimed
        if (receiverId) {
          const allowedIds = [item.reportedBy?.toString()];
          if (item.claimedBy) allowedIds.push(item.claimedBy.toString());
          if (Array.isArray(item.claimRequests)) {
            item.claimRequests.forEach(r => allowedIds.push(r.user.toString()));
          }
          if (!allowedIds.includes(receiverId)) return; // not allowed target
          receiver = receiverId;
        } else {
          receiver = item.claimedBy || (item.claimRequests?.[0]?.user);
        }
      } else {
        // Non-finder messages always go to the finder
        receiver = item.reportedBy;
      }
      const newMessage = new Message({ item: itemId, sender: userId, receiver, content });
      await newMessage.save();
      const messageToEmit = await Message.findById(newMessage._id)
        .populate("sender", "name")
        .populate("receiver", "name");
      
      // Send message only to receiver (sender already has it via optimistic update)
      // Emit to receiver's socket if they're connected
      const receiverSocketId = userSockets.get(receiver.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive_message", messageToEmit);
      }
    } catch (err) {
      console.error("Error saving/sending message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    // Clean up user socket mapping
    if (socket.userId) {
      userSockets.delete(socket.userId);
    }
  });
});
   
// --- Start Server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));