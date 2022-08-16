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

        let isDone = [];
        for (let i = 0; i < req.body.users.length; i++) {
            isDone.push(false);
        }

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
            isDone: isDone,
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

        myTasks = [];
        for (let i = 0; i < tasks.length; i++) {
            manager = await User.findById(tasks[i].managerId)
            managerName = manager.name
            contributorsName = []
            for (let j = 0; j < tasks[i].contributorIds.length; j++) {
                contributor = await User.findById(tasks[i].contributorIds[j])
                contributorsName.push(contributor.name)
            }

            taskTemp = {
                _id: tasks[i]._id,
                name: tasks[i].name,
                description: tasks[i].description,
                date: tasks[i].date,
                deadline: tasks[i].deadline,
                actualEndedTime: tasks[i].actualEndedTime,
                manager: managerName,
                contributors: contributorsName,
                status: tasks[i].status,
                isDone: tasks[i].isDone,
                isApproved: tasks[i].isApproved,
            }
            myTasks.push(taskTemp)
        }

        res
            .status(200)
            .json({ success: true, message: `Task list`, tasks: myTasks });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy Task của nhân viên (với vai trò quản lý)
const getMyTaskAsManager = async (req, res) => {
    try {
        const tasks = await Task.find({ managerId: req.user._id });

        myTasksAsManager = [];
        for (let i = 0; i < tasks.length; i++) {
            manager = await User.findById(tasks[i].managerId)
            managerName = manager.name
            contributorsName = []
            for (let j = 0; j < tasks[i].contributorIds.length; j++) {
                contributor = await User.findById(tasks[i].contributorIds[j])
                contributorsName.push(contributor.name)
            }

            taskTemp = {
                _id: tasks[i]._id,
                name: tasks[i].name,
                description: tasks[i].description,
                date: tasks[i].date,
                deadline: tasks[i].deadline,
                actualEndedTime: tasks[i].actualEndedTime,
                manager: managerName,
                contributors: contributorsName,
                status: tasks[i].status,
                isDone: tasks[i].isDone,
                isApproved: tasks[i].isApproved,
            }
            myTasksAsManager.push(taskTemp)
        }

        res
            .status(200)
            .json({ success: true, message: `Task list`, tasks: myTasksAsManager });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy Task của nhân viên (với vai trò người tham gia)
const getMyTaskAsContributor = async (req, res) => {
    try {
        const tasks = await Task.find({ contributorIds: req.user._id });

        myTasksAsContributor = [];
        for (let i = 0; i < tasks.length; i++) {
            manager = await User.findById(tasks[i].managerId)
            managerName = manager.name
            contributorsName = []
            for (let j = 0; j < tasks[i].contributorIds.length; j++) {
                contributor = await User.findById(tasks[i].contributorIds[j])
                contributorsName.push(contributor.name)
            }

            taskTemp = {
                _id: tasks[i]._id,
                name: tasks[i].name,
                description: tasks[i].description,
                date: tasks[i].date,
                deadline: tasks[i].deadline,
                actualEndedTime: tasks[i].actualEndedTime,
                manager: managerName,
                contributors: contributorsName,
                status: tasks[i].status,
                isDone: tasks[i].isDone,
                isApproved: tasks[i].isApproved,
            }
            myTasksAsContributor.push(taskTemp)
        }

        res
            .status(200)
            .json({ success: true, message: `Task list`, tasks: myTasksAsContributor });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy tất cả Task
const getAllTask = async (req, res) => {
    try {
        var tasks = await Task.find()

        tasksAll = [];
        for (let i = 0; i < tasks.length; i++) {
            manager = await User.findById(tasks[i].managerId)
            managerName = manager.name
            contributorsName = []
            for (let j = 0; j < tasks[i].contributorIds.length; j++) {
                contributor = await User.findById(tasks[i].contributorIds[j])
                contributorsName.push(contributor.name)
            }

            taskTemp = {
                _id: tasks[i]._id,
                name: tasks[i].name,
                description: tasks[i].description,
                date: tasks[i].date,
                deadline: tasks[i].deadline,
                actualEndedTime: tasks[i].actualEndedTime,
                manager: managerName,
                contributors: contributorsName,
                status: tasks[i].status,
                isDone: tasks[i].isDone,
                isApproved: tasks[i].isApproved,
            }
            tasksAll.push(taskTemp)
        }

        res
            .status(200)
            .json({ success: true, message: `Task list`, tasks: tasksAll });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Đánh dấu Task
const checkingTask = async (req, res) => {
    try {
        const { taskId } = req.body;

        const task = await Task.findById(taskId)

        let index = task.contributorIds.findIndex(x => x.equals(req.user._id));

        if (!task.isDone[index]) {
            task.isDone[index] = true;
            await task.save();
            return res
                .status(200)
                .json({ success: true, message: `Checking Task as Done` });
        }
        task.isDone[index] = false;
        await task.save();
        return res
            .status(200)
            .json({ success: true, message: `Checking Task as Not done` });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Đếm Task (đã hoàn thành)
const countTaskAsDone = async (req, res) => {
    try {
        const tasks = await Task.find({ contributorIds: req.user._id });

        let count = tasks.filter(obj => {
            if (obj.status === "Đã hoàn thành") {
                return true;
            }
            return false;
        }).length;

        return res
            .status(200)
            .json({ success: true, message: `Number of Done Task`, count: count });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Đếm Task (chưa hoàn thành)
const countTaskAsNotDone = async (req, res) => {
    try {
        const tasks = await Task.find({ contributorIds: req.user._id });

        let count = tasks.filter(obj => {
            if (obj.status === "Chưa hoàn thành") {
                return true;
            }
            return false;
        }).length;

        return res
            .status(200)
            .json({ success: true, message: `Number of Done Task`, count: count });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Đếm Task (quá hạn)
const countTaskAsOutOfDate = async (req, res) => {
    try {
        const tasks = await Task.find({ contributorIds: req.user._id });

        let count = tasks.filter(obj => {
            if (obj.status === "Quá hạn") {
                return true;
            }
            return false;
        }).length;

        return res
            .status(200)
            .json({ success: true, message: `Number of Done Task`, count: count });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Đếm Task (tất cả)
const countTaskAll = async (req, res) => {
    try {
        const tasks = await Task.find()

        let count = tasks.length;

        return res
            .status(200)
            .json({ success: true, message: `Number of Done Task`, count: count });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createTask, updateTask, deleteTask, getMyTask, getMyTaskAsManager, getMyTaskAsContributor, getAllTask, checkingTask, countTaskAsDone, countTaskAsNotDone, countTaskAsOutOfDate, countTaskAll }