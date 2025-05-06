import express from "express";

const app = express();
const PORT = process.env.PORT || 3001; // Backend server port

// Middleware to parse JSON bodies
app.use(express.json());

// A simple route for testing
app.get("/", (req, res) => {
  res.send("ProjecTrack Backend is running!");
});

// Placeholder for API routes
// app.use('/api/users', userRoutes);
// app.use('/api/projects', projectRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
