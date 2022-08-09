const express = require("express")
const { checking, getTimesheetInfo, getTop5, getMyRank, filterTimesheetDataByToday, filterTimesheetDataByYesterday, filterTimesheetDataByThisWeek, filterTimesheetDataByLastWeek, filterTimesheetDataByThisMonth, filterTimesheetDataByLastMonth, filterTimesheetDataByRange } = require("../controllers/Timesheet")
const isAuthenticated = require("../middleware/auth")
const router = express.Router()
router.route("/checking").post(isAuthenticated, checking)
router.route("/timesheetinfo").get(isAuthenticated, getTimesheetInfo)
router.route("/top5").get(getTop5)
router.route("/rank").get(isAuthenticated, getMyRank)
router.route("/filtertimesheetdatabytoday").get(isAuthenticated, filterTimesheetDataByToday)
router.route("/filtertimesheetdatabyyesterday").get(isAuthenticated, filterTimesheetDataByYesterday)
router.route("/filtertimesheetdatabythisweek").get(isAuthenticated, filterTimesheetDataByThisWeek)
router.route("/filtertimesheetdatabylastweek").get(isAuthenticated, filterTimesheetDataByLastWeek)
router.route("/filtertimesheetdatabythismonth").get(isAuthenticated, filterTimesheetDataByThisMonth)
router.route("/filtertimesheetdatabylastmonth").get(isAuthenticated, filterTimesheetDataByLastMonth)
router.route("/filtertimesheetdatabyrange").post(isAuthenticated, filterTimesheetDataByRange)
module.exports = router