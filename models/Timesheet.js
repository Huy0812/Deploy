const mongoose = require("mongoose")
const timesheetSchema = new mongoose.Schema({

    //  Mã nhân viên
    userId: {
        type: Number,
        required: true,
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

        },

    }

});

module.exports = mongoose.model("Timesheet", timesheetSchema);