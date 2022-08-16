const mongoose = require("mongoose")
const taskSchema = new mongoose.Schema({

    // Tên
    name: {
        type: String,
        required: true,
    },

    // Mô tả
    description: {
        type: String,
        required: true,
    },

    // Ngày giao
    date: {
        type: String,
        required: true,
    },

    // Deadline dự kiến
    deadline: {
        type: String,
        required: true,
    },

    // Thời gian hoàn thành thực tế
    actualEndedTime: {
        type: String,
        required: true,
    },

    // Mã người quản lý
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },

    // Người quản lý
    manager: {
        type: String,
        required: true,
    },

    //  Mã người tham gia
    contributorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    //  Người tham gia
    contributors: [{ type: String }],

    // Trạng thái công việc
    status: {
        type: String,
        required: true,
    },

    // Tình trạng hoàn thành
    isDone: [{ type: Boolean }],

    // Tình trạng phê duyệt
    isApproved: {
        type: Boolean,
        required: true,
    },

});

module.exports = mongoose.model("Task", taskSchema);