const express = require("express")
const { create,
    getInformation,
    updateInformation,
    updateCompanyIp } = require("../controllers/Company")
const isAuthenticated = require("../middleware/auth")
const router = express.Router()
router.route("/create").post(create)
router.route("/getinformation").get(isAuthenticated, getInformation)
router.route("/updateinformation").put(updateInformation)
router.route("/updatecompanyip").put(isAuthenticated, updateCompanyIp)
module.exports = router