const express = require("express");
const app = express();
require("dotenv").config();

const resultRoutes = require("./routes/result");
const authRoutes = require("./routes/auth");

app.use(express.json());

app.use("/api/results", resultRoutes);
app.use("/api/auth", authRoutes);

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
