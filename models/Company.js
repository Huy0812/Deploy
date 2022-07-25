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
        required: true,
        default: "xxxxx-xxx-xxx",
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