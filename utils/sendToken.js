const sendToken = (res, user, statusCode, message) => {
    const token = user.getJWTToken();

    const options = {
        httpOnly: true,
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
    };

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
        startWorkingDate: user.startWorkingDate,
        contractStatus: user.contractStatus,
        typeOfEmployee: user.typeOfEmployee,
        role: user.role,
        deviceId: user.deviceId,
        firstLogin: user.firstLogin,
        verified: user.verified,
        
    };

    res
        .status(statusCode)
        .cookie("token", token, options)
        .json({ success: true, message, user: userData });
};
module.exports = sendToken