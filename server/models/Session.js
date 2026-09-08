const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    swap: { type: mongoose.Schema.Types.ObjectId, ref: "Swap", required: true },
    skill: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true }, // "19:00"
    duration: { type: Number, required: true }, // minutes
    notes: { type: String, default: "", maxlength: 500 },
    status: {
      type: String,
      enum: ["upcoming", "completed", "cancelled"],
      default: "upcoming",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);
