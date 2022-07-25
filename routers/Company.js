const express = require("express")
const { create, getInformation, updateInformation } = require("../controllers/Company")
const router = express.Router()
router.route("/create").post(create)
router.route("/information").get(getInformation)
router.route("/updateinformation").put(updateInformation)
module.exports = router