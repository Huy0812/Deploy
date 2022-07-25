const jwt = require("jsonwebtoken")
const User = require("../models/User")
const isAuthenticated = async (req, res, next) => {
    try {
        const { token } = req.cookies;

        if (!token) {
            return res.status(401).json({ success: false, message: "Login First" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findById(decoded._id);

        next();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
module.exports = isAuthenticated