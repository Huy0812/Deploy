const Timesheet = require("../models/Timesheet")
const User = require("../models/User")
const moment = require("moment")
const createTimesheet = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const userId = user.userId;

        let timesheet = await Timesheet.findOne({ userId: userId });
        if (timesheet) {
            return res
                .status(400)
                .json({ success: false, message: "Created timesheet already" });
        }
        timesheet = await Timesheet.create({
            userId: userId,
            segments: [],
        })
        res
            .status(200)
            .json({ success: false, message: "Created timesheet successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

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
        let timesheet = await Timesheet.findOne({ "userId": userId });
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

const getTop5 = async (req, res) => {
    try {
        let timesheet = await Timesheet.find();
        sort = timesheet.sort((a, b) => moment(a.segments[a.segments.length - 1].checkinTime, "HH:mm:ss", true) - moment(b.segments[b.segments.length - 1].checkinTime, "HH:mm:ss", true));

        let top = sort.slice(0, 4);

        res
            .status(400)
            .json(top);

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getMyRank = async (req, res) => {
    try {
        let timesheet = await Timesheet.find();
        sort = timesheet.sort((a, b) => moment(a.segments[a.segments.length - 1].checkinTime, "HH:mm:ss", true) - moment(b.segments[b.segments.length - 1].checkinTime, "HH:mm:ss", true));

        const user = await User.findById(req.user._id);
        const userId = user.userId;

        let rank = sort.findIndex(x => x.userId === userId) + 1;

        res
            .status(400)
            .json(rank);

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const isCheckinEarly = async (req, res) => {
    try {
        const date = moment().format("DD/MM/YYYY");
        const user = await User.findById(req.user._id);
        const userId = user.userId;
        let timesheet = await Timesheet.findOne({ userId: userId });
        let index = timesheet.segments.findIndex(x => x.date === date);
        if (moment(timesheet.segments[index].checkinTime, "HH:mm:ss").isBefore(moment("08:30:00", "HH:mm:ss"))) {
            return res
                .status(400)
                .json(true);
        }
        res
            .status(400)
            .json(false);

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

const isCheckinLate = async (req, res) => {
    try {
        const date = moment().format("DD/MM/YYYY");
        const user = await User.findById(req.user._id);
        const userId = user.userId;
        let timesheet = await Timesheet.findOne({ userId: userId });
        let index = timesheet.segments.findIndex(x => x.date === date);
        if (moment(timesheet.segments[index].checkinTime, "HH:mm:ss").isAfter(moment("08:30:00", "HH:mm:ss"))) {
            return res
                .status(400)
                .json(true);
        }
        res
            .status(400)
            .json(false);

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

const isCheckoutEarly = async (req, res) => {
    try {
        const date = moment().format("DD/MM/YYYY");
        const user = await User.findById(req.user._id);
        const userId = user.userId;
        let timesheet = await Timesheet.findOne({ userId: userId });
        let index = timesheet.segments.findIndex(x => x.date === date);
        if (moment(timesheet.segments[index].checkoutTime, "HH:mm:ss").isBefore(moment("18:00:00", "HH:mm:ss"))) {
            return res
                .status(400)
                .json(true);
        }
        res
            .status(400)
            .json(false);

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

const isCheckoutLate = async (req, res) => {
    try {
        const date = moment().format("DD/MM/YYYY");
        const user = await User.findById(req.user._id);
        const userId = user.userId;
        let timesheet = await Timesheet.findOne({ userId: userId });
        let index = timesheet.segments.findIndex(x => x.date === date);
        if (moment(timesheet.segments[index].checkoutTime, "HH:mm:ss").isAfter(moment("18:00:00", "HH:mm:ss"))) {
            return res
                .status(400)
                .json(true);
        }
        res
            .status(400)
            .json(false);

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

const getWorkingTime = async (req, res) => {
    try {
        const date = moment().format("DD/MM/YYYY");
        const user = await User.findById(req.user._id);
        const userId = user.userId;
        let timesheet = await Timesheet.findOne({ userId: userId });
        let index = timesheet.segments.findIndex(x => x.date === date);

        let workingTime = moment.duration(moment(timesheet.segments[index].checkoutTime, "HH:mm:ss").diff(moment(timesheet.segments[index].checkinTime, "HH:mm:ss"))).asHours();

        res
            .status(400)
            .json(workingTime);

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

const getDiffCheckin = async (req, res) => {
    try {
        const date = moment().format("DD/MM/YYYY");
        const user = await User.findById(req.user._id);
        const userId = user.userId;
        let timesheet = await Timesheet.findOne({ userId: userId });
        let index = timesheet.segments.findIndex(x => x.date === date);

        let diff = moment.duration(moment("08:30:00", "HH:mm:ss").diff(moment(timesheet.segments[index].checkinTime, "HH:mm:ss"))).asHours();
        return res
            .status(400)
            .json(diff);

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}


const getDiffCheckout = async (req, res) => {
    try {
        const date = moment().format("DD/MM/YYYY");
        const user = await User.findById(req.user._id);
        const userId = user.userId;
        let timesheet = await Timesheet.findOne({ userId: userId });
        let index = timesheet.segments.findIndex(x => x.date === date);

        let diff = moment.duration(moment("18:00:00", "HH:mm:ss").diff(moment(timesheet.segments[index].checkoutTime, "HH:mm:ss"))).asHours();
        return res
            .status(400)
            .json(diff);

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}


module.exports = { createTimesheet, checkin, checkout, getTop5, getMyRank, isCheckinEarly, isCheckinLate, isCheckoutEarly, isCheckoutLate, getWorkingTime, getDiffCheckin, getDiffCheckout }