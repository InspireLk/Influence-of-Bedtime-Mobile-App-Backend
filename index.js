const express = require("express");
const colors = require("colors");
const dotenv = require("dotenv");
const cors = require("cors");
const app = express();
require("dotenv").config({ path: "./config.env" });
const authRoutes = require("./routes/authRoutes");
const faceScanRoutes = require("./routes/faceScan.routes");
const userRoutes = require("./routes/userRoutes");
const sleepPredictorRoutes = require("./routes/sleepPredictor.routes");
const sleepInterventionRoutes = require("./routes/sleepIntervention.routes");
const connectDB = require("./DB/db");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

const {initializeAllUserSchedules, cleanupJobs, logScheduledJobs} = require("./service/NotificationScheduler")

dotenv.config();
connectDB();

const PORT = process.env.PORT ||  5005;

app.use(
  cors({
    origin: process.env.CLIENT_API || "exp://10.43.67.248:8081", // Replace with your frontend URL
    credentials: true,
  })
);

app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("Api is running Bedtime Project");
});

const server = app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}...`.yellow.bold);
  console.log("Success".green.bold);

  // Initialize background jobs after server is ready
  initializeAllUserSchedules().then(() => {
    logScheduledJobs();
  });
});


// initializeAllUserSchedules().then(() => {
//   logScheduledJobs();
// });
app.use(`/api/auth`, authRoutes);
app.use(`/api/face`, faceScanRoutes);
app.use(`/api/user`, userRoutes);
app.use(`/api/sleep`, sleepPredictorRoutes);
app.use(`/api/intervention`, sleepInterventionRoutes);

app.use(errorHandler);
app.use(notFound);

module.exports = { app, server };
