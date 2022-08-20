const Task = require("../models/Task")
const User = require("../models/User")
const moment = require("moment")
const momenttz = require("moment-timezone")
const mongoose = require("mongoose")

// Tạo công việc
const createTask = async (req, res) => {
    try {
        //var userIds = JSON.parse(req.body.users);
        const userIds = req.body.users.map(s => mongoose.Types.ObjectId(s));
        const name = req.body.name;
        const description = req.body.description;
        const deadline = req.body.deadline;
        const isDone = [];
        for (let i = 0; i < req.body.users.length; i++) {
            isDone.push(false);
        }
        const currentTime = moment().tz('Asia/Ho_Chi_Minh');
        await Task.create({
            name: name,
            description: description,
            date: String(currentTime),
            deadline: deadline,
            actualEndedTime: "N/A",
            managerId: req.user._id,
            contributorIds: userIds,
            status: "Chưa hoàn thành",
            isDone: isDone,
            isApproved: false,
        });
        res.status(200).json({ success: true, message: "Tạo công việc thành công" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const searchTask = async (req, res) => {
    try {
        const name = req.query.name
            ? {
                name: { $regex: req.query.name, $options: "i" }
            }
            : {};
        const users = await User.find(name)
            .status(200)
            .json({ success: true, message: "Người dùng", array: users })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Sửa công việc
const updateTask = async (req, res) => {
    try {
        const { taskId, name, description, deadline } = req.body;

        const task = await Task.findById(taskId);
        if (name) task.name = name;
        if (description) task.description = description;
        if (deadline) task.deadline = deadline;
        await task.save();

        return res
            .status(200)
            .json({ success: true, message: "Cập nhật công việc thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Xóa công việc
const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.body;
        const task = await Task.findById(taskId);
        if (!task) {
            return res
                .status(404)
                .json({ success: false, message: "Không tồn tại" });
        }
        await Task.findByIdAndDelete(taskId);
        res
            .status(200)
            .json({ success: true, message: "Xóa công việc thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getTaskById = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (
            user.privilege !== "Quản trị viên" &&
            user.privilege !== "Quản lý"
        ) {
            return res
                .status(403)
                .json({
                    success: false,
                    message: "Bạn không có quyền truy cập chức năng này",
                });
        }
        const tasks = await Task.find({ contributorIds: req.params._id })

        let myTasks = [];
        for (let i = 0; i < tasks.length; i++) {
            let manager = await User.findById(tasks[i].managerId);
            let managerName = manager.name;
            let contributorsName = [];
            for (let j = 0; j < tasks[i].contributorIds.length; j++) {
                let contributor = await User.findById(tasks[i].contributorIds[j]);
                contributorsName.push(contributor.name);
            }
            let taskTemp = {
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
            myTasks.push(taskTemp);
        }

        res
            .status(200)
            .json({ success: true, message: `Công việc`, tasks: myTasks });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy công việc của nhân viên (với vai trò quản lý)
const getMyTaskAsManager = async (req, res) => {
    try {
        const tasks = await Task.find({ managerId: req.user._id });
        tasks.sort(function (a, b) {
            return moment(a.deadline, "HH:mm, DD/MM/YYYY") - moment(b.deadline, "HH:mm, DD/MM/YYYY");
        });

        let myTasksAsManager = [];
        for (let i = 0; i < tasks.length; i++) {
            let manager = await User.findById(tasks[i].managerId);
            let managerName = manager.name;
            let contributorsName = [];
            for (let j = 0; j < tasks[i].contributorIds.length; j++) {
                let contributor = await User.findById(tasks[i].contributorIds[j]);
                contributorsName.push(contributor.name);
            }
            let taskTemp = {
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
            myTasksAsManager.push(taskTemp);
        }

        res
            .status(200)
            .json({ success: true, message: `Công việc của tôi (quản lý)`, tasks: myTasksAsManager });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy công việc của nhân viên (với vai trò người tham gia)
const getMyTaskAsContributor = async (req, res) => {
    try {
        const tasks = await Task.find({ contributorIds: req.user._id });
        tasks.sort(function (a, b) {
            return moment(a.deadline, "HH:mm, DD/MM/YYYY") - moment(b.deadline, "HH:mm, DD/MM/YYYY")
        });

        let myTasksAsContributor = [];
        for (let i = 0; i < tasks.length; i++) {
            let manager = await User.findById(tasks[i].managerId);
            let managerName = manager.name;
            let contributorsName = [];
            for (let j = 0; j < tasks[i].contributorIds.length; j++) {
                let contributor = await User.findById(tasks[i].contributorIds[j]);
                contributorsName.push(contributor.name);
            }
            let taskTemp = {
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
            myTasksAsContributor.push(taskTemp);
        }

        res
            .status(200)
            .json({ success: true, message: `Công việc của tôi (tham gia)`, tasks: myTasksAsContributor });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy tất cả công việc
const getAllTask = async (req, res) => {
    try {
        const tasks = await Task.find();
        tasks.sort(function (a, b) {
            return moment(a.deadline, "HH:mm, DD/MM/YYYY") - moment(b.deadline, "HH:mm, DD/MM/YYYY")
        });

        let tasksAll = [];
        for (let i = 0; i < tasks.length; i++) {
            let manager = await User.findById(tasks[i].managerId);
            let managerName = manager.name;
            let contributorsName = [];
            for (let j = 0; j < tasks[i].contributorIds.length; j++) {
                let contributor = await User.findById(tasks[i].contributorIds[j]);
                contributorsName.push(contributor.name);
            }
            let taskTemp = {
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
            tasksAll.push(taskTemp);
        }

        res
            .status(200)
            .json({ success: true, message: `Tất cả công việc`, tasks: tasksAll });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Đánh dấu công việc
const checkingTask = async (req, res) => {
    try {
        const { taskId } = req.body;
        const task = await Task.findById(taskId);
        const index = task.contributorIds.findIndex(x => x.equals(req.user._id));

        if (!task.isDone[index]) {
            task.isDone[index] = true;
            await task.save();
            return res
                .status(200)
                .json({ success: true, message: `Công việc đã hoàn thành` });
        }
        task.isDone[index] = false;
        await task.save();

        return res
            .status(200)
            .json({ success: true, message: `Công việc chưa hoàn thành` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createTask,
    searchTask,
    updateTask,
    deleteTask,
    getTaskById,
    getMyTaskAsManager,
    getMyTaskAsContributor,
    getAllTask,
    checkingTask
}