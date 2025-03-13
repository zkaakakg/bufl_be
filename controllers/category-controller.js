const categoryService = require("../services/category-service");

exports.getCategories = async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) return res.status(401).json({ message: "세션 없음" });

    const categories = await categoryService.getCategories(sessionId);
    res.status(200).json({ categories: categories });
  } catch (err) {
    console.error("카테고리 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    res.status(200).json({ category });
  } catch (err) {
    console.error("카테고리 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
};

exports.addCategories = async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) return res.status(401).json({ message: "세션 없음" });

    await categoryService.addCategories(sessionId, req.body);
    res.status(201).json({ message: "카테고리 추가 완료" });
  } catch (err) {
    console.error("카테고리 추가 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    await categoryService.deleteCategory(req.params.id);
    res.status(200).json({ message: "카테고리 삭제 성공" });
  } catch (err) {
    console.error("카테고리 삭제 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
};

exports.getCategoryAccounts = async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) return res.status(401).json({ message: "세션 없음" });

    const accounts = await categoryService.getCategoryAccounts(sessionId);
    res.status(200).json(accounts);
  } catch (err) {
    console.error("카테고리 계좌 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
};

exports.linkCategoryToAccount = async (req, res) => {
  try {
    await categoryService.linkCategoryToAccount(
      req.body.categoryId,
      req.body.accountId
    );
    res.status(200).json({ message: "계좌 연동 성공" });
  } catch (err) {
    console.error("계좌 연동 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
};

exports.getCategoryAccountInfo = async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) return res.status(401).json({ message: "세션 없음" });

    const categoryAccounts = await categoryService.getCategoryAccountInfo(
      sessionId
    );
    res.status(200).json(categoryAccounts);
  } catch (err) {
    console.error("계좌 정보 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
};
