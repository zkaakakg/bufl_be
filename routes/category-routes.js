const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category-controller");

router.get("/category", categoryController.getCategories);
router.get("/category/:id", categoryController.getCategoryById);
router.post("/category", categoryController.addCategories);
router.delete("/category/:id", categoryController.deleteCategory);
router.get("/info", categoryController.getCategoryAccounts);
router.post("/account", categoryController.linkCategoryToAccount);
router.get("/account", categoryController.getCategoryAccountInfo);

module.exports = router;
