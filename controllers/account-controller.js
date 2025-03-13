const accountService = require("../services/account-service");

exports.getAccounts = async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) return res.status(401).json({ message: "세션 없음" });

    const accounts = await accountService.getUserAccounts(sessionId);
    res.status(200).json(accounts);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { account_id } = req.params;
    const sessionId = req.cookies.sessionId;
    if (!sessionId) return res.status(401).json({ message: "세션 없음" });

    if (!account_id) {
      return res.status(400).json({ message: "계좌 ID를 제공해 주세요." });
    }

    const transactions = await accountService.getAccountTransactions(
      sessionId,
      account_id
    );

    res.status(200).json(transactions);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message });
  }
};
