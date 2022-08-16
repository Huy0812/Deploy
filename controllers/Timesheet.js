const Timesheet = require("../models/Timesheet")
const User = require("../models/User")
const Company = require("../models/Company")
const moment = require("moment")
const momenttz = require("moment-timezone")

// checkin + checkout (lần đầu là checkin, các lần sau là checkout, tự động lấy lần checkout cuối cùng trong ngày)
const checking = async (req, res) => {
    try {
        const current = moment();
        const currentDate = current.tz('Asia/Ho_Chi_Minh').format("DD/MM/YYYY");
        const currentTime = current.tz('Asia/Ho_Chi_Minh').format("HH:mm:ss");

        let timesheet = await Timesheet.findOne({ userId: req.user._id });
        const user = await User.findById(req.user._id)
        const companyId = user.companyId;
        const company = await Company.findById(companyId);
        const { networkIp, deviceId } = req.body
        if (company.companyIp != networkIp) {
            return res
                .status(400)
                .json({ success: false, message: "You need to access the company network" });
        }
        if (user.deviceId != deviceId) {
            return res
                .status(400)
                .json({ success: false, message: "deviceId is Incorrect. Please update your deviceId" });
        }
        if (!timesheet) {
            timesheet = await Timesheet.create({
                userId: req.user._id,
                segments: [],
            })
        }

        let index = timesheet.segments.findIndex(x => x.date === currentDate);
        if (index === -1) {
            let timesheetSegment = {
                date: currentDate,
                checkinTime: currentTime,
            };
            timesheet.segments.push(timesheetSegment);

            await timesheet.save();
            return res
                .status(200)
                .json({ success: true, message: "Checkin successfully" });
        }
        timesheet = await Timesheet.findOne({ "userId": req.user._id, "segments[index].date": currentDate });

        let workingTime = moment.duration(moment(timesheet.segments[index].checkoutTime, "HH:mm:ss").diff(moment(timesheet.segments[index].checkinTime, "HH:mm:ss"))).asHours();
        workingTime = Math.round(workingTime * 100) / 100;

        let timesheetSegment = {
            date: timesheet.segments[index].date,
            checkinTime: timesheet.segments[index].checkinTime,
            checkoutTime: currentTime,
            workingTime: workingTime,
        };

        timesheet.segments.pop();
        timesheet.segments.push(timesheetSegment);
        await timesheet.save();
        return res
            .status(200)
            .json({ success: true, message: "Checkout successfully" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy thông tin checkin, checkout
const getTimesheetInfo = async (req, res) => {
    try {
        const currentDate = moment().format("DD/MM/YYYY");
        let timesheet = await Timesheet.findOne({ userId: req.user._id });
        let index = timesheet.segments.findIndex(x => x.date === currentDate);

        if (index === -1) {
            timesheetData = {
                checkinTime: null,
                checkoutTime: null,
            }
            return res
                .status(400)
                .json({ success: true, Object: timesheetData });
        }

        timesheetData = {
            checkinTime: timesheet.segments[index].checkinTime,
            checkoutTime: timesheet.segments[index].checkoutTime,
        }
        res
            .status(200)
            .json({ success: true, Object: timesheetData });

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

        let myRank = sort.findIndex(x => x.userId.equals(req.user._id));
        if (myRank === -1) {
            return res
                .status(400)
                .json({ success: true, message: `You haven't checkin today` });
        }

        res
            .status(200)
            .json({ success: true, message: `My ranking`, number: myRank + 1 });

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

        checkinLate = {
            value: getCheckinLate(timesheet.segments[index].checkinTime),
            number: 1,
        }
        checkoutEarly = {
            value: getCheckoutEarly(timesheet.segments[index].checkoutTime),
            number: 1,
        }
        checkoutLate = {
            value: getCheckoutLate(timesheet.segments[index].checkoutTime),
            number: 1,
        }

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

        checkinLate = {
            value: getCheckinLate(timesheet.segments[index].checkinTime),
            number: 1,
        }
        checkoutEarly = {
            value: getCheckoutEarly(timesheet.segments[index].checkoutTime),
            number: 1,
        }
        checkoutLate = {
            value: getCheckoutLate(timesheet.segments[index].checkoutTime),
            number: 1,
        }

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

        checkinLateData = {
            value: checkinLateValue,
            number: checkinLateNum,
        }
        checkoutEarlyData = {
            value: checkinLateValue,
            number: checkinLateNum,
        }
        checkoutLateData = {
            value: checkinLateValue,
            number: checkinLateNum,
        }

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

        checkinLateData = {
            value: checkinLateValue,
            number: checkinLateNum,
        }
        checkoutEarlyData = {
            value: checkinLateValue,
            number: checkinLateNum,
        }
        checkoutLateData = {
            value: checkinLateValue,
            number: checkinLateNum,
        }

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

        checkinLateData = {
            value: checkinLateValue,
            number: checkinLateNum,
        }
        checkoutEarlyData = {
            value: checkinLateValue,
            number: checkinLateNum,
        }
        checkoutLateData = {
            value: checkinLateValue,
            number: checkinLateNum,
        }

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

        checkinLateData = {
            value: checkinLateValue,
            number: checkinLateNum,
        }
        checkoutEarlyData = {
            value: checkinLateValue,
            number: checkinLateNum,
        }
        checkoutLateData = {
            value: checkinLateValue,
            number: checkinLateNum,
        }

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

// Lọc thông tin chấm công (trong khoảng)
const filterTimesheetDataByRange = async (req, res) => {
    try {
        const { start, end } = req.body;
        let timesheet = await Timesheet.findOne({ userId: req.user._id });
        let segments = timesheet.segments;

        segments = segments.filter(function (segment) {
            return moment(segment.date, "DD/MM/YYYY") >= moment(start, "DD/MM/YYYY") && moment(segment.date, "DD/MM/YYYY") <= moment(end, "DD/MM/YYYY");
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

        checkinLateData = {
            value: checkinLateValue,
            number: checkinLateNum,
        }
        checkoutEarlyData = {
            value: checkinLateValue,
            number: checkinLateNum,
        }
        checkoutLateData = {
            value: checkinLateValue,
            number: checkinLateNum,
        }

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

// Lấy thông tin bảng chấm công (tháng này)
const getTimesheetByMonth = async (req, res) => {
    try {
        var monthStart = moment().startOf('month');
        var monthEnd = moment().endOf('month');
        let timesheet = await Timesheet.findOne({ userId: req.user._id });
        let segments = timesheet.segments;

        segments = segments.filter(function (segment) {
            return moment(segment.date, "DD/MM/YYYY") >= monthStart && moment(segment.date, "DD/MM/YYYY") <= monthEnd;
        });

        return res
            .status(200)
            .json({ success: true, message: `Timesheet data`, Object: segments });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}


module.exports = { checking, getTimesheetInfo, getTop5, getMyRank, filterTimesheetDataByToday, filterTimesheetDataByYesterday, filterTimesheetDataByThisWeek, filterTimesheetDataByLastWeek, filterTimesheetDataByThisMonth, filterTimesheetDataByLastMonth, filterTimesheetDataByRange, getTimesheetByMonth }