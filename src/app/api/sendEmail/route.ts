import { NextResponse } from 'next/server';
import { sendSendGridEmail } from '@/lib/sendGridService';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { to, subject, text, html, templateId, dynamicTemplateData } = await request.json();

    // Check if using SendGrid template
    if (templateId && dynamicTemplateData) {
      // Use SendGrid template
      await sendSendGridEmail({
        to,
        subject,
        templateId,
        dynamicTemplateData
      });
    } else if (to && subject && (text || html)) {
      // Fallback to Nodemailer for backward compatibility
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Send email
      await transporter.sendMail({
        from: `"BonBon Waitlist System" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
      });
    } else {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Email sent successfully');
    return NextResponse.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email sending failed:', error);
    return NextResponse.json(
      { message: 'Failed to send email', error },
      { status: 500 }
    );
  }
} 