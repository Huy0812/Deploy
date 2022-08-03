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

        const companyData = {
            _id: company._id,
            name: company.name,
            size: company.size,
            hotline: company.hotline,
            introduction: company.introduction,
            website: company.website,
        };

        res
            .status(200)
            .json({ success: true, message: `Company Information`, company: companyData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateInformation = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user.privilege.equals("Quản trị viên")) {
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

        await company.save();

        res
            .status(200)
            .json({ success: true, message: "Updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getInformation, updateInformation, create }