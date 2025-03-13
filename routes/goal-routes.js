const express = require("express");
const router = express.Router();
const goalController = require("../controllers/goal-controller");

router.post("/", goalController.createGoal);
router.get("/", goalController.getGoals);
router.get("/:id", goalController.getGoalById);
router.get("/:id/prediction", goalController.getGoalPrediction);
router.get("/:id/transactions", goalController.getGoalTransactions);
router.post("/:goal_id/deposit", goalController.depositGoalAmount);

module.exports = router;
