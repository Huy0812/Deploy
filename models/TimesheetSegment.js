const mongoose = require("mongoose")
const timesheetSegmentsSchema = new mongoose.Schema({

    //  Mã nhân viên
    userId: {
        type: Number,
        required: true,
        unique: true,
    },

    // Ngày
    date: {
        type: Date,
    },

    // Thời gian checkin
    checkin: {
        type: Date,
    },

    // Thời gian checkout
    checkout: {
        type: Date,
    },

});

module.exports = mongoose.model("TimesheetSegment", timesheetSegmentsSchema);