const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/expense-controller");

router.get("/", transactionController.getUserTransactions);
router.get("/:month", transactionController.getUserMonthlyExpenses);

module.exports = router;
