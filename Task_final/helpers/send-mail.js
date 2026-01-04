const nodemailer = require("nodemailer");

module.exports.sendMail = (email, subject, html) => {
  // Tạo transporter sử dụng Gmail
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // mật khẩu ứng dụng (App Password)
    },
  });

  // Cấu hình email
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: html,
  };

  // Gửi mail
  transporter.sendMail(mailOptions, function (error, infor) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent:" + infor.response);
    }
  });
};
