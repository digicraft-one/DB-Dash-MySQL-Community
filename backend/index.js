import cors from "cors";
import express from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import errorHandler from "./middleware/errorHandler.middleware.js";
import dbRouter from "./routes/db.routes.js";
import userRouter from "./routes/user.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load configuration
let config;
try {
    config = JSON.parse(
        fs.readFileSync(
            path.join(__dirname, "..", "config", "backend-config.json"),
            "utf8",
        ),
    );
} catch (error) {
    console.warn("Could not load backend config, using defaults.");
    config = { port: 24207, host: "0.0.0.0" }; // Default host to 0.0.0.0
}

const app = express();
const port = config.port || 24207;
const host = config.host || "0.0.0.0"; // Use configured host or default

app.use(cors());
app.use(express.json());

app.get("/api/status", (req, res) => {
    // Disable caching for this route
    res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");

    // Send the current status
    res.json({ status: `Backend server is running on port ${port}` });
});

app.use("/db", dbRouter);
app.use("/users", userRouter);

app.use(errorHandler);

app.listen(port, host, () => {
    console.log(`Backend server running at http://${host}:${port}`);
});
