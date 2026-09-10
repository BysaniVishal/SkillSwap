const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    swap: { type: mongoose.Schema.Types.ObjectId, ref: "Swap", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

messageSchema.index({ swap: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
