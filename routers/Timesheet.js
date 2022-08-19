const express = require("express")
const { checking,
    getChecking,
    getMyRank,
    getTop5,
    filterTimesheetByThisMonth,
    getTimesheetByMonthForManager, } = require("../controllers/Timesheet")
const isAuthenticated = require("../middleware/auth")
const router = express.Router()
router.route("/checking").post(isAuthenticated, checking)
router.route("/getchecking").get(isAuthenticated, getChecking)
router.route("/getmyrank").get(isAuthenticated, getMyRank)
router.route("/gettop5").get(getTop5)
router.route("/filtertimesheetbythismonth").get(isAuthenticated, filterTimesheetByThisMonth)
router.route("/gettimesheetbymonthformanager").get(getTimesheetByMonthForManager)
module.exports = router