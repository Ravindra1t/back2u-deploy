const mongoose = require("mongoose");
const { Schema } = mongoose;

const ItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: false,
    text: true,
  },
  description: {
    type: String,
    required: true,
    text: true,
  },
  locationFound: {
    type: String,
    required: false,
  },
  category: {
    type: String,
    required: true,
    lowercase: true,
    // Ensure frontend sends one of these EXACT lowercase strings:
    enum: [
      'electronics', 'clothing', 'id card', 'keys', 'water bottle', 
      'bag', 'laptop', 'headphones', 'books', 'stationary', 
      'jewellery', 'accessories', 'other'
    ],
  },
  status: {
    type: String,
    required: true,
    default: 'found',
    enum: ['found', 'returned', 'claimed'],
  },
  reportedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  dateFound: {
    type: Date,
    default: null,
  },

  // --- Claim/Return Fields ---
  claimedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  finder_confirmed_return: {
    type: Boolean,
    default: false,
  },
  claimant_confirmed_receipt: {
    type: Boolean,
    default: false,
  },
  claimRequests: [{
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  }],
  linkedLostPost: {
    type: Schema.Types.ObjectId,
    ref: 'LostItem',
    default: null,
  },
  contact_phone: {
    type: String,
    required: false,
    default: null,
  },
  imageUrl: {
    type: String,
    default: null,
  }
}, { timestamps: true });

ItemSchema.index({ itemName: 'text', description: 'text' });

module.exports = mongoose.model("Item", ItemSchema);