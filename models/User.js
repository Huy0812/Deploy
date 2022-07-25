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
        required: true,
        unique: true,
    },

    // SĐT
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
    },

    // Mật khẩu
    password: {
        type: String,
        required: true,
        minlength: [8, "Password must be at least 8 characters long"],
        select: false,
    },

    // Vai trò: admin, manager, hoặc user (mặc định)
    role: {
        type: String,
        required: true,
        default: "user"
    },

    // Avatar
    avatar: {
       public_id: String,
       url: String,
    },


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
        //required: true,
        unique: true,
    },

    // Ngày bắt đầu làm việc
    startWorkingDate: {
        type: Date,
        default: Date.now,
    },

    // Tình trạng hợp đồng: Full-time, Part-time
    contractStatus: {
        type: String,
    },

    // Loại hình nhân viên
    typeOfEmployee: {
        type: String,
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