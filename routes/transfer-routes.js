const express = require("express");
const router = express.Router();
const transferController = require("../controllers/transfer-controller");

// 자동이체 등록
router.post("/transfer", transferController.scheduleAutoTransfer);

// 자동이체 내역 조회
router.get("/history", transferController.getTransferHistory);

module.exports = router;
