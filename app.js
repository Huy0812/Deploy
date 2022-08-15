const express = require("express")
const User = require("./routers/User");
const Company = require("./routers/Company");
const Timesheet = require("./routers/Timesheet");
const Task = require("./routers/Task");
const cors = require("cors")
const fileUpload = require("express-fileupload")
const cookieParser = require("cookie-parser");
const app = express()
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
    fileUpload({
        limits: { fileSize: 50 * 1024 * 1024 },
        useTempFiles: true,
    })
);
app.use(cors());
app.use("/api/v1/user", User, Timesheet, Task);
app.use("/api/v1/company", Company);
app.get("/", (req, res) => {
    res.send("Server is working");
});
module.exports = app