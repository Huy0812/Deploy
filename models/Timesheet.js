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
            },

            // Thời gian checkin
            checkinTime: {
                type: String,
            },

            // Thời gian checkout
            checkoutTime: {
                type: String,
            },

        },

    }

});

module.exports = mongoose.model("Timesheet", timesheetSchema);