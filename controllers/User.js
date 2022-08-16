const User = require("../models/User");
const sendMail = require("../utils/sendMail");
const sendPhone = require("../utils/sendPhone");
const sendToken = require("../utils/sendToken");
const cloudinary = require("cloudinary");
const fs = require("fs");
const moment = require("moment");

const verify = async (req, res) => {
    try {
        const otp = Number(req.body.otp);

        const user = await User.findById(req.user._id);

        if (user.otp !== otp || user.otp_expiry < Date.now()) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "Invalid OTP or OTP has been expired",
                });
        }

        user.verified = true;
        user.otp = null;
        user.otp_expiry = null;

        await user.save();

        sendToken(res, user, 200, "Account verified");
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const register = async (req, res) => {
    try {
        let user = await User.findById(req.user._id);
        if (
            user.privilege !== "Quản trị viên" &&
            user.privilege !== "Quản lý"
        ) {
            return res
                .status(403)
                .json({
                    success: false,
                    message: "Forbidden: You don't have permisson to access this",
                });
        }

        const {
            name,
            email,
            phoneNumber,
            password,
            confirmPassword,
            privilege,
            startWorkingDate,
            contractStatus,
            typeOfEmployee,
            role,
        } = req.body;

        user = await User.findOne({ email });
        if (user) {
            return res
                .status(400)
                .json({ success: false, message: "Mail already exists" });
        }

        user = await User.findOne({ phoneNumber });
        if (user) {
            return res
                .status(400)
                .json({ success: false, message: "Phone number already exists" });
        }
        if (password != confirmPassword) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "The password or confirm password is incorrect",
                });
        }
        emailFix = email.trim().toLowerCase();
        user = await User.create({
            name,
            email: emailFix,
            phoneNumber,
            password,
            privilege,
            startWorkingDate,
            contractStatus,
            typeOfEmployee,
            role,
        });

        return res.status(200).json({ success: true, message: "Create account successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { phoneNumber, password } = req.body;

        if (!phoneNumber || !password) {
            return res
                .status(400)
                .json({ success: false, message: "Please enter all fields" });
        }

        const user = await User.findOne({ phoneNumber }).select("+password");

        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid phone number or password" });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid phone number or password" });
        }

        sendToken(res, user, 200, "Login successfully");
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const logout = async (req, res) => {
    try {
        res
            .status(200)
            .cookie("token", null, {
                expires: new Date(Date.now()),
            })
            .json({ success: true, message: "Logout successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        sendToken(res, user, 201, `Welcome back ${user.name}`);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getProfile = async (req, res) => {
  try {
    const {_id} =  req.body
    const user = await User.findById(_id);
    const userData = {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
        birth: user.birth,
        gender: user.gender,
        address: user.address,
        userId: user.userId,
        privilege: user.privilege,
        startWorkingDate: user.startWorkingDate,
        contractStatus: user.contractStatus,
        typeOfEmployee: user.typeOfEmployee,
        role: user.role,
        deviceId: user.deviceId,
        firstLogin: user.firstLogin,
        verified: user.verified,
    };
    res
        .status(200)
        .json({ success: true, message: `User Information`, user: userData });
} catch (error) {
    res.status(500).json({ success: false, message: error.message });
}

};

const getAllProfile = async (req, res) => {
    try {
        const users = await User.find();
        sort = users.sort((a, b) => a.userId - b.userId);

        return res
            .status(200)
            .json({
                success: true,
                message: `All profiles (sort by userId)`,
                array: sort,
            });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateAdmin = async (req, res) => {
    try {
        let userAdmin = await User.findById(req.user._id);
        let userPass = await User.findById(req.user._id).select("+password")
        if (userAdmin.privilege !== "Quản trị viên") {
            return res
                .status(403)
                .json({ success: false, message: "Forbidden: You don't have permisson to access this" });
        }
        const {
            _id,
            name,
            email,
            phoneNumber,
            startWorkingDate,
            contractStatus,
            typeOfEmployee,
            role,
            privilege,
            password
        } = req.body;
        user = await User.findById(_id);

        const isMatch = await userPass.comparePassword(password);
        if (!isMatch) {
            return res
                .status(400)
                .json({ success: false, message: "Passwords does not match" });
        }
        if (name) user.name = name;

        if (email) {
            emailFix = email.trim().toLowerCase();
            user.email = emailFix;
        }

        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (startWorkingDate) user.startWorkingDate = starWorkingDate;
        if (contractStatus) user.contractStatus = contractStatus;
        if (typeOfEmployee) user.typeOfEmployee = typeOfEmployee;
        if (role) user.role = role;
        if (privilege) user.privilege = privilege;
        await user.save();
        res
            .status(200)
            .json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        let user = await User.findById(req.user._id);
        const userPass = await User.findById(req.user._id).select("+password");
        const avatar = req.files.avatar.tempFilePath;
        if (user.avatar.public_id != null) {
            await cloudinary.v2.uploader.destroy(user.avatar.public_id);
        }
        user = await User.findById(req.user._id);
        const mycloud = await cloudinary.v2.uploader.upload(avatar);
        fs.rmSync("./tmp", { recursive: true });

        user.avatar = {
            public_id: mycloud.public_id,
            url: mycloud.secure_url,
        };

        const { name, email, phoneNumber, birth, gender, address, password } = req.body;
        const isMatch = await userPass.comparePassword(password);
        if (!isMatch) {
            return res
                .status(400)
                .json({ success: false, message: "Passwords does not match" });
        }

        if (name) user.name = name;

        if (email) {
            emailFix = email.trim().toLowerCase();
            user.email = emailFix;
        }

        if (phoneNumber) user.phoneNumber = phoneNumber;

        if (birth) {
            user.birth = birth;
        }
        if (gender) user.gender = gender;
        if (address) user.address = address;

        await user.save();
        res
            .status(200)
            .json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateAvatar = async (req, res) => {
    try {
        let user = await User.findById(req.user._id);
        const avatar = req.files.avatar.tempFilePath;
        if (user.avatar.public_id != null) {
            await cloudinary.v2.uploader.destroy(user.avatar.public_id);
        }
        user = await User.findById(req.user._id);
        const mycloud = await cloudinary.v2.uploader.upload(avatar);
        fs.rmSync("./tmp", { recursive: true });

        user.avatar = {
            public_id: mycloud.public_id,
            url: mycloud.secure_url,
        };
        await user.save();
        res
            .status(200)
            .json({ success: true, message: "Avatar updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteProfile = async (req, res) => {
    try {
        let user = await User.findById(req.user._id);
        if (user.privilege !== "Quản trị viên") {
            return res
                .status(403)
                .json({ success: false, message: "Forbidden: You don't have permisson to access this" });
        }

        const { userId } = req.body;
        user = await User.findById(userId)
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "None exists" });
        }
        await User.findByIdAndDelete(userId)
        res
            .status(200)
            .json({ success: true, message: "Deleted user successfully" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateDeviceId = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
        const { deviceId } = req.body;

        userAll = await User.findOne({ deviceId });
        if (userAll) {
            return res
                .status(400)
                .json({ success: false, message: "Device Id already exists" });
        }
        user.deviceId = deviceId;
        await user.save();
        res
            .status(200)
            .json({ success: true, message: "Device Id updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
const updatePassword = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("+password");

        const { oldPassword, newPassword, confirmPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res
                .status(400)
                .json({ success: false, message: "Please enter all fields" });
        }

        const isMatch = await user.comparePassword(oldPassword);

        if (!isMatch) {
            return res
                .status(400)
                .json({ success: false, message: "Passwords does not match" });
        }
        if (newPassword == confirmPassword) {
            user.password = newPassword;
        } else {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "The password or confirm password is incorrect",
                });
        }
        await user.save();
        res
            .status(200)
            .json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const phonePassword = async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        // emailFix = email.trim().toLowerCase();

        let user = await User.findOne({ phoneNumber: phoneNumber });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid phone number" });
        }

        const otp = Math.floor(Math.floor(100000 + Math.random() * 900000));

        user.resetPasswordOtp = otp;
        user.resetPasswordOtpExpiry = Date.now() + 10 * 60 * 1000;

        await user.save();

        const message = `Your OTP for reseting the password is ${otp}. If you did not request for this, please ignore this email.`;

        // await sendMail(emailFix, "Request for reseting password", message);
        await sendPhone(phoneNumber, message);

        res
            .status(200)
            .json({ success: true, message: `OTP has been sent to ${phoneNumber}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;

        emailFix = email.trim().toLowerCase();

        let user = await User.findOne({ email: emailFix });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid email" });
        }

        const otp = Math.floor(Math.floor(100000 + Math.random() * 900000));

        user.resetPasswordOtp = otp;
        user.resetPasswordOtpExpiry = Date.now() + 10 * 60 * 1000;

        await user.save();

        const message = `Your OTP for reseting the password is ${otp}. If you did not request for this, please ignore this email.`;

        await sendMail(emailFix, "Request for reseting password", message);

        res
            .status(200)
            .json({ success: true, message: `OTP has been sent to ${email}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { otp, newPassword, rewritePassword } = req.body;

        const user = await User.findOne({
            resetPasswordOtp: otp,
            resetPasswordExpiry: { $gt: Date.now() },
        });

        if (!user) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "Invalid OTP or OTP has been expired",
                });
        }
        if (newPassword == rewritePassword) {
            user.password = newPassword;
            user.resetPasswordOtp = null;
            user.resetPasswordExpiry = null;
        } else {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "The password or confirm password is incorrect",
                });
        }
        await user.save();

        res
            .status(200)
            .json({ success: true, message: `Password changed successfully` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const searchUser = async (req, res) => {
    try {
        const keyword = req.query.name
            ? {
                $or: [
                    { name: { $regex: req.query.name, $options: "i" } },
                ],
            }
            : {};

        const users = await User.find(keyword);
        res
            .status(200)
            .json({ success: false, message: "Users", array: users })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }

};

const filterUserByRole = async (req, res) => {
    try {
        let user = await User.findOne({ userId: req.user._id });
        let segments = timesheet.segments;

        segments = segments.filter(function (segment) {
            return moment(segment.date, "DD/MM/YYYY") >= weekStart && moment(segment.date, "DD/MM/YYYY") <= weekEnd;
        });
        res
            .status(200)
            .json({ success: false, message: "Users", array: users })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }

};
module.exports = {
    register,
    verify,
    login,
    logout,
    getMyProfile,
    getAllProfile,
    updateProfile,
    updateAvatar,
    deleteProfile,
    updatePassword,
    forgetPassword,
    resetPassword,
    updateAdmin,
    phonePassword,
    updateDeviceId,
    searchUser,
    getProfile,
};
