const User = require("../models/User")
const sendMail = require("../utils/sendMail")
const sendToken = require("../utils/sendToken")
const cloudinary = require("cloudinary")
const fs = require("fs")
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
        const { name, email, phoneNumber, password, startWorkingDate, contractStatus, typeOfEmployee } = req.body;

        const avatar = req.files.avatar.tempFilePath;

        let user = await User.findOne({ email });

        if (user) {
            return res
                .status(400)
                .json({ success: false, message: "User already exists" });
        }

        const otp = Math.floor(Math.random() * 1000000);

        const mycloud = await cloudinary.v2.uploader.upload(avatar);

        fs.rmSync("./tmp", { recursive: true });

        user = await User.create({
            name,
            email,
            phoneNumber,
            password,
            avatar: {
               public_id: mycloud.public_id,
               url: mycloud.secure_url,
            },
            startWorkingDate,
            contractStatus,
            typeOfEmployee,
            otp,
            otp_expiry: new Date(Date.now() + process.env.OTP_EXPIRE * 60 * 1000),
        });

        await sendMail(email, "Verify your account", `Your OTP is ${otp}`);

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

        const { name } = req.body;
        const avatar = req.files.avatar.tempFilePath;

        if (name) user.name = name;
        if (avatar) {
            await cloudinary.v2.uploader.destroy(user.avatar.public_id);

            const mycloud = await cloudinary.v2.uploader.upload(avatar);

            fs.rmSync("./tmp", { recursive: true });

            user.avatar = {
                public_id: mycloud.public_id,
                url: mycloud.secure_url,
            };
        }

        await user.save();

        res
            .status(200)
            .json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteProfile = async (req, res) => {
    await User.findByIdAndDelete(req.params.id)

    try {
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

        const otp = Math.floor(Math.random() * 1000000);

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
        const { otp, newPassword } = req.body;

        const user = await User.findOne({
            resetPasswordOtp: otp,
            resetPasswordExpiry: { $gt: Date.now() },
        });

        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid OTP or OTP has been expired" });
        }
        user.password = newPassword;
        user.resetPasswordOtp = null;
        user.resetPasswordExpiry = null;
        await user.save();

        res
            .status(200)
            .json({ success: true, message: `Password changed successfully` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { register, verify, login, logout, getProfile, updateProfile, deleteProfile, updatePassword, forgetPassword, resetPassword }