const Timesheet = require("../models/Timesheet")
const User = require("../models/User")
const Company = require("../models/Company")
const moment = require("moment")
const momenttz = require("moment-timezone")

// Thời gian mặc định (ca sáng)
const CHECKINTIME_AM_DEFAULT = "08:30:00"
const CHECKOUTTIME_AM_DEFAULT = "12:00:00"

// Thời gian mặc định (ca chiều)
const CHECKINTIME_PM_DEFAULT = "13:30:00"
const CHECKOUTTIME_PM_DEFAULT = "18:00:00"

// Thời gian làm việc mặc định
const TOTAL_TIME_DEFAULT = moment.duration(moment(CHECKOUTTIME_PM_DEFAULT, "HH:mm:ss")
    .diff(moment(CHECKINTIME_AM_DEFAULT, "HH:mm:ss"))).asHours();

// Thời gian nghỉ trưa mặc định
const BREAK_TIME_DEFAULT = moment.duration(moment(CHECKINTIME_PM_DEFAULT, "HH:mm:ss")
    .diff(moment(CHECKOUTTIME_AM_DEFAULT, "HH:mm:ss"))).asHours();

// Kiểm tra nếu ngày là cuối tuần
function isWeekend(date) {
    return new Date(date).getDay() === 6 || new Date(date).getDay() === 0;
}

// Kiểm tra checkin muộn
function isCheckinLate(segment) {
    if (isWeekend(segment.date))
        return false;
    return moment(segment.checkinTime, "HH:mm:ss").isAfter(moment(CHECKINTIME_AM_DEFAULT, "HH:mm:ss")) ||
        moment(segment.checkinTime, "HH:mm:ss").isAfter(moment(CHECKINTIME_PM_DEFAULT, "HH:mm:ss"));
}

// Kiểm tra checkout sớm
function isCheckoutEarly(segment) {
    if (isWeekend(segment.date))
        return false;
    return moment(segment.checkoutTime, "HH:mm:ss").isBefore(moment(CHECKOUTTIME_AM_DEFAULT, "HH:mm:ss")) ||
        moment(segment.checkinTime, "HH:mm:ss").isBefore(moment(CHECKOUTTIME_PM_DEFAULT, "HH:mm:ss"));
}

// Tính thời gian checkin muộn
function getCheckinLate(segment) {
    if (!isWeekend(segment.date) && isCheckinLate(segment))
        return Math.round(moment.duration(moment(segment.checkinTime, "HH:mm:ss").diff(moment("08:30:00", "HH:mm:ss"))).asMinutes());
    return 0;
}

// Tính thời gian checkout sớm
function getCheckoutEarly(segment) {
    if (!isWeekend(segment.date) && isCheckoutEarly(segment))
        return Math.round(moment.duration(moment("18:00:00", "HH:mm:ss").diff(moment(segment.checkoutTime, "HH:mm:ss"))).asMinutes());
    return 0;
}

// Tính thời gian bắt đầu thực
function getActualStart(segment) {
    if (!isWeekend(segment.date) && moment(segment.checkinTime, "HH:mm:ss").isBefore(moment(CHECKINTIME_AM_DEFAULT, "HH:mm:ss"))) {
        return CHECKINTIME_AM_DEFAULT;
    } else if (!isWeekend(segment.date) && (moment(segment.checkinTime, "HH:mm:ss").isBetween(moment(CHECKOUTTIME_AM_DEFAULT, "HH:mm:ss"),
        moment(CHECKINTIME_PM_DEFAULT, "HH:mm:ss")))) {
        return CHECKINTIME_PM_DEFAULT;
    }
    return segment.checkinTime;
}

// Tính thời gian kết thúc thực
function getActualEnd(segment) {
    if (!isWeekend(segment.date) && moment(segment.checkoutTime, "HH:mm:ss").isBetween(moment(CHECKOUTTIME_AM_DEFAULT, "HH:mm:ss"),
        moment(CHECKINTIME_PM_DEFAULT, "HH:mm:ss"))) {
        return CHECKOUTTIME_AM_DEFAULT;
    } else if (!isWeekend(segment.date) && moment(segment.checkoutTime, "HH:mm:ss").isAfter(moment(CHECKOUTTIME_PM_DEFAULT, "HH:mm:ss"))) {
        return CHECKOUTTIME_PM_DEFAULT;
    }
    return segment.checkoutTime;
}

// Tính thời gian làm việc thực tế
function getActualWorkingTime(segment) {
    return moment.duration(moment(getActualEnd(segment), "HH:mm:ss")
        .diff(moment(getActualStart(segment), "HH:mm:ss"))).asHours();
}

// Tính thời gian OT
function getOvertime(segment) {
    if (isWeekend(segment.date))
        return getActualWorkingTime(segment);
    return 0;
}

// Tính điểm công (theo ngày)
function getTimesheetPoint(segment) {
    let workingTime = getActualWorkingTime(segment);
    let point = workingTime / (TOTAL_TIME_DEFAULT - BREAK_TIME_DEFAULT);

    if (isNaN(point)) {
        point = 0;
    }
    if (isWeekend(moment(segment.date, "HH:mm, DD/MM/YYYY").toDate())) {
        point *= 2;
    }
    point = Math.round(point * 10) / 10;

    return point;
}

// checkin + checkout (lần đầu là checkin, các lần sau là checkout, tự động lấy lần checkout cuối cùng trong ngày)
const checking = async (req, res) => {
    try {
        const current = moment();
        const currentDate = current.format("DD/MM/YYYY");
        const currentTime = current.format("HH:mm:ss");

        const user = await User.findById(req.user._id);

        const companyId = user.companyId;
        const company = await Company.findById(companyId);
        const { networkIp, deviceId } = req.body;
        if (company.companyIp !== networkIp) {
            return res
                .status(400)
                .json({ success: false, message: "Bạn cần truy cập vào hệ thống mạng của công ty" });
        }
        if (user.deviceId !== deviceId) {
            return res
                .status(400)
                .json({ success: false, message: "Mã thiết bị không đúng. Vui lòng cập nhật lại mã thiết bị" });
        }

        let timesheet = await Timesheet.findOne({ userId: user._id });

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
                checkoutTime: null,
                workingTime: 0,
            };
            timesheet.segments.push(timesheetSegment);
            await timesheet.save();
            return res
                .status(200)
                .json({ success: true, message: "Checkin thành công" });
        }

        timesheet = await Timesheet.findOne({ "userId": user._id, "segments[index].date": currentDate });

        let workingTime = moment.duration(moment(timesheet.segments[index].checkoutTime, "HH:mm:ss").diff(moment(timesheet.segments[index].checkinTime, "HH:mm:ss"))).asHours();
        if (isNaN(workingTime)) {
            workingTime = 0;
        }
        workingTime = Math.round(workingTime * 10) / 10;

        let timesheetSegment = {
            date: timesheet.segments[index].date,
            checkinTime: timesheet.segments[index].checkinTime,
            checkoutTime: currentTime,
            workingTime: getActualWorkingTime(timesheet.segments[index], currentTime),
        };
        timesheet.segments.pop();
        timesheet.segments.push(timesheetSegment);

        await timesheet.save();
        return res
            .status(200)
            .json({ success: true, message: "Checkout thành công" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy thông tin checkin, checkout
const getChecking = async (req, res) => {
    try {
        const currentDate = moment().format("DD/MM/YYYY");
        let timesheet = await Timesheet.findOne({ userId: req.user._id });
        let index = timesheet.segments.findIndex(x => x.date === currentDate);

        if (index === -1) {
            let checkingData = {
                checkinTime: null,
                checkoutTime: null,
            }
            return res
                .status(200)
                .json({ success: true, message: `Thông tin checking`, checking: checkingData });
        }

        let checkingData = {
            checkinTime: timesheet.segments[index].checkinTime,
            checkoutTime: timesheet.segments[index].checkoutTime,
        }
        res
            .status(200)
            .json({ success: true, message: `Thông tin checking`, checking: checkingData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy xếp hạng checkin trong ngày của nhân viên
const getMyRank = async (req, res) => {
    try {
        const currentDate = moment().format("DD/MM/YYYY");

        let timesheet = await Timesheet.find();
        let sort = timesheet.sort(function (a, b) {
            checkinTimeStrA = a.segments[a.segments.length - 1].date + " " + a.segments[a.segments.length - 1].checkinTime;
            checkinTimeStrB = b.segments[b.segments.length - 1].date + " " + b.segments[b.segments.length - 1].checkinTime;
            return moment(checkinTimeStrA, "DD/MM/YYYY HH:mm:ss") - moment(checkinTimeStrB, "DD/MM/YYYY HH:mm:ss")
        });
        sort = sort.filter(function (element) { return element.segments[element.segments.length - 1].date === currentDate });

        let myRank = sort.findIndex(x => x.userId.equals(req.user._id));
        if (myRank === -1) {
            return res
                .status(400)
                .json({ success: true, message: `Bạn chưa checkin hôm nay` });
        }

        res
            .status(200)
            .json({ success: true, message: `Xếp hạng hôm nay`, rank: myRank + 1 });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy bảng xếp hạng top 5 nhân viên checkin trong ngày
const getTop5 = async (req, res) => {
    try {
        const currentDate = moment().format("DD/MM/YYYY");

        let timesheet = await Timesheet.find();
        let sort = timesheet.sort(function (a, b) {
            checkinTimeStrA = a.segments[a.segments.length - 1].date + " " + a.segments[a.segments.length - 1].checkinTime;
            checkinTimeStrB = b.segments[b.segments.length - 1].date + " " + b.segments[b.segments.length - 1].checkinTime;
            return moment(checkinTimeStrA, "DD/MM/YYYY HH:mm:ss") - moment(checkinTimeStrB, "DD/MM/YYYY HH:mm:ss")
        });
        sort = sort.filter(function (element) { return element.segments[element.segments.length - 1].date === currentDate });

        sort = sort.slice(0, 5);
        ranking = [];
        for (i = 0; i < 5; i++) {
            if (!sort[i]) break;
            let user = await User.findById(sort[i].userId);
            userTemp = {
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
            .json({ success: true, message: `Bảng xếp hạng hôm nay`, ranking: ranking });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lọc thông tin chấm công (hôm nay)
const filterTimesheetByToday = async (req, res) => {
    try {
        const today = moment().format("DD/MM/YYYY");

        let timesheet = await Timesheet.findOne({ userId: req.user._id });
        let segments = timesheet.segments;

        segments = segments.filter(function (segment) {
            return moment(segment.date, "DD/MM/YYYY") >= today && moment(segment.date, "DD/MM/YYYY") <= today;
        });

        let checkinLateValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckinLate(segment);
        }, 0);
        let checkinLateNumber = segments.filter(function (segment) { return isCheckinLate(segment) }).length;
        let checkoutEarlyValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckoutEarly(segment);
        }, 0);
        let checkoutEarlyNumber = segments.filter(function (segment) { return isCheckoutEarly(segment) }).length;
        let overtimeValue = segments.reduce((accumulator, segment) => {
            return accumulator + getOvertime(segment);
        }, 0);
        if (overtimeValue == null) {
            overtimeValue = 0;
        }
        let overtimeNumber = segments.filter(function (segment) { return isWeekend(segment.date) }).length;
        let maxPoint = 0;
        for (let i = today.toDate(); i <= today.toDate(); i.setDate(i.getDate() + 1)) {
            if (!isWeekend(i)) maxPoint++;
        }
        let actualPoint = segments.reduce((accumulator, segment) => {
            return accumulator + getTimesheetPoint(segment)
        }, 0);
        let checkinLateData = {
            value: checkinLateValue,
            number: checkinLateNumber,
        }
        let checkoutEarlyData = {
            value: checkoutEarlyValue,
            number: checkoutEarlyNumber,
        }
        let overtimeData = {
            value: overtimeValue,
            number: overtimeNumber,
        }
        let pointData = {
            actual: actualPoint,
            max: maxPoint,
        };
        let timesheetData = {
            checkinLate: checkinLateData,
            checkoutEarly: checkoutEarlyData,
            overtime: overtimeData,
            point: pointData,
        };

        let timesheetTable = [];
        segments.forEach((segment) => {
            let timesheetTemp = {
                date: segment.date,
                checkinTime: segment.checkinTime,
                checkoutTime: segment.checkoutTime,
                point: getTimesheetPoint(segment),
            }
            timesheetTable.push(timesheetTemp);
        });

        return res
            .status(200)
            .json({ success: true, message: `Dữ liệu công hôm nay`, timesheetData: timesheetData, timesheetTable: timesheetTable });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Lọc thông tin chấm công (hôm qua)
const filterTimesheetByYesterday = async (req, res) => {
    try {
        const yesterday = moment().format("DD/MM/YYYY");

        let timesheet = await Timesheet.findOne({ userId: req.user._id });
        let segments = timesheet.segments;

        segments = segments.filter(function (segment) {
            return moment(segment.date, "DD/MM/YYYY") >= yesterday && moment(segment.date, "DD/MM/YYYY") <= yesterday;
        });

        let checkinLateValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckinLate(segment);
        }, 0);
        let checkinLateNumber = segments.filter(function (segment) { return isCheckinLate(segment) }).length;
        let checkoutEarlyValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckoutEarly(segment);
        }, 0);
        let checkoutEarlyNumber = segments.filter(function (segment) { return isCheckoutEarly(segment) }).length;
        let overtimeValue = segments.reduce((accumulator, segment) => {
            return accumulator + getOvertime(segment);
        }, 0);
        if (overtimeValue == null) {
            overtimeValue = 0;
        }
        let overtimeNumber = segments.filter(function (segment) { return isWeekend(segment.date) }).length;
        let maxPoint = 0;
        for (let i = yesterday.toDate(); i <= yesterday.toDate(); i.setDate(i.getDate() + 1)) {
            if (!isWeekend(i)) maxPoint++;
        }
        let actualPoint = segments.reduce((accumulator, segment) => {
            return accumulator + getTimesheetPoint(segment)
        }, 0);
        let checkinLateData = {
            value: checkinLateValue,
            number: checkinLateNumber,
        }
        let checkoutEarlyData = {
            value: checkoutEarlyValue,
            number: checkoutEarlyNumber,
        }
        let overtimeData = {
            value: overtimeValue,
            number: overtimeNumber,
        }
        let pointData = {
            actual: actualPoint,
            max: maxPoint,
        };
        let timesheetData = {
            checkinLate: checkinLateData,
            checkoutEarly: checkoutEarlyData,
            overtime: overtimeData,
            point: pointData,
        };

        let timesheetTable = [];
        segments.forEach((segment) => {
            let timesheetTemp = {
                date: segment.date,
                checkinTime: segment.checkinTime,
                checkoutTime: segment.checkoutTime,
                point: getTimesheetPoint(segment),
            }
            timesheetTable.push(timesheetTemp);
        });

        return res
            .status(200)
            .json({ success: true, message: `Dữ liệu công hôm qua`, timesheetData: timesheetData, timesheetTable: timesheetTable });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Lọc thông tin chấm công (tuần này)
const filterTimesheetByThisWeek = async (req, res) => {
    try {
        const start = moment().startOf('isoWeek');
        const end = moment().endOf('isoWeek');

        let timesheet = await Timesheet.findOne({ userId: req.user._id });
        let segments = timesheet.segments;

        segments = segments.filter(function (segment) {
            return moment(segment.date, "DD/MM/YYYY") >= start && moment(segment.date, "DD/MM/YYYY") <= end;
        });

        let checkinLateValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckinLate(segment);
        }, 0);
        let checkinLateNumber = segments.filter(function (segment) { return isCheckinLate(segment) }).length;
        let checkoutEarlyValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckoutEarly(segment);
        }, 0);
        let checkoutEarlyNumber = segments.filter(function (segment) { return isCheckoutEarly(segment) }).length;
        let overtimeValue = segments.reduce((accumulator, segment) => {
            return accumulator + getOvertime(segment);
        }, 0);
        if (overtimeValue == null) {
            overtimeValue = 0;
        }
        let overtimeNumber = segments.filter(function (segment) { return isWeekend(segment.date) }).length;
        let maxPoint = 0;
        for (let i = start.toDate(); i <= end.toDate(); i.setDate(i.getDate() + 1)) {
            if (!isWeekend(i)) maxPoint++;
        }
        let actualPoint = segments.reduce((accumulator, segment) => {
            return accumulator + getTimesheetPoint(segment)
        }, 0);
        let checkinLateData = {
            value: checkinLateValue,
            number: checkinLateNumber,
        }
        let checkoutEarlyData = {
            value: checkoutEarlyValue,
            number: checkoutEarlyNumber,
        }
        let overtimeData = {
            value: overtimeValue,
            number: overtimeNumber,
        }
        let pointData = {
            actual: actualPoint,
            max: maxPoint,
        };
        let timesheetData = {
            checkinLate: checkinLateData,
            checkoutEarly: checkoutEarlyData,
            overtime: overtimeData,
            point: pointData,
        };

        let timesheetTable = [];
        segments.forEach((segment) => {
            let timesheetTemp = {
                date: segment.date,
                checkinTime: segment.checkinTime,
                checkoutTime: segment.checkoutTime,
                point: getTimesheetPoint(segment),
            }
            timesheetTable.push(timesheetTemp);
        });

        return res
            .status(200)
            .json({ success: true, message: `Dữ liệu công tuần này`, timesheetData: timesheetData, timesheetTable: timesheetTable });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Lọc thông tin chấm công (tuần trước)
const filterTimesheetByLastWeek = async (req, res) => {
    try {
        const start = moment().subtract(1, 'weeks').startOf('isoWeek');
        const end = moment().subtract(1, 'weeks').endOf('isoWeek');

        let timesheet = await Timesheet.findOne({ userId: req.user._id });
        let segments = timesheet.segments;

        segments = segments.filter(function (segment) {
            return moment(segment.date, "DD/MM/YYYY") >= start && moment(segment.date, "DD/MM/YYYY") <= end;
        });

        let checkinLateValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckinLate(segment);
        }, 0);
        let checkinLateNumber = segments.filter(function (segment) { return isCheckinLate(segment) }).length;
        let checkoutEarlyValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckoutEarly(segment);
        }, 0);
        let checkoutEarlyNumber = segments.filter(function (segment) { return isCheckoutEarly(segment) }).length;
        let overtimeValue = segments.reduce((accumulator, segment) => {
            return accumulator + getOvertime(segment);
        }, 0);
        if (overtimeValue == null) {
            overtimeValue = 0;
        }
        let overtimeNumber = segments.filter(function (segment) { return isWeekend(segment.date) }).length;
        let maxPoint = 0;
        for (let i = start.toDate(); i <= end.toDate(); i.setDate(i.getDate() + 1)) {
            if (!isWeekend(i)) maxPoint++;
        }
        let actualPoint = segments.reduce((accumulator, segment) => {
            return accumulator + getTimesheetPoint(segment)
        }, 0);
        let checkinLateData = {
            value: checkinLateValue,
            number: checkinLateNumber,
        }
        let checkoutEarlyData = {
            value: checkoutEarlyValue,
            number: checkoutEarlyNumber,
        }
        let overtimeData = {
            value: overtimeValue,
            number: overtimeNumber,
        }
        let pointData = {
            actual: actualPoint,
            max: maxPoint,
        };
        let timesheetData = {
            checkinLate: checkinLateData,
            checkoutEarly: checkoutEarlyData,
            overtime: overtimeData,
            point: pointData,
        };

        let timesheetTable = [];
        segments.forEach((segment) => {
            let timesheetTemp = {
                date: segment.date,
                checkinTime: segment.checkinTime,
                checkoutTime: segment.checkoutTime,
                point: getTimesheetPoint(segment),
            }
            timesheetTable.push(timesheetTemp);
        });

        return res
            .status(200)
            .json({ success: true, message: `Dữ liệu công tuần trước`, timesheetData: timesheetData, timesheetTable: timesheetTable });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Lọc thông tin chấm công (tháng này)
const filterTimesheetByThisMonth = async (req, res) => {
    try {
        const start = moment().startOf('month');
        const end = moment().endOf('month');

        let timesheet = await Timesheet.findOne({ userId: req.user._id });
        let segments = timesheet.segments;

        segments = segments.filter(function (segment) {
            return moment(segment.date, "DD/MM/YYYY") >= start && moment(segment.date, "DD/MM/YYYY") <= end;
        });

        let checkinLateValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckinLate(segment);
        }, 0);
        let checkinLateNumber = segments.filter(function (segment) { return isCheckinLate(segment) }).length;
        let checkoutEarlyValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckoutEarly(segment);
        }, 0);
        let checkoutEarlyNumber = segments.filter(function (segment) { return isCheckoutEarly(segment) }).length;
        let overtimeValue = segments.reduce((accumulator, segment) => {
            return accumulator + getOvertime(segment);
        }, 0);
        if (overtimeValue == null) {
            overtimeValue = 0;
        }
        let overtimeNumber = segments.filter(function (segment) { return isWeekend(segment.date) }).length;
        let maxPoint = 0;
        for (let i = start.toDate(); i <= end.toDate(); i.setDate(i.getDate() + 1)) {
            if (!isWeekend(i)) maxPoint++;
        }
        let actualPoint = segments.reduce((accumulator, segment) => {
            return accumulator + getTimesheetPoint(segment)
        }, 0);
        let checkinLateData = {
            value: checkinLateValue,
            number: checkinLateNumber,
        }
        let checkoutEarlyData = {
            value: checkoutEarlyValue,
            number: checkoutEarlyNumber,
        }
        let overtimeData = {
            value: overtimeValue,
            number: overtimeNumber,
        }
        let pointData = {
            actual: actualPoint,
            max: maxPoint,
        };
        let timesheetData = {
            checkinLate: checkinLateData,
            checkoutEarly: checkoutEarlyData,
            overtime: overtimeData,
            point: pointData,
        };

        let timesheetTable = [];
        segments.forEach((segment) => {
            let timesheetTemp = {
                date: segment.date,
                checkinTime: segment.checkinTime,
                checkoutTime: segment.checkoutTime,
                overtime: getOvertime(segment),
                point: getTimesheetPoint(segment),
            }
            timesheetTable.push(timesheetTemp);
        });

        return res
            .status(200)
            .json({ success: true, message: `Dữ liệu công tháng này`, timesheetData: timesheetData, timesheetTable: timesheetTable });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Lọc thông tin chấm công (tháng trước)
const filterTimesheetByLastMonth = async (req, res) => {
    try {
        const start = moment().startOf('month').subtract(1, 'month');
        const end = moment().endOf('month').subtract(1, 'month');


        let timesheet = await Timesheet.findOne({ userId: req.user._id });
        let segments = timesheet.segments;

        segments = segments.filter(function (segment) {
            return moment(segment.date, "DD/MM/YYYY") >= start && moment(segment.date, "DD/MM/YYYY") <= end;
        });

        let checkinLateValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckinLate(segment);
        }, 0);
        let checkinLateNumber = segments.filter(function (segment) { return isCheckinLate(segment) }).length;
        let checkoutEarlyValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckoutEarly(segment);
        }, 0);
        let checkoutEarlyNumber = segments.filter(function (segment) { return isCheckoutEarly(segment) }).length;
        let overtimeValue = segments.reduce((accumulator, segment) => {
            return accumulator + getOvertime(segment);
        }, 0);
        if (overtimeValue == null) {
            overtimeValue = 0;
        }
        let overtimeNumber = segments.filter(function (segment) { return isWeekend(segment.date) }).length;
        let maxPoint = 0;
        for (let i = start.toDate(); i <= end.toDate(); i.setDate(i.getDate() + 1)) {
            if (!isWeekend(i)) maxPoint++;
        }
        let actualPoint = segments.reduce((accumulator, segment) => {
            return accumulator + getTimesheetPoint(segment)
        }, 0);
        let checkinLateData = {
            value: checkinLateValue,
            number: checkinLateNumber,
        }
        let checkoutEarlyData = {
            value: checkoutEarlyValue,
            number: checkoutEarlyNumber,
        }
        let overtimeData = {
            value: overtimeValue,
            number: overtimeNumber,
        }
        let pointData = {
            actual: actualPoint,
            max: maxPoint,
        };
        let timesheetData = {
            checkinLate: checkinLateData,
            checkoutEarly: checkoutEarlyData,
            overtime: overtimeData,
            point: pointData,
        };

        let timesheetTable = [];
        segments.forEach((segment) => {
            let timesheetTemp = {
                date: segment.date,
                checkinTime: segment.checkinTime,
                checkoutTime: segment.checkoutTime,
                point: getTimesheetPoint(segment),
            }
            timesheetTable.push(timesheetTemp);
        });

        return res
            .status(200)
            .json({ success: true, message: `Dữ liệu công tháng trước`, timesheetData: timesheetData, timesheetTable: timesheetTable });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Lọc thông tin chấm công (trong khoảng)
const filterTimesheetByRange = async (req, res) => {
    try {
        const { start, end } = req.body;
    } catch (error) {

    }
}

// Lấy thông tin bảng chấm công cho quản lý (tháng này)
const getTimesheetByMonthForManager = async (req, res) => {
    try {
        const start = moment().startOf('month');
        const end = moment().endOf('month');

        let timesheet = await Timesheet.find();

        let timesheets = [];

        for (let index = 0; index < timesheet.length; index++) {
            timesheet[index].segments.filter(function (segment) {
                return moment(segment.date, "DD/MM/YYYY") >= start && moment(segment.date, "DD/MM/YYYY") <= end;
            });

            let user = await User.findById(timesheet[index].userId);
            let name = user.name;

            let checkinLateValue = timesheet[index].segments.reduce((accumulator, segment) => {
                return accumulator + getCheckinLate(segment);
            }, 0);
            let checkinLateNumber = timesheet[index].segments.filter(function (segment) { return isCheckinLate(segment) }).length;
            let checkoutEarlyValue = timesheet[index].segments.reduce((accumulator, segment) => {
                return accumulator + getCheckoutEarly(segment);
            }, 0);
            let checkoutEarlyNumber = timesheet[index].segments.filter(function (segment) { return isCheckoutEarly(segment) }).length;
            let overtimeValue = timesheet[index].segments.reduce((accumulator, segment) => {
                return accumulator + getOvertime(segment);
            }, 0);
            if (overtimeValue == null) {
                overtimeValue = 0;
            }
            let overtimeNumber = timesheet[index].segments.filter(function (segment) { return isWeekend(segment.date) }).length;
            let actualPoint = timesheet[index].segments.reduce((accumulator, segment) => {
                return accumulator + getTimesheetPoint(segment);
            }, 0);
            let maxPoint = 0;
            for (let i = start.toDate(); i <= end.toDate(); i.setDate(i.getDate() + 1)) {
                if (!isWeekend(i)) maxPoint++;
            }
            let checkinLate = {
                value: checkinLateValue,
                number: checkinLateNumber,
            }
            let checkoutEarly = {
                value: checkoutEarlyValue,
                number: checkoutEarlyNumber,
            }
            let overtime = {
                value: overtimeValue,
                number: overtimeNumber,
            }
            let point = {
                actual: actualPoint,
                max: maxPoint,
            };

            let timesheetTemp = {
                name: name,
                checkinLate: checkinLate,
                checkoutEarly: checkoutEarly,
                overtime: overtime,
                point: point,
            }
            timesheets.push(timesheetTemp)
        }

        return res
            .status(200)
            .json({ success: true, message: `Bảng công nhân viên tháng này`, timesheets: timesheets });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

module.exports = {
    checking,
    getChecking,
    getMyRank,
    getTop5,
    filterTimesheetByToday,
    filterTimesheetByYesterday,
    filterTimesheetByThisWeek,
    filterTimesheetByLastWeek,
    filterTimesheetByThisMonth,
    filterTimesheetByLastMonth,
    filterTimesheetByRange,
    getTimesheetByMonthForManager,
}