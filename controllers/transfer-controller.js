const transferService = require("../services/transfer-service");

exports.scheduleAutoTransfer = async (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) {
    return res.status(401).json({ message: "세션 없음" });
  }

  try {
    const message = await transferService.scheduleAutoTransfer(sessionId);
    res.status(200).json({ message });
  } catch (err) {
    console.error("❌ 자동이체 등록 실패:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.getTransferHistory = async (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) {
    return res.status(401).json({ message: "세션 없음" });
  }

  try {
    const history = await transferService.getTransferHistory(sessionId);
    res.status(200).json(history);
  } catch (err) {
    console.error("❌ 자동이체 내역 조회 실패:", err.message);
    res.status(500).json({ error: err.message });
  }
};
