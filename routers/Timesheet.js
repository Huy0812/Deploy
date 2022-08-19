const express = require("express")
const { checking,
    getChecking,
    getMyRank,
    getTop5,
    filterTimesheetByToday,
    filterTimesheetByYesterday,
    filterTimesheetByThisWeek,
    filterTimesheetByLastWeek,
    filterTimesheetByThisMonth,
    filterTimesheetByLastMonth,
    filterTimesheetByRange,
    getTimesheetByMonthForManager, } = require("../controllers/Timesheet")
const isAuthenticated = require("../middleware/auth")
const router = express.Router()
router.route("/checking").post(isAuthenticated, checking)
router.route("/getchecking").get(isAuthenticated, getChecking)
router.route("/getmyrank").get(isAuthenticated, getMyRank)
router.route("/gettop5").get(getTop5)
router.route("/filtertimesheetbytoday").get(isAuthenticated, filterTimesheetByToday)
router.route("/filtertimesheetbyyesterday").get(isAuthenticated, filterTimesheetByYesterday)
router.route("/filtertimesheetbythisweek").get(isAuthenticated, filterTimesheetByThisWeek)
router.route("/filtertimesheetbylastWeek").get(isAuthenticated, filterTimesheetByLastWeek)
router.route("/filtertimesheetbythismonth").get(isAuthenticated, filterTimesheetByThisMonth)
router.route("/filtertimesheetbylastmonth").get(isAuthenticated, filterTimesheetByLastMonth)
router.route("/filtertimesheetbyrange").get(isAuthenticated, filterTimesheetByRange)
router.route("/gettimesheetbymonthformanager").get(getTimesheetByMonthForManager)
module.exports = router