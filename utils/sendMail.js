var nodemailer = require('nodemailer'); // khai báo sử dụng module nodemailer

var sendMail = async (email, subject, text) => {
    var transporter = nodemailer.createTransport({ // config mail server

        service: 'Gmail',
        auth: {
            user: 'dangphanthanhconggg@gmail.com',
            pass: 'otjkfjzhtrojykek'
        }
    });
    var mainOptions = { // thiết lập đối tượng, nội dung gửi mail
        from: 'Công',
        to: email,
        subject,
        text,
    }

    transporter.sendMail(mainOptions, function (err, info) {
        if (err) {
            console.log(err);
        } else {
            console.log('Message sent: ' + info.response);
        }
    });
};

module.exports = sendMail