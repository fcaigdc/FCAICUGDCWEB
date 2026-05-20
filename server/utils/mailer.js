const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use 'gmail' as service provider based on email address
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Send an OTP verification email
 * @param {string} to - Recipient email address
 * @param {string} otp - The 6-digit OTP code
 */
const sendOTPEmail = async (to, otp) => {
  const mailOptions = {
    from: `"FCAI CUGD Club" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: 'Your Password Reset Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #d64b1c; text-align: center;">FCAI CUGD Club Password Reset</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password. Use the following 6-digit code to complete the process:</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="margin: 0; font-size: 32px; letter-spacing: 5px; color: #333;">${otp}</h1>
        </div>
        
        <p style="color: #dc3545; font-weight: bold; text-align: center;">This code will expire in 10 minutes.</p>
        
        <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
        
        <hr style="border-top: 1px solid #eee; margin-top: 30px;" />
        <p style="font-size: 12px; color: #888; text-align: center;">
          © ${new Date().getFullYear()} FCAI CUGD Club. All rights reserved.<br/>
          This is an automated message, please do not reply.
        </p>
      </div>
      <br>
      <hr>
      <br>
      <table cellpadding="0" cellspacing="0" border="0" style="vertical-align: -webkit-baseline-middle; font-size: medium; font-family: Georgia;">
        <tbody>
          <tr>
            <td>
              <table cellpadding="0" cellspacing="0" border="0" style="vertical-align: -webkit-baseline-middle; font-size: medium; font-family: Georgia;">
                <tbody>
                  <tr>
                    <td style="vertical-align: top;">
                      <table cellpadding="0" cellspacing="0" border="0" style="vertical-align: -webkit-baseline-middle; font-size: medium; font-family: Georgia;">
                        <tbody>
                          <tr>
                            <td style="text-align: center;">
                              <img src="https://www.dropbox.com/scl/fi/j1bejb01di4au2h8184sr/LOGO2-06-1.png?rlkey=dfsjxf4i2weg73iimh8jgdfxe&st=0xltsuxl&dl=0&raw=1" role="presentation" width="130" style="max-width: 128px; display: block;">
                            </td>
                          </tr>

                          <tr>
                            <td height="24"></td>
                          </tr>

                          <tr>
                            <td style="text-align: center;">
                              <div>
                                <a href="https://www.linkedin.com/company/fcai-cu-game-development-club/posts/?feedView=all" style="display:inline-block;background-color:rgb(245,87,0);border-radius:50%;">
                                  <img src="https://cdn2.hubspot.net/hubfs/53/tools/email-signature-generator/icons/linkedin-icon-dark-2x.png" width="24">
                                </a>

                                <span style="display:inline-block;width:5px;"></span>

                                <a href="https://www.facebook.com/FCA.Cairo.GD.Club" style="display:inline-block;background-color:rgb(245,87,0);border-radius:50%;">
                                  <img src="https://cdn2.hubspot.net/hubfs/53/tools/email-signature-generator/icons/facebook-icon-dark-2x.png" width="24">
                                </a>

                                <span style="display:inline-block;width:5px;"></span>

                                <a href="https://www.instagram.com/fcai_cairogdclub?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" style="display:inline-block;background-color:rgb(245,87,0);border-radius:50%;">
                                  <img src="https://cdn2.hubspot.net/hubfs/53/tools/email-signature-generator/icons/instagram-icon-dark-2x.png" width="24">
                                </a>

                                <span style="display:inline-block;width:5px;"></span>

                                <a href="https://chat.whatsapp.com/DoWqXxIIQrZ5WLOFveNsMH" style="display:inline-block;background-color:rgb(245,87,0);border-radius:50%;">
                                  <img src="https://cdn2.hubspot.net/hubfs/53/tools/email-signature-generator/icons/whatsapp-icon-dark-2x.png" width="24">
                                </a>
                              </div>
                            </td>
                          </tr>

                        </tbody>
                      </table>
                    </td>

                    <td width="46"></td>

                    <td style="vertical-align: middle;">
                      <h2 style="margin:0;font-size:18px;font-family:Georgia;font-weight:600;">
                        FCAI Cairo GD Club
                      </h2>

                      <p style="margin:0;font-size:14px;">
                        Game Development Community
                      </p>

                      <div style="margin:0;font-size:14px;font-weight:500;">
                        FCAI-CU
                      </div>

                      <hr style="border:0;border-bottom:1px solid rgb(255,60,0);margin:24px 0;">

                      <p style="margin:0;font-size:14px;">
                        📧 <a href="mailto:fcaigamedevclub@gmail.com">fcaigamedevclub@gmail.com</a>
                      </p>

                      <p style="margin:0;font-size:14px;">
                        🌐 <a href="https://linktr.ee/FCAI_GDClub">https://linktr.ee/FCAI_GDClub</a>
                      </p>

                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully: %s', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOTPEmail
};
