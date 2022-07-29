const User = require("../models/User")
const sendMail = require("../utils/sendMail")
const sendToken = require("../utils/sendToken")
const cloudinary = require("cloudinary")
const fs = require("fs")
const moment = require("moment")
const verify = async (req, res) => {
    try {
        const otp = Number(req.body.otp);

        const user = await User.findById(req.user._id);

        if (user.otp !== otp || user.otp_expiry < Date.now()) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid OTP or OTP has been expired" });
        }

        user.verified = true;
        user.otp = null;
        user.otp_expiry = null;

        await user.save();

        sendToken(res, user, 200, "Account verified");
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

const register = async (req, res) => {
    try {
        const { name, email, phoneNumber, password, role, startWorkingDate, contractStatus, typeOfEmployee } = req.body;

        let user = await User.findOne({ email });
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

        // const otp = Math.floor(Math.floor(100000 + Math.random() * 900000));

        var dateMomentObject = moment(startWorkingDate, "YYYY-MM-DD", true).toDate();
        // kiểm tra và định dạng lại Date
        //if (!dateMomentObject.isValid()) {
        //    return res
        //       .status(400)
        //       .json({ success: false, message: "Wrong date format. Must be dd/mm/yyyy" });
        //}

        user = await User.create({
            name,
            email,
            phoneNumber,
            password,
            role,
            startWorkingDate: dateMomentObject,
            contractStatus,
            typeOfEmployee,
            // otp,
            // otp_expiry: new Date(Date.now() + process.env.OTP_EXPIRE * 60 * 1000),
        });

        // await sendMail(email, "Verify your account", `Your OTP is ${otp}`);

        sendToken(
            res,
            user,
            201,
            "OTP has been sent to your email, please verify your account"
        );
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

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        sendToken(res, user, 201, `Welcome back ${user.name}`);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        const { birth, gender, address } = req.body;

        if (birth) {
            var dateMomentObject = moment(birth, "DD/MM/YYYY", true);
            user.birth = dateMomentObject;
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
        const user = await User.findById(req.user._id);
        const avatar = req.files.avatar.tempFilePath;

        if (!user.avatar.public_id && !user.avatar.url) {
            const mycloud = await cloudinary.v2.uploader.upload(avatar);
            fs.rmSync("./tmp", { recursive: true });
            user.avatar = {
                public_id: mycloud.public_id,
                url: mycloud.secure_url,
            };
            await user.save();
        }
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);
        const mycloud = await cloudinary.v2.uploader.upload(avatar);
        fs.rmSync("./tmp", { recursive: true });
        user.avatar = {
            public_id: mycloud.public_id,
            url: mycloud.secure_url,
        };
        await user.save();
        res.status(500).json({ success: true, message: "Avatar updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteProfile = async (req, res) => {
    try {
        const { userId } = req.body;
        await User.findOneAndDelete({ userId });
        res.status(204).json({
            status: 'Deleted successfully',
            data: {}
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }

};

const updatePassword = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("+password");

        const { oldPassword, newPassword } = req.body;

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

        user.password = newPassword;

        await user.save();

        res
            .status(200)
            .json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid email" });
        }

        const otp = Math.floor(Math.floor(100000 + Math.random() * 900000));

        user.resetPasswordOtp = otp;
        user.resetPasswordOtpExpiry = Date.now() + 10 * 60 * 1000;

        await user.save();

        const message = `Your OTP for reseting the password is ${otp}. If you did not request for this, please ignore this email.`;

        await sendMail(email, "Request for reseting password", message);

        res.status(200).json({ success: true, message: `OTP has been sent to ${email}` });
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
                .json({ success: false, message: "Invalid OTP or OTP has been expired" });
        }
        if (newPassword == rewritePassword) {
            user.password = newPassword;
            user.resetPasswordOtp = null;
            user.resetPasswordExpiry = null;
        }
        else {
            return res
                .status(400)
                .json({ success: false, message: "The password or confirm password is incorrect" })
        }
        await user.save();

        res
            .status(200)
            .json({ success: true, message: `Password changed successfully` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { register, verify, login, logout, getProfile, updateProfile, updateAvatar, deleteProfile, updatePassword, forgetPassword, resetPassword }