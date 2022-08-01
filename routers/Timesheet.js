const express = require("express")
const { createTimesheet, checkin, checkout, getTop5, getMyRank, isCheckinEarly, isCheckinLate, isCheckoutEarly, isCheckoutLate, getWorkingTime, getDiffCheckin, getDiffCheckout } = require("../controllers/Timesheet")
const isAuthenticated = require("../middleware/auth")
const router = express.Router()
router.route("/createtimesheet").post(isAuthenticated, createTimesheet)
router.route("/checkin").post(isAuthenticated, checkin)
router.route("/checkout").post(isAuthenticated, checkout)
router.route("/gettop5").get(getTop5)
router.route("/rank").get(isAuthenticated, getMyRank)
router.route("/ischeckinearly").get(isAuthenticated, isCheckinEarly)
router.route("/ischeckinlate").get(isAuthenticated, isCheckinLate)
router.route("/ischeckoutearly").get(isAuthenticated, isCheckoutEarly)
router.route("/ischeckoutlate").get(isAuthenticated, isCheckoutLate)
router.route("/workingtime").get(isAuthenticated, getWorkingTime)
router.route("/diffcheckin").get(isAuthenticated, getDiffCheckin)
router.route("/diffcheckout").get(isAuthenticated, getDiffCheckout)
module.exports = router