const nodemailer = require('nodemailer');

// Transporter is created lazily so dotenv has already loaded by the time it runs
function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * Send a report notification email to the admin
 * @param {Object} report - The report document
 */
async function sendReportEmail(report) {
  const categoryEmojis = {
    bug: '🐛',
    suggestion: '💡',
    content: '🚩',
    account: '👤',
    other: '❓',
  };

  const statusColor = {
    open: '#E53E3E',
    'in-review': '#D69E2E',
    resolved: '#38A169',
  };

  const emoji = categoryEmojis[report.category] || '📋';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Report Received</title>
    </head>
    <body style="margin:0;padding:0;background:#f0f2f5;font-family:'Helvetica Neue',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#F9A8D4,#93C5FD);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;color:#1e1b4b;font-size:26px;font-weight:700;letter-spacing:-0.5px;">
                    ${emoji} New Report Received
                  </h1>
                  <p style="margin:8px 0 0;color:#4c1d95;font-size:14px;">LoveForLove — User Report System</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="background:#ffffff;padding:36px 40px;">

                  <!-- Status + Category badges -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                    <tr>
                      <td>
                        <span style="display:inline-block;padding:4px 12px;border-radius:100px;font-size:12px;font-weight:700;background:#FEE2E2;color:#991B1B;margin-right:8px;">
                          ${report.status.toUpperCase()}
                        </span>
                        <span style="display:inline-block;padding:4px 12px;border-radius:100px;font-size:12px;font-weight:600;background:#F3F4F6;color:#374151;text-transform:capitalize;">
                          ${emoji} ${report.category}
                        </span>
                      </td>
                    </tr>
                  </table>

                  <!-- Title -->
                  <h2 style="margin:0 0 8px;font-size:20px;color:#111827;font-weight:700;">
                    ${report.title}
                  </h2>

                  <!-- Description box -->
                  <div style="background:#F9FAFB;border-left:4px solid #F9A8D4;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;">
                    <p style="margin:0;color:#374151;font-size:15px;line-height:1.7;white-space:pre-wrap;">${report.description}</p>
                  </div>

                  <!-- Divider -->
                  <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;">

                  <!-- User info -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;">
                        <span style="color:#6B7280;font-size:13px;">👤 <strong>Name:</strong></span>
                        <span style="color:#111827;font-size:13px;margin-left:8px;">${report.userName || 'N/A'}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;">
                        <span style="color:#6B7280;font-size:13px;">📧 <strong>Email:</strong></span>
                        <span style="color:#111827;font-size:13px;margin-left:8px;">
                          <a href="mailto:${report.userEmail}" style="color:#6D28D9;text-decoration:none;">${report.userEmail || 'N/A'}</a>
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;">
                        <span style="color:#6B7280;font-size:13px;">🕐 <strong>Submitted:</strong></span>
                        <span style="color:#111827;font-size:13px;margin-left:8px;">${new Date(report.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#F9FAFB;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;border-top:1px solid #E5E7EB;">
                  <p style="margin:0;color:#9CA3AF;font-size:12px;">
                    You received this because you are the admin of <strong>LoveForLove</strong>.<br>
                    Go to the <strong>/admin</strong> page to manage and update report status.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await getTransporter().sendMail({
    from: `"LoveForLove Reports" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL || 'dk25042008@gmail.com',
    subject: `${emoji} [LoveForLove Report] ${report.category.toUpperCase()}: ${report.title}`,
    html,
  });
}

module.exports = { sendReportEmail };
