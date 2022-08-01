const mongoose = require("mongoose")
const timesheetSchema = new mongoose.Schema({

    //  Mã nhân viên
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Timesheet',
        required: true,
        unique: true,
    },

    //  Array
    segments: {
        type: Array,
        required: true,

        // Segment
        segment: {
            type: Object,

            // Ngày
            date: {
                type: String,
                required: true,
            },

            // Thời gian checkin
            checkinTime: {
                type: String,
                required: true,
            },

            // Thời gian checkout
            checkoutTime: {
                type: Date,
                required: true,
            },

            // Thời gian làm việc
            workingTime: {
                type: Number,
                required: true,
                default: 0,
            },

        },

    }

});

module.exports = mongoose.model("Timesheet", timesheetSchema);