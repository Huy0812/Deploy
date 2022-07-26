const express = require("express")
const { checkin, checkout } = require("../controllers/Timesheet")
const isAuthenticated = require("../middleware/auth")
const router = express.Router()
router.route("/checkin").post(isAuthenticated, checkin)
router.route("/checkout").post(isAuthenticated, checkout)
module.exports = router