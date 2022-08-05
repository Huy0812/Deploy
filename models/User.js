const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const userSchema = new mongoose.Schema({

    // Tên
    name: {
        type: String,
        required: true,
    },

    // Email
    email: {
        type: String,
        match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
        required: true,
        unique: true,
    },

    // SĐT
    phoneNumber: {
        type: String,
        match: /^(0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/,
        required: true,
        unique: true,
    },

    // Mật khẩu
    password: {
        type: String,
        match: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/,
        required: true,
        minlength: [8, "Password must be at least 8 characters long, one uppercase letter, one lowercase letter, one number and one special character"],
        select: false,
    },

    // Vai trò: Quản trị viên, Quản lý, hoặc Người dùng (mặc định)
    privilege: {
        type: String,
        required: true,
    },

    // Avatar
    avatar: {
        public_id: {
            type: String,
            default: null,
        },
        url: {
            type: String,
            default: null,
        }
    },

    // Ngày sinh
    birth: {
        type: String,
        default: "",
    },

    // Giới tính
    gender: {
        type: String,
        default: "",
    },

    // Địa chỉ
    address: {
        type: String,
        default: "",
    },

    //  Mã công ty
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        default: "62e8947f86efb4e31838346d",
        unique: true,
    },

    //  Mã nhân viên
    userId: {
        type: Number,
        unique: true,
    },

    // Ngày bắt đầu làm việc
    startWorkingDate: {
        type: String,
        required: true,
    },

    // Trạng thái hợp đồng: Đang làm việc, Đã nghỉ việc
    contractStatus: {
        type: String,
        required: true,
    },

    // Loại hình nhân sự: Nhân viên Full-time, Nhân viên Part-time, Internship (Thực tập sinh)
    typeOfEmployee: {
        type: String,
        required: true,
    },

    // Vai trò: Developer, Tester, ...
    role: {
        type: String,
        required: true,
    },

    // Xác thực
    verified: {
        type: Boolean,
        default: true,
    },
    otp: Number,
    otp_expiry: Date,
    resetPasswordOtp: Number,
    resetPasswordOtpExpiry: Date,
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.getJWTToken = function () {
    return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
    });
};

userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.index({ otp_expiry: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("User", userSchema);