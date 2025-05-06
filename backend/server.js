import "dotenv/config"; // Loads .env file variables into process.env
import express from "express";
import prisma from "./prisma/client.js"; // Or your chosen path to the prisma client instance
import authRoutes from "./routes/authRoutes.js"; // Import the auth routes
import groupRoutes from "./routes/groupRoutes.js"; // Import the group routes
import projectRoutes from "./routes/projectRoutes.js"; // Import the project routes

const app = express();
const PORT = process.env.PORT || 3001; // Backend server port

// Middleware to parse JSON bodies
app.use(express.json());

// A simple root route for testing if the server is up
app.get("/", (req, res) => {
  res.send("ProjecTrack Backend is running!");
});

// Mount authentication routes
// All routes defined in authRoutes.js will be prefixed with /api/auth
app.use("/api/auth", authRoutes);

// Mount group routes
app.use("/api/groups", groupRoutes); // All routes in groupRoutes will be prefixed with /api/groups

// Mount project routes
app.use("/api/projects", projectRoutes); // All routes in projectRoutes will be prefixed with /api/projects

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log("Connected to database via Prisma Client."); // Optional: confirmation
});

// Graceful shutdown for Prisma Client (optional but good practice)
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  console.log("Prisma Client disconnected. Exiting.");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  console.log("Prisma Client disconnected. Exiting.");
  process.exit(0);
});
