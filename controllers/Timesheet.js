const Timesheet = require("../models/Timesheet")
const User = require("../models/User")
const moment = require("moment")
const checkin = async (req, res) => {
    try {
        const date = moment().format("DD/MM/YYYY");
        const checkinTime = moment().format("hh:mm:ss");
        let timesheetSegment = {
            date: date,
            checkinTime: checkinTime,
            checkoutTime: null,
        };

        const user = await User.findById(req.user._id);
        const userId = user.userId;

        let timesheet = await Timesheet.findOne({ userId: userId });
        if (!timesheet) timesheet = await Timesheet.create(({
            userId: userId,
            timesheetSegment: {}
        }));

        timesheet.timesheetSegment = Object.assign({}, timesheetSegment);
        await timesheet.save();
        res
            .status(200)
            .json({ success: true, message: "Checkin successfully" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const checkout = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const userId = user.userId;
        const date = moment().format("DD/MM/YYYY");
        const checkoutTime = moment().format("hh:mm:ss");
        await Timesheet.findOneAndUpdate({ "userId": userId, "timesheetSegment.date": date }, { $set: { "timesheetSegment.checkoutTime": checkoutTime } })
        res
            .status(200)
            .json({ success: true, message: "Checkout successfully" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { checkin, checkout }