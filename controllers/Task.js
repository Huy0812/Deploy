const Task = require("../models/Task")
const User = require("../models/User")
const moment = require("moment")
const momenttz = require("moment-timezone")
const mongoose = require("mongoose")

// Tạo Task
const createTask = async (req, res) => {
    try {
        //var userIds = JSON.parse(req.body.users);
        let userIds = req.body.users.map(s => mongoose.Types.ObjectId(s));
        var name = req.body.name;
        var description = req.body.description;
        var deadline = req.body.deadline;

        const currentTime = moment().tz('Asia/Ho_Chi_Minh');

        task = await Task.create({
            name: name,
            description: description,
            date: String(currentTime),
            deadline: deadline,
            actualEndedTime: "N/A",
            managerId: req.user._id,
            contributorIds: userIds,
            status: "Đã giao",
            isApproved: false,
        });
        res.status(200).json({ success: true, message: "Create task successfully" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Sửa Task
const updateTask = async (req, res) => {
    try {
        const { taskId, name, description, deadline } = req.body;

        const task = await Task.findById(taskId)

        if (name) task.name = name;
        if (description) task.description = description;
        if (deadline) task.deadline = deadline;

        await task.save()
        return res
            .status(200)
            .json({ success: true, message: "Updated task successfully" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Xóa Task
const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.body;
        const task = await Task.findById(taskId)
        if (!task) {
            return res
                .status(404)
                .json({ success: false, message: "None exists" });
        }
        await Task.findByIdAndDelete(taskId)
        res
            .status(200)
            .json({ success: true, message: "Deleted task successfully" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy Task của nhân viên (với mọi vai trò)
const getMyTask = async (req, res) => {
    try {
        const tasks = await Task.find({ $or: [{ managerId: req.user._id }, { contributorIds: req.user._id }] })

        res
            .status(200)
            .json({ success: true, message: `Task list`, tasks: tasks });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy Task của nhân viên (với vai trò quản lý)
const getMyTaskAsManager = async (req, res) => {
    try {
        const tasks = await Task.find({ managerId: req.user._id });

        res
            .status(200)
            .json({ success: true, message: `Task list`, tasks: tasks });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy Task của nhân viên (với vai trò người tham gia)
const getMyTaskAsContributor = async (req, res) => {
    try {
        const tasks = await Task.find({ contributorIds: req.user._id });

        res
            .status(200)
            .json({ success: true, message: `Task list`, tasks: tasks });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy tất cả Task
const getAllTask = async (req, res) => {
    try {
        const tasks = await Task.find()

        res
            .status(200)
            .json({ success: true, message: `Task list`, tasks: tasks });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Đánh dấu Task là đã hoàn thành
const checkingTaskAsDone = async (req, res) => {

};

module.exports = { createTask, updateTask, deleteTask, getMyTask, getMyTaskAsManager, getMyTaskAsContributor, getAllTask }