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
        match: /^[a-z][a-z0-9_.]{5,32}@[a-z0-9]{2,}(.[a-z0-9]{2,4}){1,2}$/,
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
        match: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        required: true,
        minlength: [8, "Password must be at least 8 characters long, one uppercase letter, one lowercase letter, one number and one special character"],
        select: false,
    },

    // Vai trò: admin, manager, hoặc user (mặc định)
    role: {
        type: String,
        required: true,
        default: "user"
    },

    // Avatar
    //avatar: {
    //    public_id: String,
    //    url: String,
    //},


    //  Mã công ty
    companyId: {
        type: String,
        required: true,
        default: "VKG",
        unique: true,
    },

    //  Mã nhân viên
    userId: {
        type: Number,
        unique: true,
    },

    // Ngày bắt đầu làm việc
    startWorkingDate: {
        type: Date,
        match: /^([0-2][0-9]|(3)[0-1])(\/)(((0)[0-9])|((1)[0-2]))(\/)\d{4}$/,
        required: true,
    },

    // Tình trạng hợp đồng: Full-time, Part-time
    contractStatus: {
        type: String,
        required: true,
    },

    // Loại hình nhân viên
    typeOfEmployee: {
        type: String,
        required: true,
    },

    // Xác thực
    verified: {
        type: Boolean,
        default: false,
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