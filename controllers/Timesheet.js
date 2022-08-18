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
        timesheet = await Timesheet.findOne({ "userId": req.user._id, "segments[index].date": currentDate });

        let workingTime = moment.duration(moment(timesheet.segments[index].checkoutTime, "HH:mm:ss").diff(moment(timesheet.segments[index].checkinTime, "HH:mm:ss"))).asHours();
        if (isNaN(workingTime)) {
            workingTime = 0
        }
        workingTime = Math.round(workingTime * 10) / 10;

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
            .json({ success: true, message: "Checkout thành công" });

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
            .json({ success: true, message: `Bảng xếp hạng hôm nay`, array: ranking });

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
                .json({ success: true, message: `Bạn chưa checkin hôm nay` });
        }

        res
            .status(200)
            .json({ success: true, message: `Xếp hạng hôm nay`, number: myRank + 1 });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Kiểm tra checkin muộn
function isCheckinLate(checkinTime) {
    return moment(checkinTime, "HH:mm:ss").isAfter(moment("08:30:00", "HH:mm:ss"));
}

// Kiểm tra checkout sớm
function isCheckoutEarly(checkoutTime) {
    return moment(checkoutTime, "HH:mm:ss").isBefore(moment("18:00:00", "HH:mm:ss"));
}

// Kiểm tra nếu ngày là cuối tuần
function isWeekend(date) {
    return new Date(date).getDay() === 6 || new Date(date).getDay() === 0;
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

// Tính thời gian OT
function getOvertime(segment) {
    if (isWeekend(segment.date))
        return segment.workingTime;
    return 0;
}

// Lọc thông tin chấm công (hôm nay)
const filterTimesheetDataByToday = async (req, res) => {
    try {
        const today = moment().format("DD/MM/YYYY");
        let timesheet = await Timesheet.findOne({ userId: req.user._id });
        let index = timesheet.segments.findIndex(x => x.date === today);

        if (index === -1)
            return res.status(401).json({ success: false, message: "Không có dữ liệu" });

        if (isWeekend(moment(today, "DD/MM/YYYY").toDate)) {
            checkinLateValue = 0;
            checkoutEarlyValue = 0;
            overtimeValue = timesheet.segments[index].workingTime;
            overtimeNumber = 1;
        } else {
            checkinLateValue = getCheckinLate(timesheet.segments[index].checkinTime);
            checkoutEarlyValue = getCheckoutEarly(timesheet.segments[index].checkoutTime);
            overtimeValue = 0;
            overtimeNumber = 0;
        }
        checkinLate = {
            value: checkinLateValue,
            number: 1,
        }
        checkoutEarly = {
            value: checkoutEarlyValue,
            number: 1,
        }
        overtime = {
            value: overtimeValue,
            number: overtimeNumber,
        }

        let timesheetData = {
            checkinLate: checkinLate,
            checkoutEarly: checkoutEarly,
            overtime: overtime,
        }

        return res
            .status(200)
            .json({ success: true, message: `Thông tin chấm công (hôm nay)`, Object: timesheetData });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Lọc thông tin chấm công (hôm qua)
const filterTimesheetDataByYesterday = async (req, res) => {
    try {
        const yesterday = moment().subtract(1, 'day').format("DD/MM/YYYY");
        let timesheet = await Timesheet.findOne({ userId: req.user._id });
        let index = timesheet.segments.findIndex(x => x.date === yesterday);

        if (index === -1)
            return res.status(401).json({ success: false, message: "Không có dữ liệu" });

        if (isWeekend(moment(yesterday, "DD/MM/YYYY").toDate)) {
            checkinLateValue = 0;
            checkoutEarlyValue = 0;
            overtimeValue = timesheet.segments[index].workingTime;
            overtimeNumber = 1;
        } else {
            checkinLateValue = getCheckinLate(timesheet.segments[index].checkinTime);
            checkoutEarlyValue = getCheckoutEarly(timesheet.segments[index].checkoutTime);
            overtimeValue = 0;
            overtimeNumber = 0;
        }
        checkinLate = {
            value: checkinLateValue,
            number: 1,
        }
        checkoutEarly = {
            value: checkoutEarlyValue,
            number: 1,
        }
        overtime = {
            value: overtimeValue,
            number: overtimeNumber,
        }

        let timesheetData = {
            checkinLate: checkinLate,
            checkoutEarly: checkoutEarly,
            overtime: overtime,
        }

        return res
            .status(200)
            .json({ success: true, message: `Thông tin chấm công (hôm qua)`, Object: timesheetData });

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

        checkinLateNumber = segments.filter(function (segment) { return isCheckinLate(segment.checkinTime) }).length;
        checkoutEarlyNumber = segments.filter(function (segment) { return isCheckoutEarly(segment.checkinTime) }).length;
        overtimeNumber = segments.filter(function (segment) { return isWeekend(moment(segment.date, "DD/MM/YYYY").toDate) }).length;

        checkinLateValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckinLate(segment.checkinTime);
        }, 0);
        checkoutEarlyValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckoutEarly(segment.checkoutTime);
        }, 0);
        overtimeValue = segments.reduce((accumulator, segment) => {
            return accumulator + getOvertime(segment);
        }, 0);
        if (overtimeValue == null) {
            overtimeValue = 0;
        }
        checkinLateData = {
            value: checkinLateValue,
            number: checkinLateNumber,
        }
        checkoutEarlyData = {
            value: checkinLateValue,
            number: checkinLateNumber,
        }
        overtimeData = {
            value: overtimeValue,
            number: overtimeNumber,
        }

        let timesheetData = {
            checkinLate: checkinLateData,
            checkoutEarly: checkoutEarlyData,
            overtime: overtimeData,
        }

        return res
            .status(200)
            .json({ success: true, message: `Thông tin chấm công (tuần này)`, Object: timesheetData });

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

        checkinLateNumber = segments.filter(function (segment) { return isCheckinLate(segment.checkinTime) }).length;
        checkoutEarlyNumber = segments.filter(function (segment) { return isCheckoutEarly(segment.checkinTime) }).length;
        overtimeNumber = segments.filter(function (segment) { return isWeekend(segment.date) }).length;

        checkinLateValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckinLate(segment.checkinTime);
        }, 0);
        checkoutEarlyValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckoutEarly(segment.checkoutTime);
        }, 0);
        overtimeValue = segments.reduce((accumulator, segment) => {
            return accumulator + getOvertime(segment);
        }, 0);
        if (overtimeValue == null) {
            overtimeValue = 0;
        }
        checkinLateData = {
            value: checkinLateValue,
            number: checkinLateNumber,
        }
        checkoutEarlyData = {
            value: checkoutEarlyValue,
            number: checkinLateNumber,
        }
        overtimeData = {
            value: overtimeValue,
            number: overtimeNumber,
        }

        let timesheetData = {
            checkinLate: checkinLateData,
            checkoutEarly: checkoutEarlyData,
            overtime: overtimeData,
        }

        return res
            .status(200)
            .json({ success: true, message: `Thông tin chấm công (tuần trước)`, Object: timesheetData });

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

        checkinLateNumber = segments.filter(function (segment) { return isCheckinLate(segment.checkinTime) }).length;
        checkoutEarlyNumber = segments.filter(function (segment) { return isCheckoutEarly(segment.checkinTime) }).length;
        overtimeNumber = segments.filter(function (segment) { return isWeekend(segment.date) }).length;

        checkinLateValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckinLate(segment.checkinTime);
        }, 0);
        checkoutEarlyValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckoutEarly(segment.checkoutTime);
        }, 0);
        overtimeValue = segments.reduce((accumulator, segment) => {
            return accumulator + getOvertime(segment);
        }, 0);
        if (overtimeValue == null) {
            overtimeValue = 0;
        }
        checkinLateData = {
            value: checkinLateValue,
            number: checkinLateNumber,
        }
        checkoutEarlyData = {
            value: checkoutEarlyValue,
            number: checkinLateNumber,
        }
        overtimeData = {
            value: overtimeValue,
            number: overtimeNumber,
        }

        let timesheetData = {
            checkinLate: checkinLateData,
            checkoutEarly: checkoutEarlyData,
            overtime: overtimeData,
        }

        return res
            .status(200)
            .json({ success: true, message: `Thông tin chấm công (tháng này)`, Object: timesheetData });

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

        checkinLateNumber = segments.filter(function (segment) { return isCheckinLate(segment.checkinTime) }).length;
        checkoutEarlyNumber = segments.filter(function (segment) { return isCheckoutEarly(segment.checkinTime) }).length;
        overtimeNumber = segments.filter(function (segment) { return isWeekend(segment.date) }).length;

        checkinLateValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckinLate(segment.checkinTime);
        }, 0);
        checkoutEarlyValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckoutEarly(segment.checkoutTime);
        }, 0);
        overtimeValue = segments.reduce((accumulator, segment) => {
            return accumulator + getOvertime(segment);
        }, 0);
        if (overtimeValue == null) {
            overtimeValue = 0;
        }
        checkinLateData = {
            value: checkinLateValue,
            number: checkinLateNumber,
        }
        checkoutEarlyData = {
            value: checkoutEarlyValue,
            number: checkinLateNumber,
        }
        overtimeData = {
            value: overtimeValue,
            number: overtimeNumber,
        }

        let timesheetData = {
            checkinLate: checkinLateData,
            checkoutEarly: checkoutEarlyData,
            overtime: overtimeData,
        }

        return res
            .status(200)
            .json({ success: true, message: `Thông tin chấm công (tháng trước)`, Object: timesheetData });

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

        checkinLateNumber = segments.filter(function (segment) { return isCheckinLate(segment.checkinTime) }).length;
        checkoutEarlyNumber = segments.filter(function (segment) { return isCheckoutEarly(segment.checkinTime) }).length;
        overtimeNumber = segments.filter(function (segment) { return isWeekend(segment.date) }).length;

        checkinLateValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckinLate(segment.checkinTime);
        }, 0);
        checkoutEarlyValue = segments.reduce((accumulator, segment) => {
            return accumulator + getCheckoutEarly(segment.checkoutTime);
        }, 0);
        overtimeValue = segments.reduce((accumulator, segment) => {
            return accumulator + getOvertime(segment);
        }, 0);
        if (overtimeValue == null) {
            overtimeValue = 0;
        }
        checkinLateData = {
            value: checkinLateValue,
            number: checkinLateNumber,
        }
        checkoutEarlyData = {
            value: checkoutEarlyValue,
            number: checkinLateNumber,
        }
        overtimeData = {
            value: overtimeValue,
            number: overtimeNumber,
        }

        let timesheetData = {
            checkinLate: checkinLateData,
            checkoutEarly: checkoutEarlyData,
            overtime: overtimeData,
        }

        return res
            .status(200)
            .json({ success: true, message: `Thông tin chấm công (${start} - ${end})`, Object: timesheetData });

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
            .json({ success: true, message: `Bảng công tháng này`, Object: segments });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Lấy điểm chấm công (trong tháng)
const getTimesheetPoint = async (req, res) => {
    try {
        var monthStart = moment().startOf('month');
        var monthEnd = moment().endOf('month');
        let timesheet = await Timesheet.findOne({ userId: req.user._id });
        let segments = timesheet.segments;

        segments = segments.filter(function (segment) {
            return moment(segment.date, "DD/MM/YYYY") >= monthStart && moment(segment.date, "DD/MM/YYYY") <= monthEnd;
        });

        myPoint = 0
        segments.forEach((segment) => {
            breakTime = moment.duration(moment("12:00:00", "HH:mm:ss").diff(moment("13:30:00", "HH:mm:ss"))).asHours()
            pointTemp = (segment.workingTime - breakTime) / (moment.duration(moment("18:00:00", "HH:mm:ss").diff(moment("08:30:00", "HH:mm:ss"))).asHours() - breakTime)
            if (isNaN(pointTemp)) {
                pointTemp = 0
            }
            if (isWeekend(moment(segment.date, "HH:mm, DD/MM/YYYY").toDate())) {
                pointTemp *= 1.5;
            }
            myPoint += pointTemp;
        });

        maxPoint = 0
        for (var i = monthStart.toDate(); i <= monthEnd.toDate(); i.setDate(i.getDate() + 1)) {
            if (i.getDay() != 0 && i.getDay() != 1) maxPoint++;
        }
        checkinLateNum = segments.filter(function (segment) { return isCheckinLate(segment.checkinTime) }).length;

        point = {
            actualPoint: Math.round(myPoint * 10) / 10,
            maxPoint: maxPoint,
            checkinLateNum: checkinLateNum,
        }

        return res
            .status(200)
            .json({ success: true, message: `Điểm công tháng này`, point: point });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Lấy thông tin bảng chấm công cho quản lý (tháng này)
const getTimesheetByMonthForManager = async (req, res) => {
    try {
        var monthStart = moment().startOf('month');
        var monthEnd = moment().endOf('month');
        let timesheet = await Timesheet.find();

        let timesheetData = []

        for (let index = 0; index < timesheet.length; index++) {
            timesheet[index].segments.filter(function (segment) {
                return moment(segment.date, "DD/MM/YYYY") >= monthStart && moment(segment.date, "DD/MM/YYYY") <= monthEnd;
            });

            var user = await User.findById(timesheet[index].userId);
            var name = user.name;

            var checkinLateNumber = timesheet[index].segments.filter(function (segment) { return isCheckinLate(segment.checkinTime) }).length;
            var checkoutEarlyNumber = timesheet[index].segments.filter(function (segment) { return isCheckoutEarly(segment.checkinTime) }).length;
            var overtimeNumber = timesheet[index].segments.filter(function (segment) { return isWeekend(segment.date) }).length;

            var checkinLateValue = timesheet[index].segments.reduce((accumulator, segment) => {
                return accumulator + getCheckinLate(segment.checkinTime);
            }, 0);
            var checkoutEarlyValue = timesheet[index].segments.reduce((accumulator, segment) => {
                return accumulator + getCheckoutEarly(segment.checkoutTime);
            }, 0);
            var overtimeValue = timesheet[index].segments.reduce((accumulator, segment) => {
                return accumulator + getOvertime(segment);
            }, 0);
            if (overtimeValue == null) {
                overtimeValue = 0;
            }
            checkinLateData = {
                value: checkinLateValue,
                number: checkinLateNumber,
            }
            checkoutEarlyData = {
                value: checkoutEarlyValue,
                number: checkinLateNumber,
            }
            overtimeData = {
                value: overtimeValue,
                number: overtimeNumber,
            }

            var point = 0
            timesheet[index].segments.forEach((segment) => {
                breakTime = moment.duration(moment("12:00:00", "HH:mm:ss").diff(moment("13:30:00", "HH:mm:ss"))).asHours()
                pointTemp = (segment.workingTime - breakTime) / (moment.duration(moment("18:00:00", "HH:mm:ss").diff(moment("08:30:00", "HH:mm:ss"))).asHours() - breakTime)
                if (isNaN(pointTemp)) {
                    pointTemp = 0
                }
                if (isWeekend(moment(segment.date, "HH:mm, DD/MM/YYYY").toDate())) {
                    pointTemp *= 1.5;
                }
                point += pointTemp;
            });

            let timesheetTemp = {
                name: name,
                checkinLate: checkinLateData,
                checkoutEarly: checkoutEarlyData,
                overtime: overtimeData,
                point: Math.round(point * 10) / 10,
            }

            timesheetData.push(timesheetTemp)
        }

        return res
            .status(200)
            .json({ success: true, message: `Bảng công nhân viên tháng này`, Object: timesheetData });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

module.exports = {
    checking,
    getTimesheetInfo,
    getTop5,
    getMyRank,
    filterTimesheetDataByToday,
    filterTimesheetDataByYesterday,
    filterTimesheetDataByThisWeek,
    filterTimesheetDataByLastWeek,
    filterTimesheetDataByThisMonth,
    filterTimesheetDataByLastMonth,
    filterTimesheetDataByRange,
    getTimesheetByMonth,
    getTimesheetPoint,
    getTimesheetByMonthForManager,
}