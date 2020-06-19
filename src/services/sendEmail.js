import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

// Function to send single mail to single user at once
export const sendEmail = async (recipient, subject, html_body) => {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: recipient,
      from: "account@motionwares.com",
      subject: subject,
      html: html_body,
    };
    await sgMail.send(msg);
  } catch (err) {
    throw err;
  }
};

// Function to send single mail to multiple users at once
export const sendMutipleEmail = async (recipients, subject, html_body) => {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: [recipients],
      from: "account@motionwares.com",
      subject: subject,
      html: html_body,
    };
    await sgMail.sendMultiple(msg);
  } catch (err) {
    throw err;
  }
};

const email_template = `
Hi Raphael Uwaifo,
To verify your email address (mr.uwaifo@gmail.com), please click the following link.

If you believe you received this email in error, please contact us at support@toptal.com.

Thank you,
The Toptal Team `;
