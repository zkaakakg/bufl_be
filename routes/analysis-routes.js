const express = require("express");
const router = express.Router();
const analysisController = require("../controllers/analysis-controller");

router.get("/", analysisController.getConsumptionPattern);
router.get("/recommend", analysisController.getRecommendRatio);
router.get("/add-category", analysisController.addCategory);

module.exports = router;
