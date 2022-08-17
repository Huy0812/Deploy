const express = require("express")
const { createTask, updateTask, deleteTask, getMyTask, getMyTaskAsManager, getMyTaskAsContributor, getTaskById, getAllTask, checkingTask, countMyTaskAsContributor, countMyTaskAsManager } = require("../controllers/Task")
const isAuthenticated = require("../middleware/auth")
const router = express.Router()
router.route("/createtask").post(isAuthenticated, createTask)
router.route("/updatetask").put(isAuthenticated, updateTask)
router.route("/deletetask").delete(isAuthenticated, deleteTask)
router.route("/mytask").get(isAuthenticated, getMyTask)
router.route("/mytaskasmanager").get(isAuthenticated, getMyTaskAsManager)
router.route("/mytaskascontributor").get(isAuthenticated, getMyTaskAsContributor)
router.route("/alltask").get(isAuthenticated, getAllTask)
router.route("/checkingtask").post(isAuthenticated, checkingTask)
router.route("/counttaskascontributor").get(isAuthenticated, countMyTaskAsContributor)
router.route("/counttaskasmanager").get(isAuthenticated, countMyTaskAsManager)
router.route("/:_id").get(isAuthenticated, getTaskById)

module.exports = router