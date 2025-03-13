const transactionService = require("../services/expense-service");

const getUserTransactions = async (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) return res.status(401).json({ message: "세션 없음" });

  try {
    const userId = await transactionService.getUserIdBySession(sessionId);
    if (!userId) return res.status(401).json({ message: "세션 만료됨" });

    const transactions = await transactionService.getUserTransactions(userId);
    if (transactions.length === 0) {
      return res.status(404).json({ message: "소비 내역이 없습니다." });
    }

    res.status(200).json({
      message: `${userId}의 소비목록`,
      totalCount: transactions.length,
      expenses: transactions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};

const getUserMonthlyExpenses = async (req, res) => {
  const { month } = req.params;
  const sessionId = req.cookies.sessionId;
  if (!sessionId) return res.status(401).json({ message: "세션 없음" });

  if (!month) {
    return res.status(400).json({ message: "월을 제공해 주세요." });
  }

  const monthRegex = /^\d{4}-\d{2}$/;
  if (!monthRegex.test(month)) {
    return res
      .status(400)
      .json({ message: "잘못된 날짜 형식입니다. 예: YYYY-MM" });
  }

  try {
    const userId = await transactionService.getUserIdBySession(sessionId);
    if (!userId) return res.status(401).json({ message: "세션 만료됨" });

    const totalSpent = await transactionService.getMonthlyExpenses(
      userId,
      month
    );
    if (totalSpent === null) {
      return res
        .status(404)
        .json({ message: "지출 내역이 존재하지 않습니다." });
    }

    res.status(200).json({
      user_id: userId,
      total_spent: totalSpent,
      month: month,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};

module.exports = {
  getUserTransactions,
  getUserMonthlyExpenses,
};
