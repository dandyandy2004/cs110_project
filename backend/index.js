const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const partyRoutes = require("./routes/parties");
const songRoutes = require("./routes/songs");
const commentRoutes = require("./routes/comments");
const voteRoutes = require("./routes/votes");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Party Music API is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/parties", partyRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/votes", voteRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
