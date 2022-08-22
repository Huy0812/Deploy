const express = require("express")
const { createTask,
    searchTask,
    updateTask,
    deleteTask,
    getTaskById,
    getMyTaskAsManager,
    getMyTaskAsContributor,
    getAllTask,
    checkingTask,
    approvingTask } = require("../controllers/Task")
const isAuthenticated = require("../middleware/auth")
const router = express.Router()
router.route("/createtask").post(isAuthenticated, createTask)
router.route("/searchtask").get(isAuthenticated, searchTask)
router.route("/updatetask").put(isAuthenticated, updateTask)
router.route("/deletetask").delete(isAuthenticated, deleteTask)
router.route("/getmytaskasmanager").get(isAuthenticated, getMyTaskAsManager)
router.route("/getmytaskascontributor").get(isAuthenticated, getMyTaskAsContributor)
router.route("/getalltask").get(isAuthenticated, getAllTask)
router.route("/checkingtask").post(isAuthenticated, checkingTask)
router.route("/approvingtask").post(isAuthenticated, approvingTask)
router.route("/:_id").get(isAuthenticated, getTaskById)
module.exports = router