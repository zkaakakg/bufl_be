const express = require("express");
const router = express.Router();
const db = require("../db/db");

// 카테고리 목록조회
router.get("/category", async (req, res) => {
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

    const [salaryAccount] = await db.query(
      "SELECT bank_name, account_number FROM account WHERE id = (SELECT account_id FROM salary WHERE user_id = ?)",
      [userId]
    );
    const [categories] = await db.query(
      "SELECT id, name, goal_amount, background_color, ratio, amount FROM categories WHERE user_id = ?",
      [userId]
    );

    const result = categories.map((category) => {
      if (category.name === "월급 통장") {
        return {
          ...category,
          bank_name: salaryAccount.length ? salaryAccount[0].bank_name : null,
          account_number: salaryAccount.length
            ? salaryAccount[0].account_number
            : null,
        };
      }
      return category;
    });

    res.status(201).json({ categories: result });
  } catch (err) {
    console.error("월급쪼개기 화면 오류", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 카테고리 단건 조회
router.get("/category/:id", async (req, res) => {
  const categoryId = req.params.id;
  try {
    const [category] = await db.query("SELECT * FROM categories WHERE id = ?", [
      categoryId,
    ]);

    res.status(200).json({ category });
  } catch (err) {
    console.error("월급쪼개기 화면 오류", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 카테고리 추가
router.post("/category", async (req, res) => {
  const sessionId = req.cookies.sessionId;
  const categories = req.body;

  if (!sessionId) return res.status(401).json({ message: "세션 없음" });
  if (!Array.isArray(categories) || categories.length === 0) {
    return res.status(400).json({ message: "카테고리 정보가 잘못되었습니다." });
  }
  try {
    const [session] = await db.query(
      "SELECT user_id FROM sessions WHERE session_id = ?",
      [sessionId]
    );
    //session  없으면 만료
    if (session.length === 0)
      return res.status(401).json({ message: "세션 만료됨" });

    const userId = session[0].user_id;

    const [existCategories] = await db.query(
      "SELECT * FROM categories WHERE user_id = ? ",
      [userId]
    );

    if (existCategories.length > 0) {
      await db.query("DELETE FROM categories WHERE user_id = ?", [userId]);
    }

    let totalPercentage = 0;
    for (const category of categories) {
      totalPercentage += category.ratio || 0;
    }

    if (totalPercentage !== 100) {
      return res.status(400).json({ message: "비율합이 100이 되어야 합니다." });
    }

    const [salary] = await db.query(
      "SELECT amount FROM salary WHERE user_id = ?",
      [userId]
    );
    if (salary.length === 0) {
      return res.status(400).json({ message: "월급 정보가 없습니다." });
    }

    const values = categories.map((category) => {
      const salaryAmount = salary[0]?.amount || 0;
      const amount = (salaryAmount * category.ratio) / 100;
      return [
        userId,
        category.name,
        category.goal_amount || 0,
        category.background_color,
        category.ratio || 0,
        amount,
      ];
    });

    const [result] = await db.query(
      "INSERT INTO categories (user_id, name, goal_amount, background_color, ratio, amount) VALUES ?",
      [values]
    );

    res
      .status(201)
      .json({ message: `${categories.length}개의 카테고리가 추가되었습니다.` });
  } catch (err) {
    console.error("카테고리 추가 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

//카테고리 계좌 정보 조회
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

// 카테고리 삭제
router.delete("/category/:id", async (req, res) => {
  try {
    const categoryId = req.params.id;

    const [category] = await db.query("SELECT * FROM categories WHERE id = ?", [
      categoryId,
    ]);

    if (category.length === 0) {
      return res.status(400).json({ message: "카테고리가 없습니다." });
    }

    const [result] = await db.query("DELETE FROM categories WHERE id =?", [
      categoryId,
    ]);

    res.status(200).json({ message: "카테고리 삭제 성공" });
  } catch (err) {
    console.error("카테고리 삭제 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 카테고리-계좌 연동
router.post("/account", async (req, res) => {
  const { categoryId, accountId } = req.body;

  if (!accountId) {
    return res.status(400).json({ message: "계좌정보를 입력하세요" });
  }
  try {
    const [result] = await db.query(
      "UPDATE categories SET account_id = ? WHERE id = ? ",
      [accountId, categoryId]
    );

    res.status(200).json({ message: "계좌 연동 성공" });
  } catch (err) {
    console.error("계좌 연동 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 카테고리-계좌 조회
router.get("/account", async (req, res) => {
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

    const [salaryAccount] = await db.query(
      "SELECT bank_name, account_number FROM account WHERE id IN (SELECT account_id FROM salary WHERE user_id = ?)",
      [userId]
    );

    if (categories.length === 0) {
      return res.status(404).json({ message: "카테고리가 없습니다." });
    }

    const categoryAccounts = await Promise.all(
      categories.map(async (category) => {
        if (category.name === "월급 통장") {
          return {
            name: category.name,
            bank_name: salaryAccount.length ? salaryAccount[0].bank_name : null,
            account_number: salaryAccount.length
              ? salaryAccount[0].account_number
              : null,
          };
        }
        const [account] = await db.query(
          "SELECT bank_name, account_number FROM account WHERE id = ?",
          [category.account_id]
        );

        return {
          name: category.name,
          bankName: account[0]?.bank_name || "정보 없음",
          accountNumber: account[0]?.account_number || "정보 없음",
        };
      })
    );

    res.status(200).json(categoryAccounts);
  } catch (err) {
    console.error("계좌 정보 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
