const express = require("express")
const { checkin, checkout, getTop5 } = require("../controllers/Timesheet")
const isAuthenticated = require("../middleware/auth")
const router = express.Router()
router.route("/checkin").post(isAuthenticated, checkin)
router.route("/checkout").post(isAuthenticated, checkout)
router.route("/gettop5").get(getTop5)
module.exports = router