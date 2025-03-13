const express = require("express");
const router = express.Router();
const userController = require("../controllers/user-controller");

router.get("/", userController.getStartPage);
router.post("/", userController.registerUser);
router.put("/update-password", userController.updatePassword);
router.get("/pin", userController.getPinPage);
router.post("/pin", userController.verifyPin);
router.get("/salary", userController.getSalaryInfo);
router.post("/salary", userController.addSalaryInfo);
router.get("/interests", userController.getInterestsPage);
router.post("/interests", userController.addInterest);
router.delete("/delete", userController.deleteUser);

module.exports = router;
