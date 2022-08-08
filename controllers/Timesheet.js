const Timesheet = require("../models/Timesheet")
const User = require("../models/User")
const moment = require("moment")

const checkin = async (req, res) => {
    try {
        let timesheet = await Timesheet.findOne({ userId: req.user._id });
        if (!timesheet) {
            timesheet = await Timesheet.create({
                userId: req.user._id,
                segments: [],
            })
        }

        const currentDate = moment().format("DD/MM/YYYY");
        const checkinTime = moment().format("HH:mm:ss");

        let index = timesheet.segments.findIndex(x => x.date === currentDate);
        if (index != -1) {
            return res
                .status(400)
                .json({ success: false, message: "Checkin for today already" });
        }

        let timesheetSegment = {
            date: currentDate,
            checkinTime: checkinTime,
            checkoutTime: 0,
        };
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
        const currentDate = moment().format("DD/MM/YYYY");
        const checkoutTime = moment().format("HH:mm:ss");

        let timesheet = await Timesheet.findOne({ "userId": req.user._id });
        let index = timesheet.segments.findIndex(x => x.date === currentDate);
        timesheet = await Timesheet.findOne({ "userId": req.user._id, "segments[index].date": currentDate });

        let workingTime = moment.duration(moment(timesheet.segments[index].checkoutTime, "HH:mm:ss").diff(moment(timesheet.segments[index].checkinTime, "HH:mm:ss"))).asHours();
        workingTime = Math.round(workingTime * 100) / 100;

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

const getTimesheetInfo = async (req, res) => {
    try {
        const currentDate = moment().format("DD/MM/YYYY");
        let timesheet = await Timesheet.findOne({ userId: req.user._id });
        let index = timesheet.segments.findIndex(x => x.date === currentDate);
        if (index === -1) {
            return res
                .status(400)
                .json({ success: false, message: error.message });
        }
        timesheetData = {
            checkinTime: timesheet.segments[index].checkinTime,
            checkoutTime: timesheet.segments[index].checkoutTime,
        }
        res
            .status(200)
            .json({ success: true, message: "Checkin time", Object: timesheetData });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy bảng xếp hạng top 5 nhân viên checkin trong ngày
const getTop5 = async (req, res) => {
    try {
        const currentDate = moment().format("DD/MM/YYYY");
        let timesheet = await Timesheet.find();
        sort = timesheet.sort(function (a, b) {
            checkinTimeStrA = a.segments[a.segments.length - 1].date + " " + a.segments[a.segments.length - 1].checkinTime;
            checkinTimeStrB = b.segments[b.segments.length - 1].date + " " + b.segments[b.segments.length - 1].checkinTime;
            return moment(checkinTimeStrA, "DD/MM/YYYY HH:mm:ss") - moment(checkinTimeStrB, "DD/MM/YYYY HH:mm:ss")
        });
        sort = sort.filter(function (element) { return element.segments[element.segments.length - 1].date === currentDate });
        sort = sort.slice(0, 5);
        let ranking = [];
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
        const currentDate = moment().format("DD/MM/YYYY");
        let timesheet = await Timesheet.find();
        sort = timesheet.sort(function (a, b) {
            checkinTimeStrA = a.segments[a.segments.length - 1].date + " " + a.segments[a.segments.length - 1].checkinTime;
            checkinTimeStrB = b.segments[b.segments.length - 1].date + " " + b.segments[b.segments.length - 1].checkinTime;
            return moment(checkinTimeStrA, "DD/MM/YYYY HH:mm:ss") - moment(checkinTimeStrB, "DD/MM/YYYY HH:mm:ss")
        });
        sort = sort.filter(function (element) { return element.segments[element.segments.length - 1].date === currentDate });

        let myRank = sort.findIndex(x => x.userId.equals(req.user._id)) + 1;
        if (myRank === -1) {
            return res
                .status(400)
                .json({ success: true, message: `You haven't checkin today` });
        }

        res
            .status(200)
            .json({ success: true, message: `My ranking`, number: myRank });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Kiểm tra checkin sớm
function isCheckinEarly(checkinTime) {
    return moment(checkinTime, "HH:mm:ss").isBefore(moment("08:30:00", "HH:mm:ss"));
}

// Kiểm tra checkin muộn
function isCheckinLate(checkinTime) {
    return moment(checkinTime, "HH:mm:ss").isAfter(moment("08:30:00", "HH:mm:ss"));
}

// Kiểm tra checkout sớm
function isCheckoutEarly(checkoutTime) {
    return moment(checkoutTime, "HH:mm:ss").isBefore(moment("18:00:00", "HH:mm:ss"));
}

// Kiểm tra checkout muộn
function isCheckoutLate(checkoutTime) {
    return moment(checkoutTime, "HH:mm:ss").isAfter(moment("18:30:00", "HH:mm:ss"));
}

// Tính thời gian checkin muộn
function getCheckinLate(checkinTime) {
    if (isCheckinLate(checkinTime))
        return Math.round(moment.duration(moment(checkinTime, "HH:mm:ss").diff(moment("08:30:00", "HH:mm:ss"))).asMinutes());
    return 0;
}

// Tính thời gian checkout sớm
function getCheckoutEarly(checkoutTime) {
    if (isCheckoutEarly(checkoutTime))
        return Math.round(moment.duration(moment("18:00:00", "HH:mm:ss").diff(moment(checkoutTime, "HH:mm:ss"))).asMinutes());
    return 0;
}

// Tính thời gian checkout muộn
function getCheckoutLate(checkoutTime) {
    if (isCheckoutLate(checkoutTime))
        return Math.round(moment.duration(moment(checkoutTime, "HH:mm:ss").diff(moment("18:00:00", "HH:mm:ss"))).asMinutes());
    return 0;
}

// Lọc thông tin chấm công (hôm nay)
const filterTimesheetDataByToday = async (req, res) => {
    try {
        const currentDate = moment().format("DD/MM/YYYY");
        let timesheet = await Timesheet.findOne({ userId: req.user._id });
        let index = timesheet.segments.findIndex(x => x.date === currentDate);

        if (index === -1)
            return res.status(401).json({ success: false, message: "Have't checkin today" });

        checkinLate = getCheckinLate(timesheet.segments[index].checkinTime) + " phút/ 1 lần";
        checkoutEarly = getCheckoutEarly(timesheet.segments[index].checkoutTime) + " phút/ 1 lần";
        checkoutLate = getCheckoutLate(timesheet.segments[index].checkoutTime) + " phút/ 1 lần";

        let timesheetData = {
            checkinLate: checkinLate,
            checkoutEarly: checkoutEarly,
            checkoutLate: checkoutLate,
        }

        return res
            .status(200)
            .json({ success: true, message: `Timesheet data`, Object: timesheetData });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Lọc thông tin chấm công (hôm qua)
const filterTimesheetDataByYesterday = async (req, res) => {
    try {
        const currentDate = moment().subtract(1, 'day').format("DD/MM/YYYY");
        let timesheet = await Timesheet.findOne({ userId: req.user._id });
        let index = timesheet.segments.findIndex(x => x.date === currentDate);

        if (index === -1)
            return res.status(401).json({ success: false, message: "Have't checkin yesterday" });

        checkinLate = getCheckinLate(timesheet.segments[index].checkinTime) + " phút/ 1 lần";
        checkoutEarly = getCheckoutEarly(timesheet.segments[index].checkoutTime) + " phút/ 1 lần";
        checkoutLate = getCheckoutLate(timesheet.segments[index].checkoutTime) + " phút/ 1 lần";

        let timesheetData = {
            checkinLate: checkinLate,
            checkoutEarly: checkoutEarly,
            checkoutLate: checkoutLate,
        }

        return res
            .status(200)
            .json({ success: true, message: `Timesheet data`, Object: timesheetData });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Lọc thông tin chấm công (tuần này)
const filterTimesheetDataByThisWeek = async (req, res) => {
    try {
        var weekStart = moment().startOf('isoWeek');
        var weekEnd = moment().endOf('isoWeek');
        let timesheet = await Timesheet.findOne({ userId: req.user._id });
        let segments = timesheet.segments;

        segments = segments.filter(function (segment) {
            return moment(segment.date, "DD/MM/YYYY") >= weekStart && moment(segment.date, "DD/MM/YYYY") <= weekEnd;
        });
        checkinLateNum = segments.filter(function (segment) { return isCheckinLate(segment.checkinTime) }).length;
        checkoutEarlyNum = segments.filter(function (segment) { return isCheckoutEarly(segment.checkinTime) }).length;
        checkoutLateNum = segments.filter(function (segment) { return isCheckoutLate(segment.checkinTime) }).length;

        checkinLateValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckinLate(segment.checkinTime);
        }, 0);
        checkoutEarlyValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckoutEarly(segment.checkoutTime);
        }, 0);
        checkoutLateValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckoutLate(segment.checkoutTime);
        }, 0);

        checkinLateData = checkinLateValue + " phút/ " + checkinLateNum + " lần";
        checkoutEarlyData = checkoutEarlyValue + " phút/ " + checkoutEarlyNum + " lần";
        checkoutLateData = checkoutLateValue + " phút/ " + checkoutLateNum + " lần";

        let timesheetData = {
            checkinLate: checkinLateData,
            checkoutEarly: checkoutEarlyData,
            checkoutLate: checkoutLateData,
        }

        return res
            .status(200)
            .json({ success: true, message: `Timesheet data`, Object: timesheetData });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Lọc thông tin chấm công (tuần trước)
const filterTimesheetDataByLastWeek = async (req, res) => {
    try {
        var weekStart = moment().subtract(1, 'weeks').startOf('isoWeek');
        var weekEnd = moment().subtract(1, 'weeks').endOf('isoWeek');
        let timesheet = await Timesheet.findOne({ userId: req.user._id });
        let segments = timesheet.segments;

        segments = segments.filter(function (segment) {
            return moment(segment.date, "DD/MM/YYYY") >= weekStart && moment(segment.date, "DD/MM/YYYY") <= weekEnd;
        });
        checkinLateNum = segments.filter(function (segment) { return isCheckinLate(segment.checkinTime) }).length;
        checkoutEarlyNum = segments.filter(function (segment) { return isCheckoutEarly(segment.checkinTime) }).length;
        checkoutLateNum = segments.filter(function (segment) { return isCheckoutLate(segment.checkinTime) }).length;

        checkinLateValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckinLate(segment.checkinTime);
        }, 0);
        checkoutEarlyValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckoutEarly(segment.checkoutTime);
        }, 0);
        checkoutLateValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckoutLate(segment.checkoutTime);
        }, 0);

        checkinLateData = checkinLateValue + " phút/ " + checkinLateNum + " lần";
        checkoutEarlyData = checkoutEarlyValue + " phút/ " + checkoutEarlyNum + " lần";
        checkoutLateData = checkoutLateValue + " phút/ " + checkoutLateNum + " lần";

        let timesheetData = {
            checkinLate: checkinLateData,
            checkoutEarly: checkoutEarlyData,
            checkoutLate: checkoutLateData,
        }

        return res
            .status(200)
            .json({ success: true, message: `Timesheet data`, Object: timesheetData });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Lọc thông tin chấm công (tháng này)
const filterTimesheetDataByThisMonth = async (req, res) => {
    try {
        var monthStart = moment().startOf('month');
        var monthEnd = moment().endOf('month');
        let timesheet = await Timesheet.findOne({ userId: req.user._id });
        let segments = timesheet.segments;

        segments = segments.filter(function (segment) {
            return moment(segment.date, "DD/MM/YYYY") >= monthStart && moment(segment.date, "DD/MM/YYYY") <= monthEnd;
        });
        checkinLateNum = segments.filter(function (segment) { return isCheckinLate(segment.checkinTime) }).length;
        checkoutEarlyNum = segments.filter(function (segment) { return isCheckoutEarly(segment.checkinTime) }).length;
        checkoutLateNum = segments.filter(function (segment) { return isCheckoutLate(segment.checkinTime) }).length;

        checkinLateValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckinLate(segment.checkinTime);
        }, 0);
        checkoutEarlyValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckoutEarly(segment.checkoutTime);
        }, 0);
        checkoutLateValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckoutLate(segment.checkoutTime);
        }, 0);

        checkinLateData = checkinLateValue + " phút/ " + checkinLateNum + " lần";
        checkoutEarlyData = checkoutEarlyValue + " phút/ " + checkoutEarlyNum + " lần";
        checkoutLateData = checkoutLateValue + " phút/ " + checkoutLateNum + " lần";

        let timesheetData = {
            checkinLate: checkinLateData,
            checkoutEarly: checkoutEarlyData,
            checkoutLate: checkoutLateData,
        }

        return res
            .status(200)
            .json({ success: true, message: `Timesheet data`, Object: timesheetData });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Lọc thông tin chấm công (tháng trước)
const filterTimesheetDataByLastMonth = async (req, res) => {
    try {
        var monthStart = moment().startOf('month').subtract(1, 'month');
        var monthEnd = moment().endOf('month').subtract(1, 'month');
        let timesheet = await Timesheet.findOne({ userId: req.user._id });
        let segments = timesheet.segments;

        segments = segments.filter(function (segment) {
            return moment(segment.date, "DD/MM/YYYY") >= monthStart && moment(segment.date, "DD/MM/YYYY") <= monthEnd;
        });
        checkinLateNum = segments.filter(function (segment) { return isCheckinLate(segment.checkinTime) }).length;
        checkoutEarlyNum = segments.filter(function (segment) { return isCheckoutEarly(segment.checkinTime) }).length;
        checkoutLateNum = segments.filter(function (segment) { return isCheckoutLate(segment.checkinTime) }).length;

        checkinLateValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckinLate(segment.checkinTime);
        }, 0);
        checkoutEarlyValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckoutEarly(segment.checkoutTime);
        }, 0);
        checkoutLateValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckoutLate(segment.checkoutTime);
        }, 0);

        checkinLateData = checkinLateValue + " phút/ " + checkinLateNum + " lần";
        checkoutEarlyData = checkoutEarlyValue + " phút/ " + checkoutEarlyNum + " lần";
        checkoutLateData = checkoutLateValue + " phút/ " + checkoutLateNum + " lần";

        let timesheetData = {
            checkinLate: checkinLateData,
            checkoutEarly: checkoutEarlyData,
            checkoutLate: checkoutLateData,
        }

        return res
            .status(200)
            .json({ success: true, message: `Timesheet data`, Object: timesheetData });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}


module.exports = { checkin, checkout, getTimesheetInfo, getTop5, getMyRank, filterTimesheetDataByToday, filterTimesheetDataByYesterday, filterTimesheetDataByThisWeek, filterTimesheetDataByLastWeek, filterTimesheetDataByThisMonth, filterTimesheetDataByLastMonth }