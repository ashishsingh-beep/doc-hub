const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:5173',
  process.env.FRONTEND_URL // Add your production frontend URL here
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      // For development, you might want to allow all, but for production be specific
      // return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
      return callback(null, true); // Temporarily allow all for easier deployment testing
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ MySQL connection setup
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// ✅ Import route files
const authRoutes = require("./routes/auth"); // Adjust path to your auth.js file
const usersRoutes = require("./routes/users");
const documentsRoutes = require("./routes/documents");
const categoriesRoutes = require("./routes/categories");
const statsRoutes = require("./routes/stats");

// ✅ Register route middlewares
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/stats", statsRoutes);

// ✅ Test DB connection route
app.get("/api/test-db", (req, res) => {
  console.log("Testing database connection...");
  db.query("SELECT 1 as test", (err, result) => {
    if (err) {
      console.error("DB connection error:", err.message);
      return res.status(500).json({
        success: false,
        error: err.message,
        details: "Check your database credentials and connection",
      });
    }
    console.log("Database connected successfully!");
    res.json({
      success: true,
      message: "Database connected successfully",
      result: result[0],
    });
  });
});

// Test root route
app.get("/", (req, res) => {
  res.json({
    message: "Server is working!",
    timestamp: new Date(),
    availableRoutes: [
      "GET /",
      "GET /api/test-db",
      "POST /api/auth/login",
      "POST /api/auth/register",
    ],
  });
});

// Simple test login route (keeping your original for now)
app.post("/api/auth/test-login", (req, res) => {
  const { email, password } = req.body;
  if (email === "admin@dms.com" && password === "admin123") {
    res.json({ success: true, message: "Test login successful" });
  } else {
    res
      .status(401)
      .json({ success: false, message: "Invalid test credentials" });
  }
});

// ✅ 404 handler - MUST be after all routes
app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      "GET /",
      "GET /api/test-db",
      "POST /api/auth/login",
      "POST /api/auth/register",
      "POST /api/auth/test-login",
    ],
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Test it at: http://localhost:${PORT}`);
  console.log(`🔗 Database test: http://localhost:${PORT}/api/test-db`);
  console.log("📌 Available routes:");
  console.log("   GET  /");
  console.log("   GET  /api/test-db");
  console.log("   POST /api/auth/login");
  console.log("   POST /api/auth/register");
  console.log("   POST /api/auth/test-login");
});

// Graceful shutdown handlers
process.on("SIGINT", () => {
  console.log("\nReceived SIGINT, shutting down gracefully");
  server.close(() => {
    db.end();
    console.log("Server and database connections closed");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully");
  server.close(() => {
    db.end();
    console.log("Server and database connections closed");
    process.exit(0);
  });
});