const express = require("express")
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const cookieParser = require("cookie-parser")
app.use(cookieParser())

const cors = require("cors")
app.use(cors())

const fileUpload = require("express-fileupload")
app.use(
    fileUpload({
        limits: { fileSize: 50 * 1024 * 1024 },
        useTempFiles: true
    })
)

const User = require("./routers/User")
const Company = require("./routers/Company")
const Timesheet = require("./routers/Timesheet")
const Task = require("./routers/Task")

app.use("/api/v1/user", User, Timesheet, Task)
app.use("/api/v1/company", Company)

app.get("/", (req, res) => {
    res.send("Server is working")
})

module.exports = app