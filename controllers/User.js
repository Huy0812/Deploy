const User = require("../models/User");
const sendMail = require("../utils/sendMail");
const sendPhone = require("../utils/sendPhone");
const sendToken = require("../utils/sendToken");
const cloudinary = require("cloudinary");
const fs = require("fs");

const verify = async (req, res) => {
    try {
        const otp = Number(req.body.otp);
        const user = await User.findById(req.user._id);
        if (user.otp !== otp || user.otp_expiry < Date.now()) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "OTP không đúng hoặc đã hết hạn",
                });
        }

        user.verified = true;
        user.otp = null;
        user.otp_expiry = null;
        await user.save();

        sendToken(res, user, 200, "Xác nhận tài khoản thành công");
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
                    message: "Bạn không có quyền truy cập chức năng này",
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
        if (!name || !email || !phoneNumber || !password || !confirmPassword || !privilege
            || !startWorkingDate || !contractStatus || !typeOfEmployee || !role) {
            return res
                .status(400)
                .json({ success: false, message: "Xin vui lòng nhập đầy đủ các trường" });
        }

        user = await User.findOne({ email });
        if (user) {
            return res
                .status(400)
                .json({ success: false, message: "Email này đã tồn tại" });
        }
        user = await User.findOne({ phoneNumber });
        if (user) {
            return res
                .status(400)
                .json({ success: false, message: "Số điện thoại này đã tồn tại" });
        }

        if (password != confirmPassword) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "Mật khẩu không khớp",
                });
        }

        user = await User.create({
            name,
            email,
            phoneNumber,
            password,
            privilege,
            startWorkingDate,
            contractStatus,
            typeOfEmployee,
            role,
        });

        return res.status(200).json({ success: true, message: "Tạo tài khoản thành công" });
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
                .json({ success: false, message: "Xin vui lòng nhập đầy đủ các trường" });
        }

        const user = await User.findOne({ phoneNumber }).select("+password");
        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: "Số điện thoại hoặc mật khẩu không hợp lệ" });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res
                .status(400)
                .json({ success: false, message: "Số điện thoại hoặc mật khẩu không hợp lệ" });
        }

        sendToken(res, user, 200, "Đăng nhập thành công");
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
            .json({ success: true, message: "Đăng xuất thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const { _id } = req.body;
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
            verified: user.verified,
        };
        res
            .status(200)
            .json({ success: true, message: `Thông tin tài khoản`, user: userData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }

};

const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        sendToken(res, user, 201, `Xin chào ${user.name}`);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAllProfile = async (req, res) => {
    try {
        const users = await User.find();
        const sort = users.sort((a, b) => a.userId - b.userId);

        return res
            .status(200)
            .json({
                success: true,
                message: `Tất cả tài khoản`,
                array: sort,
            });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const userPass = await User.findById(req.user._id).select("+password");

        const avatar = req.files.avatar.tempFilePath;
        if (user.avatar.public_id != null) {
            await cloudinary.v2.uploader.destroy(user.avatar.public_id);
        }
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
                .json({ success: false, message: "Mật khẩu không khớp" });
        }

        if (name) user.name = name;
        if (email) user.email = email;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (birth) user.birth = birth;
        if (gender) user.gender = gender;
        if (address) user.address = address;
        await user.save();
        res
            .status(200)
            .json({ success: true, message: "Cập nhật tài khoản thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateAvatar = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        const avatar = req.files.avatar.tempFilePath;
        if (user.avatar.public_id != null) {
            await cloudinary.v2.uploader.destroy(user.avatar.public_id);
        }
        const mycloud = await cloudinary.v2.uploader.upload(avatar);
        fs.rmSync("./tmp", { recursive: true });
        user.avatar = {
            public_id: mycloud.public_id,
            url: mycloud.secure_url,
        };
        await user.save();

        res
            .status(200)
            .json({ success: true, message: "Cập nhật avatar thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateDeviceId = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
        const { deviceId } = req.body;

        const users = await User.findOne({ deviceId });
        if (users) {
            return res
                .status(400)
                .json({ success: false, message: "Mã thiết bị đã tồn tại" });
        }
        user.deviceId = deviceId;
        await user.save();

        res
            .status(200)
            .json({ success: true, message: "Cập nhật mã thiết bị thành công" });
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
                .json({ success: false, message: "Xin vui lòng nhập hết các trường" });
        }

        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) {
            return res
                .status(400)
                .json({ success: false, message: "Mật khẩu không đúng" });
        }
        if (newPassword == confirmPassword) {
            user.password = newPassword;
        } else {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "Mật khẩu không khớp",
                });
        }
        await user.save();

        res
            .status(200)
            .json({ success: true, message: "Cập nhật mật khẩu thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateAdmin = async (req, res) => {
    try {
        const userAdmin = await User.findById(req.user._id).select("+password");
        if (userAdmin.privilege !== "Quản trị viên") {
            return res
                .status(403)
                .json({ success: false, message: "Bạn không có quyền truy cập chức năng này" });
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
        const user = await User.findById(_id);

        const isMatch = await userAdmin.comparePassword(password);
        if (!isMatch) {
            return res
                .status(400)
                .json({ success: false, message: "Mật khẩu không khớp" });
        }

        if (name) user.name = name;
        if (email) user.email = email;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (startWorkingDate) user.startWorkingDate = startWorkingDate;
        if (contractStatus) user.contractStatus = contractStatus;
        if (typeOfEmployee) user.typeOfEmployee = typeOfEmployee;
        if (role) user.role = role;
        if (privilege) user.privilege = privilege;
        await user.save();

        res
            .status(200)
            .json({ success: true, message: "Cập nhật tài khoản thành công" });
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
                .json({ success: false, message: "Bạn không có quyền truy cập chức năng này" });
        }

        const { userId } = req.body;
        user = await User.findById(userId)
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "Tài khoản không tồn tại" });
        }
        await User.findByIdAndDelete(userId);
        res
            .status(200)
            .json({ success: true, message: "Xóa tài khoản thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const forgetPasswordPhone = async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        let user = await User.findOne({ phoneNumber: phoneNumber });
        if (!user) {
            return res.status(400).json({ success: false, message: "Số điện thoại không đúng" });
        }

        const otp = Math.floor(Math.floor(100000 + Math.random() * 900000));
        user.resetPasswordOtp = otp;
        user.resetPasswordOtpExpiry = Date.now() + 10 * 60 * 1000;
        await user.save();

        const message = `Mã OTP để đặt lại mật khẩu là ${otp}. Nếu bạn không gửi yêu cầu, xin vui lòng bỏ qua email này.`;
        await sendPhone(phoneNumber, message);

        res
            .status(200)
            .json({ success: true, message: `OTP đã được gửi tới ${phoneNumber}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const forgetPasswordEmail = async (req, res) => {
    try {
        const { email } = req.body;

        let user = await User.findOne({ email: email });
        if (!user) {
            return res.status(400).json({ success: false, message: "Email không đúng" });
        }
        emailFix = email.trim()
        const otp = Math.floor(Math.floor(100000 + Math.random() * 900000));
        user.resetPasswordOtp = otp;
        user.resetPasswordOtpExpiry = Date.now() + 10 * 60 * 1000;
        await user.save();

        const message = `Mã OTP để đặt lại mật khẩu là ${otp}. Nếu bạn không gửi yêu cầu, xin vui lòng bỏ qua email này.`;
        await sendMail(emailFix, "Yêu cầu đặt lại mật khẩu", message);

        res
            .status(200)
            .json({ success: true, message: `OTP đã được gửi tới ${email}` });
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
                    message: "OTP không đúng hoặc đã hết hạn!",
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
                    message: "Mật khẩu không khớp",
                });
        }
        await user.save();

        res
            .status(200)
            .json({ success: true, message: `Thay đổi mật khẩu thành công` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const searchUser = async (req, res) => {
    try {
        const name = req.query.name
            ? {
                name: { $regex: req.query.name, $options: "i" }
            }
            : {};
        const privilege = req.query.privilege
            ? {
                privilege: { $regex: req.query.privilege, $options: "i" }
            }
            : {};
        const typeOfEmployee = req.query.typeOfEmployee
            ? {
                typeOfEmployee: { $regex: req.query.typeOfEmployee, $options: "i" }
            }
            : {};
        const role = req.query.role
            ? {
                role: { $regex: req.query.role, $options: "i" }
            }
            : {};
        const contractStatus = req.query.contractStatus
            ? {
                contractStatus: { $regex: req.query.contractStatus, $options: "i" }
            }
            : {};
        const users = await User.find(name).find(privilege).find(typeOfEmployee).find(role).find(contractStatus);

        res
            .status(200)
            .json({ success: true, message: "Người dùng", array: users })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const searchUserTask = async (req, res) => {
    try {
        const name = req.query.name
            ? {
                name: { $regex: req.query.name, $options: "i" }
            }
            : {};
        const users = await User.find(name)
        res
            .status(200)
            .json({ success: true, message: "Người dùng", array: users })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    verify,
    register,
    login,
    logout,
    getProfile,
    getMyProfile,
    getAllProfile,
    updateProfile,
    updateAvatar,
    updateDeviceId,
    updatePassword,
    updateAdmin,
    deleteProfile,
    forgetPasswordPhone,
    forgetPasswordEmail,
    resetPassword,
    searchUser,
    searchUserTask
}