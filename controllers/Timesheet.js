const Timesheet = require("../models/Timesheet")
const User = require("../models/User")
const moment = require("moment")
const checkin = async (req, res) => {
    try {
        const date = moment().format("DD/MM/YYYY");
        const checkinTime = moment().format("HH:mm:ss");
        let timesheetSegment = {
            date: date,
            checkinTime: checkinTime,
            checkoutTime: null,
        };

        const user = await User.findById(req.user._id);
        const userId = user.userId;

        let timesheet = await Timesheet.findOne({ userId: userId });
        if (!timesheet) timesheet = await Timesheet.create({
            userId: userId,
            segments: [],
        });

        let index = timesheet.segments.findIndex(x => x.date === date);
        if (index != -1) {
            return res
                .status(400)
                .json({ success: false, message: "Checkin for today already" });
        }

        timesheet.segments.push(timesheetSegment);
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
        const date = moment().format("DD/MM/YYYY");
        const checkoutTime = moment().format("HH:mm:ss");

        const user = await User.findById(req.user._id);
        const userId = user.userId;
        let timesheet = await Timesheet.findOne({ "userId": userId });
        const index = timesheet.segments.findIndex(x => x.date === date);
        timesheet = await Timesheet.findOne({ "userId": userId, "segments[index].date": date });

        timesheet.segments[index].checkoutTime = checkoutTime;

        let timesheetSegment = {
            date: timesheet.segments[index].date,
            checkinTime: timesheet.segments[index].checkinTime,
            checkoutTime: checkoutTime,
        };

        timesheet.segments.pop();
        timesheet.segments.push(timesheetSegment);
        await timesheet.save();

        res
            .status(200)
            .json({ success: true, message: "Checkout successfully" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { checkin, checkout }