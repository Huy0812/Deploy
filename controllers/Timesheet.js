const Timesheet = require("../models/Timesheet")
const User = require("../models/User")
const moment = require("moment")
const createTimesheet = async (req, res) => {
    try {
        const userId = req.user._id;

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

        let timesheet = await Timesheet.findOne({ "userId": req.user._id });
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

        let timesheet = await Timesheet.findOne({ "userId": req.user._id });
        const index = timesheet.segments.findIndex(x => x.date === date);
        timesheet = await Timesheet.findOne({ "userId": req.user._id, "segments[index].date": date });

        let workingTime = moment.duration(moment(timesheet.segments[index].checkoutTime, "HH:mm:ss").diff(moment(timesheet.segments[index].checkinTime, "HH:mm:ss"))).asHours();

        let timesheetSegment = {
            date: timesheet.segments[index].date,
            checkinTime: timesheet.segments[index].checkinTime,
            checkoutTime: checkoutTime,
            workingTime: workingTime,
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

// Lấy bảng xếp hạng top 5 nhân viên checkin trong ngày
const getTop5 = async (req, res) => {
    try {
        let timesheet = await Timesheet.find();
        sort = timesheet.sort((a, b) => moment(a.segments[a.segments.length - 1].checkinTime, "HH:mm:ss", true) - moment(b.segments[b.segments.length - 1].checkinTime, "HH:mm:ss", true));

        sort = sort.slice(0, 4);
        let ranking = []
        for (i = 0; i < 5; i++) {
            if (!sort[i]) break;
            let user = await User.findById(sort[i].userId);
            let userTemp = {
                _id: sort[i].userId,
                userId: user.userId,
                name: user.name,
                avatar: user.avatar,
                checkinTime: sort[i].segments[sort[i].segments.length - 1].checkinTime,
            }
            ranking.push(userTemp);
        }

        res
            .status(200)
            .json({ success: true, message: `Ranking Information`, array: ranking });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy xếp hạng checkin trong ngày của nhân viên
const getMyRank = async (req, res) => {
    try {
        let timesheet = await Timesheet.find();
        sort = timesheet.sort((a, b) => moment(a.segments[a.segments.length - 1].checkinTime, "HH:mm:ss", true) - moment(b.segments[b.segments.length - 1].checkinTime, "HH:mm:ss", true));

        let myRank = sort.findIndex(x => x.userId.equals(req.user._id)) + 1;

        res
            .status(200)
            .json({ success: true, message: `My ranking`, number: myRank });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Kiểm tra checkin sớm (trong ngày)
const isCheckinEarly = async (req, res) => {
    try {
        const date = moment().format("DD/MM/YYYY");
        let timesheet = await Timesheet.findOne({ userId: req.user._id });
        let index = timesheet.segments.findIndex(x => x.date === date);
        if (moment(timesheet.segments[index].checkinTime, "HH:mm:ss").isBefore(moment("08:30:00", "HH:mm:ss"))) {
            return res
                .status(200)
                .json({ success: true, message: `Is checkin early`, Boolean: true });
        }
        res
            .status(200)
            .json({ success: true, message: `Is checkin early`, Boolean: false });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Kiểm tra checkin muộn (trong ngày)
const isCheckinLate = async (req, res) => {
    try {
        const date = moment().format("DD/MM/YYYY");
        let timesheet = await Timesheet.findOne({ userId: req.user._id });
        let index = timesheet.segments.findIndex(x => x.date === date);
        if (moment(timesheet.segments[index].checkinTime, "HH:mm:ss").isAfter(moment("08:30:00", "HH:mm:ss"))) {
            return res
                .status(200)
                .json({ success: true, message: `Is checkin early`, Boolean: true });
        }
        res
            .status(200)
            .json({ success: true, message: `Is checkin early`, Boolean: false });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Kiểm tra checkout sớm (trong ngày)
const isCheckoutEarly = async (req, res) => {
    try {
        const date = moment().format("DD/MM/YYYY");
        let timesheet = await Timesheet.findOne({ userId: req.user._id });
        let index = timesheet.segments.findIndex(x => x.date === date);
        if (moment(timesheet.segments[index].checkoutTime, "HH:mm:ss").isBefore(moment("18:00:00", "HH:mm:ss"))) {
            return res
                .status(200)
                .json({ success: true, message: `Is checkout early`, Boolean: true });
        }
        res
            .status(200)
            .json({ success: true, message: `Is checkout early`, Boolean: false });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Kiểm tra checkout muộn (trong ngày)
const isCheckoutLate = async (req, res) => {
    try {
        const date = moment().format("DD/MM/YYYY");
        let timesheet = await Timesheet.findOne({ userId: req.user._id });
        let index = timesheet.segments.findIndex(x => x.date === date);
        if (moment(timesheet.segments[index].checkoutTime, "HH:mm:ss").isAfter(moment("18:00:00", "HH:mm:ss"))) {
            return res
                .status(200)
                .json({ success: true, message: `Is checkout early`, Boolean: true });
        }
        res
            .status(200)
            .json({ success: true, message: `Is checkout early`, Boolean: false });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Tính thời gian chênh lệch so với thời gian checkin mặc định
const getDiffCheckin = async (req, res) => {
    try {
        const date = moment().format("DD/MM/YYYY");
        let timesheet = await Timesheet.findOne({ userId: req.user._id });
        let index = timesheet.segments.findIndex(x => x.date === date);

        let diff = moment.duration(moment("08:30:00", "HH:mm:ss").diff(moment(timesheet.segments[index].checkinTime, "HH:mm:ss"))).asHours();
        return res
            .status(200)
            .json({ success: true, message: `Different from checkin`, Number: diff });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Tính thời gian chênh lệch so với thời gian checkout mặc định
const getDiffCheckout = async (req, res) => {
    try {
        const date = moment().format("DD/MM/YYYY");
        let timesheet = await Timesheet.findOne({ userId: req.user._id });
        let index = timesheet.segments.findIndex(x => x.date === date);

        let diff = moment.duration(moment(timesheet.segments[index].checkoutTime, "HH:mm:ss").diff(moment("18:00:00", "HH:mm:ss"))).asHours();
        return res
            .status(200)
            .json({ success: true, message: `Different from checkout`, Number: diff });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}


module.exports = { createTimesheet, checkin, checkout, getTop5, getMyRank, isCheckinEarly, isCheckinLate, isCheckoutEarly, isCheckoutLate, getDiffCheckin, getDiffCheckout }