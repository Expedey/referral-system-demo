import sgMail from '@sendgrid/mail';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export interface SendGridEmailParams {
  to: string;
  subject: string;
  templateId: string;
  dynamicTemplateData: Record<string, unknown>;
}

export async function sendSendGridEmail({
  to,
  subject,
  templateId,
  dynamicTemplateData
}: SendGridEmailParams) {
  try {
    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject,
      templateId,
      dynamicTemplateData,
    };

    await sgMail.send(msg);
    console.log('SendGrid email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('SendGrid email sending failed:', error);
    throw error;
  }
}

// Template-specific functions
export async function sendAdminInvitationEmail({
  to,
  role,
  email,
  password
}: {
  to: string;
  role: string;
  email: string;
  password: string;
}) {
  return sendSendGridEmail({
    to,
    subject: 'Admin Invitation - Bonbon Waitlist',
    templateId: process.env.SENDGRID_ADMIN_INVITATION_TEMPLATE_ID!,
    dynamicTemplateData: {
      role,
      email,
      password,
      login_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/login`
    }
  });
}

interface EmailDigestData {
  topReferrers: Array<{
    email: string;
    username: string;
    referral_code: string;
    count: number;
  }>;
  totalGrowth: {
    totalUsers: number;
    totalReferrals: number;
    verifiedReferrals: number;
    conversionRate: number;
    weeklyGrowth: number;
  };
  flaggedAccounts: {
    totalFlagged: number;
    weeklyFlagged: number;
    uniqueIPs: number;
  };
  tierBreakdown: Array<{
    tier: string;
    count: number;
    percentage: number;
  }>;
  weekRange: {
    start: string;
    end: string;
  };
}

export async function sendWeeklyDigestEmail({
  to,
  digestData
}: {
  to: string;
  digestData: EmailDigestData;
}) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return sendSendGridEmail({
    to,
    subject: `Weekly Bonbon Waitlist Digest - ${formatDate(digestData.weekRange.start)}`,
    templateId: process.env.SENDGRID_WEEKLY_DIGEST_TEMPLATE_ID!,
    dynamicTemplateData: {
      week_start_date: formatDate(digestData.weekRange.start),
      week_end_date: formatDate(digestData.weekRange.end),
      total_users: digestData.totalGrowth.totalUsers.toLocaleString(),
      total_referrals: digestData.totalGrowth.totalReferrals.toLocaleString(),
      verified_referrals: digestData.totalGrowth.verifiedReferrals.toLocaleString(),
      conversion_rate: digestData.totalGrowth.conversionRate,
      weekly_growth_display: `${digestData.totalGrowth.weeklyGrowth > 0 ? '+' : ''}${digestData.totalGrowth.weeklyGrowth}`,
      total_flagged: digestData.flaggedAccounts.totalFlagged,
      weekly_flagged: digestData.flaggedAccounts.weeklyFlagged,
      unique_ips: digestData.flaggedAccounts.uniqueIPs,
      top_referrers: digestData.topReferrers.map((r, i) => ({
        ...r,
        '@index': i + 1
      })),
    }
  });
}

export async function sendAccountVerifiedEmail({
  to,
  userName,
  email,
  referralCode
}: {
  to: string;
  userName: string;
  email: string;
  referralCode: string;
}) {
  return sendSendGridEmail({
    to,
    subject: 'Welcome to BonBon! Your Account is Verified',
    templateId: process.env.SENDGRID_ACCOUNT_VERIFIED_TEMPLATE_ID!,
    dynamicTemplateData: {
      user_name: userName,
      email: email,
      referral_code: referralCode,
      dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      referral_link: `${process.env.NEXT_PUBLIC_APP_URL}/ref/${referralCode}`
    }
  });
} 