const nodemailer = require("nodemailer");

module.exports.sendMail = async (email, subject, html) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: subject,
            html: html,
        };

        // Gửi email
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
        return info; // Trả về thông tin email đã gửi
    } catch (error) {
        console.error("Error sending email:", error);
        throw error; // Ném lỗi ra ngoài để xử lý
    }
};
