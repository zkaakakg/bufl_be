const express = require("express");
const session = require("express-session");
const router = express.Router();
const db = require("../db/db");

/**
 * @swagger
 * tags:
 *   name: Category
 *   description: 카테고리 관련 API
 */

/**
 * @swagger
 * /api/salary/category:
 *   get:
 *     summary: 카테고리 목록 조회
 *     description: 로그인한 사용자의 카테고리 목록을 조회합니다.
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: 카테고리 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       goal_amount:
 *                         type: integer
 *                       background_color:
 *                         type: string
 *                       ratio:
 *                         type: integer
 *                       amount:
 *                         type: integer
 *                       bank_name:
 *                         type: string
 *                       account_number:
 *                         type: string
 *       400:
 *         description: 로그인되지 않음
 *       500:
 *         description: 서버 오류
 */
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

/**
 * @swagger
 * /api/salary/category/{id}:
 *   get:
 *     summary: 카테고리 단건 조회
 *     description: 특정 카테고리를 조회합니다.
 *     tags: [Category]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 카테고리 ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 카테고리 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     goal_amount:
 *                       type: integer
 *                     background_color:
 *                       type: string
 *                     ratio:
 *                       type: integer
 *                     amount:
 *                       type: integer
 *       500:
 *         description: 서버 오류
 */
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

/**
 * @swagger
 * /api/salary/category:
 *   post:
 *     summary: 카테고리 추가
 *     description: 사용자가 카테고리를 추가합니다.
 *     tags: [Category]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 goal_amount:
 *                   type: integer
 *                 background_color:
 *                   type: string
 *                 ratio:
 *                   type: integer
 *     responses:
 *       201:
 *         description: 카테고리 추가 성공
 *       400:
 *         description: 입력 값 오류 (카테고리 정보 오류, 비율 합 100% 미만 등)
 *       500:
 *         description: 서버 오류
 */
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
/**
 * @swagger
 * /api/salary/info:
 *   get:
 *     summary: 사용자의 카테고리별 계좌 정보 조회
 *     description: 사용자의 카테고리에 연결된 계좌 정보를 조회하여 반환합니다.
 *     tags:
 *       - Category
 *     parameters:
 *       - in: cookie
 *         name: sessionId
 *         required: true
 *         description: 사용자 세션 ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 카테고리별 계좌 정보 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: 카테고리 이름
 *                   bankName:
 *                     type: string
 *                     description: 은행 이름
 *                   accountNumber:
 *                     type: string
 *                     description: 계좌 번호
 *                   balance:
 *                     type: number
 *                     description: 계좌 잔액
 *                   logo:
 *                     type: string
 *                     description: 은행 로고 URL
 *       400:
 *         description: 사용자의 카테고리가 없음
 *       401:
 *         description: 세션 없음 또는 세션 만료됨
 *       500:
 *         description: 서버 오류
 */
//기존 카테고리 api에 "계좌 정보(bankName, accountNumber, amount : 잔액) + 아이콘 이미지"
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

/**
 * @swagger
 * /api/salary/category/{id}:
 *   delete:
 *     summary: 카테고리 삭제
 *     description: 특정 카테고리를 삭제합니다.
 *     tags: [Category]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 카테고리 ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 카테고리 삭제 성공
 *       400:
 *         description: 해당 카테고리가 존재하지 않음
 *       500:
 *         description: 서버 오류
 */
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

/**
 * @swagger
 * /api/salary/account:
 *   post:
 *     summary: 계좌 연동
 *     description: 카테고리에 계좌를 연동합니다.
 *     tags: [Category]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: integer
 *               accountId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 계좌 연동 성공
 *       400:
 *         description: 계좌 정보 미제공
 *       500:
 *         description: 서버 오류
 */
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

/**
 * @swagger
 * /api/salary/account:
 *   get:
 *     summary: 연동 계좌 목록 조회
 *     description: 사용자의 연동된 계좌 목록을 조회합니다.
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: 계좌 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   bankName:
 *                     type: string
 *                   accountNumber:
 *                     type: string
 *       500:
 *         description: 서버 오류
 */
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
