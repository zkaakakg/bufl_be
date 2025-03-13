const goalService = require("../services/goal-service");

exports.createGoal = async (req, res) => {
  try {
    const result = await goalService.createGoal(req);
    res.status(201).json(result);
  } catch (err) {
    console.error("목표 설정 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
};

exports.getGoals = async (req, res) => {
  try {
    const goals = await goalService.getGoals(req);
    res.status(200).json({ message: "목표 내역", goals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};

exports.getGoalById = async (req, res) => {
  try {
    const goal = await goalService.getGoalById(req);
    res.status(200).json({ message: "목표 상세 정보", goal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};

exports.getGoalPrediction = async (req, res) => {
  try {
    const prediction = await goalService.getGoalPrediction(req);
    res
      .status(200)
      .json({ message: "목표 달성 확률", probabilities: prediction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};

exports.getGoalTransactions = async (req, res) => {
  try {
    const transactions = await goalService.getGoalTransactions(req);
    res.status(200).json({ transactions });
  } catch (err) {
    console.error("트랜잭션 내역 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
};

exports.depositGoalAmount = async (req, res) => {
  try {
    const result = await goalService.depositGoalAmount(req);
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};
