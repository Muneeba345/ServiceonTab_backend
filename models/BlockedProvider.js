const mongoose = require("mongoose");

const blockedProviderSchema = new mongoose.Schema(
  {
    providerEmail: {
      type: String,
      required: true,
      unique: true, // Ensures a provider is blocked only once
    },
    providerName: {
      type: String,
      required: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider", // Reference to Provider model
      required: true,
    },
    reason: {
      type: String,
      default: "Low ratings",
    },
    blockedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

const BlockedProvider = mongoose.model("BlockedProvider", blockedProviderSchema);

module.exports = BlockedProvider;
