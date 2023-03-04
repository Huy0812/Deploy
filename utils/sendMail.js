const nodeMailer = require('nodemailer') // khai báo sử dụng module nodemailer

const sendMail = async (options) => {

    const transporter = nodeMailer.createTransport({ // config mail server

        service: process.env.SMPT_SERVICE,
        auth: {
            user: process.env.SMPT_MAIL,
            pass: process.env.SMPT_PASSWORD
        }
    })

    const mailOptions = { // thiết lập đối tượng, nội dung gửi mail
        from: 'Công',
        to: options.email,
        subject: options.subject,
        text: options.message
    }

    transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
            console.log(err)
        } else {
            console.log('Message sent: ' + info.response)
        }
    })
}

module.exports = sendMail