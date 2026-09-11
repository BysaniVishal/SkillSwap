const mongoose = require("mongoose");

// Records of certificate-based skill uploads. File stored as base64 directly
// in Mongo (capped at ~2MB) — no object storage configured in this project;
// the pragmatic zero-new-infra choice at this scale, not the production one.
const certificateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    skill: { type: String, required: true },
    category: { type: String, required: true },
    proficiency: { type: String, required: true },
    fileData: { type: String, required: true },
    mimeType: { type: String, required: true },
    uploadedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: false }
);

certificateSchema.index({ user: 1, skill: 1 });

module.exports = mongoose.model("Certificate", certificateSchema);
