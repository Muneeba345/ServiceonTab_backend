const express = require("express");
const router = express.Router();

const signUpController = require("../controllers/signupcontroller");
const loginController = require("../controllers/logincontroller");
const verifyEmailController = require("../controllers/verifyEmailControlle");


require("dotenv").config();


router.post("/signup", signUpController);
router.post("/login", loginController);
router.get("/verifyemail", verifyEmailController);

module.exports = router;
