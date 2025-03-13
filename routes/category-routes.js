const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category-controller");
const db = require("../db/db");

router.get("/category", categoryController.getCategories);
router.get("/category/:id", categoryController.getCategoryById);
router.post("/category", categoryController.addCategories);
router.delete("/category/:id", categoryController.deleteCategory);
router.get("/info", async (req, res) => {
  const sessionId = req.cookies.sessionId;

  if (!sessionId) return res.status(401).json({ message: "세션 없음" });
  try {
    const [session] = await db.query(
      "SELECT user_id FROM sessions WHERE session_id = ?",
      [sessionId]
    );
    //session  없으면 만료
    if (session.length === 0)
      return res.status(401).json({ message: "세션 만료됨" });
    const userId = session[0].user_id;

    const [categories] = await db.query(
      "SELECT name, account_id FROM categories WHERE user_id = ?",
      [userId]
    );

    if (categories.length == 0) {
      return res.status(400).json({ message: "카테고리가 없습니다." });
    }

    const categoryAccounts = await Promise.all(
      categories.map(async (category) => {
        const [account] = await db.query("SELECT * FROM account WHERE id = ?", [
          category.account_id,
        ]);

        if (account.length === 0) {
          return null; // continue 대신 null 반환
        }
        return {
          name: category.name,
          bankName: account[0]?.bank_name || "정보 없음",
          accountNumber: account[0]?.account_number || "정보 없음",
          balance: account[0]?.balance || 0,
          logo: account[0].logo,
        };
      })
    );
    const validAccounts = categoryAccounts.filter(
      (account) => account !== null
    );

    res.status(200).json(validAccounts);
  } catch (err) {
    console.error("계좌 정보 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

router.post("/account", categoryController.linkCategoryToAccount);
router.get("/account", categoryController.getCategoryAccountInfo);

module.exports = router;
