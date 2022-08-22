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
    getTimesheetByMonthForManager,
    filterTimesheetByThisMonthByUser,
    getTimesheetBoard } = require("../controllers/Timesheet")
const isAuthenticated = require("../middleware/auth")
const router = express.Router()
router.route("/checking").post(isAuthenticated, checking)
router.route("/getchecking").get(isAuthenticated, getChecking)
router.route("/getmyrank").get(isAuthenticated, getMyRank)
router.route("/gettop5").get(getTop5)
router.route("/filtertimesheetbytoday").get(isAuthenticated, filterTimesheetByToday)
router.route("/filtertimesheetbyyesterday").get(isAuthenticated, filterTimesheetByYesterday)
router.route("/filtertimesheetbythisweek").get(isAuthenticated, filterTimesheetByThisWeek)
router.route("/filtertimesheetbylastweek").get(isAuthenticated, filterTimesheetByLastWeek)
router.route("/filtertimesheetbythismonth").get(isAuthenticated, filterTimesheetByThisMonth)
router.route("/filtertimesheetbylastmonth").get(isAuthenticated, filterTimesheetByLastMonth)
router.route("/filtertimesheetbyrange").post(isAuthenticated, filterTimesheetByRange)
router.route("/gettimesheetbymonthformanager").get(getTimesheetByMonthForManager)

router.route("/filtertimesheetbythismonthbyuser").get(isAuthenticated, filterTimesheetByThisMonthByUser)
router.route("/gettimesheetboard").get(isAuthenticated, getTimesheetBoard)
module.exports = router