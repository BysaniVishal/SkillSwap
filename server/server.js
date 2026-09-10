require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const initSocket = require("./socket");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/skills", require("./routes/skillRoutes"));
app.use("/api/matches", require("./routes/matchRoutes"));
app.use("/api/swap-requests", require("./routes/swapRequestRoutes"));
app.use("/api/swaps", require("./routes/swapRoutes"));
app.use("/api/sessions", require("./routes/sessionRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/assistant", require("./routes/assistantRoutes"));
app.use("/api/skill-quiz", require("./routes/skillQuizRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));

// route mounts will be added here in later phases

app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: "Duplicate value for a unique field" });
  }

  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
