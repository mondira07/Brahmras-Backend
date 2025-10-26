const express = require("express");
const http = require("http");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const db = require("./db");
const route = require("./routes/route");
const cors = require("cors");
require("dotenv").config();
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    // Replace the dead worker
    cluster.fork();
  });
} else {
  const app = express();

  // CORS configuration
  const corsOptions = {
    origin: ["*","http://localhost:3000", "https://single-vendor-ecommerce-backend.onrender.com"], // Replace with your frontend URL
    credentials: true, // Allow credentials (cookies) to be sent
  };
  app.use(cors(corsOptions));

  // Middleware
  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Serve static files from the build directory
  app.use(express.static(path.join(__dirname, "build")));

  // Serve static assets (images) from the Assets directory
  app.use("/assets", express.static(path.join(__dirname, "build", "Assets")));

  // Database connection
  db.connectDB();

  // Routes
  app.use(route);

  // Example route: Home route
  app.get("/", (req, res) => {
    res.send("Welcome to the Home Page");
  });

  // Example route: About route
  app.get("/about", (req, res) => {
    res.send("Welcome to the About Page");
  });

  // Example route: API route
  app.get("/api", (req, res) => {
    res.json({ message: "Welcome to the API" });
  });

  // Handle POST requests to /data
  app.post("/data", (req, res) => {
    const receivedData = req.body;
    console.log(receivedData);
    res.json({ message: "Data received", data: receivedData });
  });

  // Serve React application
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
  });

  // Start the server and listen on the specified port
  const port = process.env.PORT || 5000;
  const server = http.createServer(app);

  server.listen(port, "0.0.0.0", () => {
    console.log(`Worker ${process.pid} started and is running on port ${port}`);
  });
}
