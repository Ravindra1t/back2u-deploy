const mongoose = require("mongoose");
const { Schema } = mongoose;

// This is a new model just for Lost Item posts
const LostItemSchema = new mongoose.Schema({
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
  locationLost: { // Specific field for "lost"
    type: String,
    required: false,
  },
  dateLost: { // Specific field for "lost"
    type: Date,
    default: null,
  },
  category: {
    type: String,
    required: true,
    lowercase: true,
    enum: [
      'electronics', 'clothing', 'id card', 'keys', 'water bottle', 
      'bag', 'laptop', 'headphones', 'books', 'stationary', 
      'jewellery', 'accessories', 'other'
    ],
  },
  status: {
    type: String,
    required: true,
    default: 'lost',
    enum: ['lost'], // This item can only be 'lost'
  },
  lostBy: { // The User who reported it lost
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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

LostItemSchema.index({ itemName: 'text', description: 'text' });

module.exports = mongoose.model("LostItem", LostItemSchema);