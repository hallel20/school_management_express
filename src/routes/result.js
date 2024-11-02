const express = require("express");
const router = express.Router();
const resultController = require("../controllers/resultController");
const { authenticateToken } = require("../middlewares/auth");

router.get("/", authenticateToken, resultController.getResults);
router.post("/", authenticateToken, resultController.createResult);

module.exports = router;
