const goalService = require("../services/ai-service");

exports.getGoalRecommendations = async (req, res) => {
  try {
    const recommendations = await goalService.getGoalRecommendations(req);
    res.status(200).json({
      message: "AI 추천 목표 목록을 성공적으로 가져왔습니다.",
      recommendations,
    });
  } catch (error) {
    console.error("AI 추천 목표 목록 가져오기 실패:", error);
    res
      .status(500)
      .json({ message: "목표 추천 목록을 가져오는 중 오류가 발생했습니다." });
  }
};

exports.saveGoal = async (req, res) => {
  try {
    const result = await goalService.saveGoal(req.body, req.cookies.sessionId);
    res.status(200).json(result);
  } catch (error) {
    console.error("목표 저장 실패:", error);
    res
      .status(500)
      .json({ message: "목표 추천 또는 저장 중 오류가 발생했습니다." });
  }
};
