const express = require("express")
const { verify,
    register,
    login,
    logout,
    getProfile,
    getMyProfile,
    getAllProfile,
    updateProfile,
    updateAvatar,
    updateDeviceId,
    updatePassword,
    updateAdmin,
    deleteProfile,
    forgetPasswordPhone,
    forgetPasswordEmail,
    resetPassword,
    searchUser,
    searchUserTask } = require("../controllers/User")
const isAuthenticated = require("../middleware/auth")
const router = express.Router()
router.route("/verify").post(isAuthenticated, verify)
router.route("/register").post(isAuthenticated, register)
router.route("/login").post(login)
router.route("/logout").post(logout)
router.route("/getprofile").post(getProfile)
router.route("/getmyprofile").get(isAuthenticated, getMyProfile)
router.route("/getallprofile").get(getAllProfile)
router.route("/updateprofile").put(isAuthenticated, updateProfile)
router.route("/updateavatar").put(isAuthenticated, updateAvatar)
router.route("/updatedeviceid").put(isAuthenticated, updateDeviceId)
router.route("/updatepassword").put(isAuthenticated, updatePassword)
router.route("/updateadmin").put(isAuthenticated, updateAdmin)
router.route("/deleteprofile").delete(isAuthenticated, deleteProfile)
router.route("/forgetpasswordphone").post(forgetPasswordPhone)
router.route("/forgetpasswordemail").post(forgetPasswordEmail)
router.route("/resetpassword").put(resetPassword)
router.route("/searchuser").get(isAuthenticated, searchUser)
router.route("/searchusertask").get(isAuthenticated, searchUserTask)
module.exports = router