const Company = require("../models/Company")

const create = async (req, res) => {
    try {
        company = await Company.create({

        });
        res
            .status(200)
            .json({ success: true, message: "Created successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getInformation = async (req, res) => {
    try {
        const company = await company.findById(req.company._id);

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateInformation = async (req, res) => {
    try {
        const company = await company.findById(req.company._id);

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