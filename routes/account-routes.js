const express = require("express");
const router = express.Router();
const accountController = require("../controllers/account-controller");

router.get("/", accountController.getAccounts);
router.get("/:account_id/transactions", accountController.getTransactions);

module.exports = router;
