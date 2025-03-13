const express = require("express");
const goalController = require("../controllers/aigoal-controller");

const router = express.Router();

router.get("/", goalController.getGoalRecommendations);
router.post("/generate-goals", goalController.saveGoal);

module.exports = router;
