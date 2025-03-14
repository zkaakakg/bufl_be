const consumptionService = require("../services/consumption-service");

exports.getConsumptionPattern = async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;

    if (!sessionId) return res.status(401).json({ message: "세션 없음" });

    const result = await consumptionService.analyzeConsumptionPattern(
      sessionId
    );
    res.status(result.status).json(result.data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getRecommendRatio = async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) return res.status(401).json({ message: "세션 없음" });

    const result = await consumptionService.getRecommendedRatio(sessionId);
    res.status(result.status).json(result.data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.addCategory = async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) return res.status(401).json({ message: "세션 없음" });

    const result = await consumptionService.saveRecommendedCategory(sessionId);
    res.status(result.status).json(result.data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
