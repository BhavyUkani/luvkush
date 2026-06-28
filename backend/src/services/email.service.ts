import nodemailer from 'nodemailer';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass
      }
    });
  }

  private baseTemplate(content: string, preheader = ''): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Luv Kush Natural</title>
</head>
<body style="margin:0;padding:0;background:#F2EDE3;font-family:'Georgia',serif">
  <div style="max-width:600px;margin:0 auto;background:#ffffff">
    <!-- Header -->
    <div style="background:#1A1410;padding:32px 40px;text-align:center">
      <div style="font-family:'Georgia',serif;font-size:22px;letter-spacing:0.2em;text-transform:uppercase;color:#F8F4ED">
        Luv Kush Natural
      </div>
      <div style="font-size:11px;color:#B87333;letter-spacing:0.3em;text-transform:uppercase;margin-top:4px">
        Ancient Ayurvedic Luxury
      </div>
    </div>

    <!-- Divider -->
    <div style="height:2px;background:linear-gradient(90deg,#B87333,#C9A84C,#B87333)"></div>

    <!-- Content -->
    <div style="padding:40px">
      ${content}
    </div>

    <!-- Footer -->
    <div style="background:#F2EDE3;padding:24px 40px;text-align:center;border-top:1px solid rgba(184,115,51,0.2)">
      <p style="font-family:'Manrope',sans-serif;font-size:11px;color:#8B7D6B;letter-spacing:0.1em;margin:0">
        © ${new Date().getFullYear()} Luv Kush Natural. All rights reserved.
      </p>
      <p style="font-family:'Manrope',sans-serif;font-size:10px;color:#C4B8A8;margin:8px 0 0">
        Crafted with reverence in India
      </p>
    </div>
  </div>
</body>
</html>`;
  }

  async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    const verifyUrl = `${config.frontendUrl}/verify-email?token=${token}`;

    const content = `
      <h2 style="font-size:28px;font-weight:300;color:#6B3A2A;margin:0 0 16px">
        Welcome, ${name}
      </h2>
      <div style="width:60px;height:1px;background:linear-gradient(90deg,#B87333,#C9A84C);margin:0 0 24px"></div>
      <p style="font-family:'Manrope',sans-serif;font-size:15px;color:#4A3728;line-height:1.8;margin:0 0 24px">
        Thank you for joining the Luv Kush Natural family. Please verify your email address to complete your account setup.
      </p>
      <div style="text-align:center;margin:32px 0">
        <a href="${verifyUrl}"
          style="display:inline-block;background:#6B3A2A;color:#F8F4ED;padding:14px 36px;text-decoration:none;font-family:'Manrope',sans-serif;font-size:12px;letter-spacing:0.15em;text-transform:uppercase">
          Verify Email Address
        </a>
      </div>
      <p style="font-family:'Manrope',sans-serif;font-size:12px;color:#8B7D6B;line-height:1.7;margin:0">
        This link expires in 24 hours. If you didn't create an account, please ignore this email.
      </p>
    `;

    await this.send({
      to: email,
      subject: 'Verify your Luv Kush Natural account',
      html: this.baseTemplate(content)
    });
  }

  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

    const content = `
      <h2 style="font-size:28px;font-weight:300;color:#6B3A2A;margin:0 0 16px">
        Password Reset
      </h2>
      <div style="width:60px;height:1px;background:linear-gradient(90deg,#B87333,#C9A84C);margin:0 0 24px"></div>
      <p style="font-family:'Manrope',sans-serif;font-size:15px;color:#4A3728;line-height:1.8;margin:0 0 24px">
        Dear ${name}, we received a request to reset your password. Click below to set a new password.
      </p>
      <div style="text-align:center;margin:32px 0">
        <a href="${resetUrl}"
          style="display:inline-block;background:#6B3A2A;color:#F8F4ED;padding:14px 36px;text-decoration:none;font-family:'Manrope',sans-serif;font-size:12px;letter-spacing:0.15em;text-transform:uppercase">
          Reset Password
        </a>
      </div>
      <p style="font-family:'Manrope',sans-serif;font-size:12px;color:#8B7D6B;line-height:1.7;margin:0">
        This link expires in 1 hour. If you did not request this, your password is safe.
      </p>
    `;

    await this.send({
      to: email,
      subject: 'Reset your Luv Kush Natural password',
      html: this.baseTemplate(content)
    });
  }

  async sendOrderConfirmation(email: string, name: string, order: any): Promise<void> {
    const content = `
      <h2 style="font-size:28px;font-weight:300;color:#6B3A2A;margin:0 0 16px">
        Order Confirmed
      </h2>
      <div style="width:60px;height:1px;background:linear-gradient(90deg,#B87333,#C9A84C);margin:0 0 24px"></div>
      <p style="font-family:'Manrope',sans-serif;font-size:15px;color:#4A3728;line-height:1.8;margin:0 0 24px">
        Dear ${name}, your order <strong>#${order.id}</strong> has been confirmed.
        We will notify you once it ships.
      </p>
      <div style="background:#F2EDE3;border-left:3px solid #B87333;padding:16px 20px;margin:24px 0">
        <strong style="color:#6B3A2A;font-size:14px">Order Total: ₹${order.total.toLocaleString('en-IN')}</strong>
      </div>
      <a href="${config.frontendUrl}/account/orders"
        style="display:inline-block;background:#6B3A2A;color:#F8F4ED;padding:12px 28px;text-decoration:none;font-family:'Manrope',sans-serif;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;margin-top:8px">
        Track Order
      </a>
    `;

    await this.send({
      to: email,
      subject: `Order Confirmed — #${order.id} | Luv Kush Natural`,
      html: this.baseTemplate(content)
    });
  }

  async sendContactAcknowledgement(email: string, name: string): Promise<void> {
    const content = `
      <h2 style="font-size:28px;font-weight:300;color:#6B3A2A;margin:0 0 16px">
        Thank You, ${name}
      </h2>
      <div style="width:60px;height:1px;background:linear-gradient(90deg,#B87333,#C9A84C);margin:0 0 24px"></div>
      <p style="font-family:'Manrope',sans-serif;font-size:15px;color:#4A3728;line-height:1.8;margin:0 0 24px">
        We have received your message and will get back to you within 24 hours.
        Our team is dedicated to providing you with the best Ayurvedic experience.
      </p>
    `;
    await this.send({ to: email, subject: 'We received your message — Luv Kush Natural', html: this.baseTemplate(content) });
  }

  private async send(opts: { to: string; subject: string; html: string }): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"${config.smtp.fromName}" <${config.smtp.from}>`,
        to: opts.to,
        subject: opts.subject,
        html: opts.html
      });
      logger.info(`Email sent to ${opts.to}: ${opts.subject}`);
    } catch (error) {
      logger.error(`Failed to send email to ${opts.to}:`, error);
      throw error;
    }
  }
}
