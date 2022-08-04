const app = require('./app');
const dotenv = require("dotenv")
const connectDatabase = require("./config/database")
const cloudinary = require("cloudinary")
const CLOUD_NAME = "dkg6au9i8"
const CLOUD_API_KEY = "661768686494964"
const CLOUD_API_SECRET = "GTscWyzjFQd3mulJpUxYKk__KnM"
dotenv.config({
    path: "./config/config.env"
})
cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: CLOUD_API_KEY,
    api_secret: CLOUD_API_SECRET
})
connectDatabase()
app.listen(process.env.PORT, () => {
    console.log("Server is running on port " + process.env.PORT)
})