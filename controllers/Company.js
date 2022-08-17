const User = require("../models/User")
const Company = require("../models/Company")

const create = async (req, res) => {
    try {
        company = await Company.create({});
        res
            .status(200)
            .json({ success: true, message: "Created successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getInformation = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const companyId = user.companyId;
        const company = await Company.findById(companyId);

        res
            .status(200)
            .json({ success: true, message: `Company Information`, company: company });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
const updateCompanyIp = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
        if (user.privilege !== "Quản trị viên") {
            return res
                .status(403)
                .json({ success: false, message: "Forbidden: You don't have permisson to access this" });
        }
        const companyId = user.companyId;
        const company = await Company.findById(companyId);
        const { companyIp } = req.body;
        company.companyIp = companyIp;
        await company.save();
        res
            .status(200)
            .json({ success: true, message: "CompanyIp updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
const updateInformation = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user.privilege !== "Quản trị viên") {
            return res
                .status(403)
                .json({ success: false, message: "Forbidden: You don't have permisson to access this" });
        }

        const companyId = user.companyId;
        const company = await Company.findById(companyId);

        const { name, size, hotline, introduction, website } = req.body;

        if (name) company.name = name;
        if (size) company.size = size;
        if (hotline) company.hotline = hotline;
        if (introduction) company.introduction = introduction;
        if (website) company.website = website;
        if (fanpage) company.fanpage = fanpage;

        await company.save();

        res
            .status(200)
            .json({ success: true, message: "Updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { create, getInformation, updateInformation, updateCompanyIp }