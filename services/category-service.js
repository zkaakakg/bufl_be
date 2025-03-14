const db = require("../db/db");

exports.getCategories = async (sessionId) => {
  const [session] = await db.query(
    "SELECT user_id FROM sessions WHERE session_id = ?",
    [sessionId]
  );

  if (session.length === 0) throw new Error("세션 만료됨");

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
    if (category.name === "월급 통장" || category.name === "💰 월급 통장") {
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

  return result;
};

exports.getCategoryById = async (categoryId) => {
  const [category] = await db.query("SELECT * FROM categories WHERE id = ?", [
    categoryId,
  ]);
  return category;
};

exports.addCategories = async (sessionId, categories) => {
  const [session] = await db.query(
    "SELECT user_id FROM sessions WHERE session_id = ?",
    [sessionId]
  );
  if (session.length === 0) throw new Error("세션 만료됨");

  const userId = session[0].user_id;
  await db.query("DELETE FROM categories WHERE user_id = ?", [userId]);

  const totalPercentage = categories.reduce(
    (sum, category) => sum + (category.ratio || 0),
    0
  );
  if (totalPercentage !== 100) throw new Error("비율합이 100이 되어야 합니다.");

  const [salary] = await db.query(
    "SELECT amount FROM salary WHERE user_id = ?",
    [userId]
  );
  if (salary.length === 0) throw new Error("월급 정보가 없습니다.");

  const values = categories.map((category) => [
    userId,
    category.name,
    category.goal_amount || 0,
    category.background_color,
    category.ratio || 0,
    (salary[0].amount * category.ratio) / 100,
  ]);

  await db.query(
    "INSERT INTO categories (user_id, name, goal_amount, background_color, ratio, amount) VALUES ?",
    [values]
  );
};

exports.deleteCategory = async (categoryId) => {
  await db.query("DELETE FROM categories WHERE id = ?", [categoryId]);
};

exports.getCategoryAccounts = async (sessionId) => {
  const [session] = await db.query(
    "SELECT user_id FROM sessions WHERE session_id = ?",
    [sessionId]
  );
  if (session.length === 0) throw new Error("세션 만료됨");

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
  const validAccounts = categoryAccounts.filter((account) => account !== null);

  return validAccounts;
};

exports.linkCategoryToAccount = async (categoryId, accountId) => {
  await db.query("UPDATE categories SET account_id = ? WHERE id = ?", [
    accountId,
    categoryId,
  ]);
};

exports.getCategoryAccountInfo = async (sessionId) => {
  const [session] = await db.query(
    "SELECT user_id FROM sessions WHERE session_id = ?",
    [sessionId]
  );
  if (session.length === 0) throw new Error("세션 만료됨");

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
          bankName: salaryAccount.length ? salaryAccount[0].bank_name : null,
          accountNumber: salaryAccount.length
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

  return categoryAccounts;
};
