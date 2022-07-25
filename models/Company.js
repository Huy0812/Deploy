const mongoose = require("mongoose")
const companySchema = new mongoose.Schema({

    //  Mã công ty
    companyId: {
        type: String,
        required: true,
        default: "VKG",
        unique: true,
    },

    // Tên
    name: {
        type: String,
        required: true,
        default: "Công ty cổ phần công nghệ Viking",
    },

    // Quy mô công ty
    size: {
        type: String,
        default: "11-25 người",
    },

    // Hotline
    hotline: {
        type: String,
        match: /^(0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{8}$/,
        required: true,
        default: "09876543210",
    },

    // Giới thiệu công ty
    introduction: {
        type: String,
        default: "Web, Mobile, Blockchain",
    },

    // Website
    website: {
        type: String,
        default: "https://vkg.vn/",
    },

});

module.exports = mongoose.model("Company", companySchema);