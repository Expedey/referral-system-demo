import { supabase } from '@/lib/supabase';

export interface EmailDigestData {
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

export class EmailDigestService {
  /**
   * Generates comprehensive weekly email digest data
   */
  static async generateWeeklyDigest(): Promise<EmailDigestData> {
    try {
      // Calculate week range (last 7 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      // Get top 10 referrers
      const topReferrers = await this.getTopReferrers(10);

      // Get total growth statistics
      const totalGrowth = await this.getTotalGrowth(startDate, endDate);

      // Get flagged accounts data
      const flaggedAccounts = await this.getFlaggedAccounts(startDate, endDate);

      // Get tier breakdown
      const tierBreakdown = await this.getTierBreakdown();

      return {
        topReferrers,
        totalGrowth,
        flaggedAccounts,
        tierBreakdown,
        weekRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      };
    } catch (error) {
      console.error('[EmailDigestService] Error generating weekly digest:', error);
      throw error;
    }
  }

  /**
   * Gets top referrers by referral count
   */
  private static async getTopReferrers(limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('email, username, referral_code, referral_count')
        .order('referral_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[EmailDigestService] Error fetching top referrers:', error);
        return [];
      }

      return data?.map(user => ({
        email: user.email,
        username: user.username || 'Anonymous',
        referral_code: user.referral_code,
        count: user.referral_count,
      })) || [];
    } catch (error) {
      console.error('[EmailDigestService] Error in getTopReferrers:', error);
      return [];
    }
  }

  /**
   * Gets total growth statistics for the week
   */
  private static async getTotalGrowth(startDate: Date, endDate: Date) {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get total referrals
      const { data: allReferrals } = await supabase
        .from('referrals')
        .select('status, created_at');

      // Get weekly referrals
      const { data: weeklyReferrals } = await supabase
        .from('referrals')
        .select('status, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Get previous week for growth calculation
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 7);
      const prevEndDate = new Date(startDate);

      const { data: prevWeekReferrals } = await supabase
        .from('referrals')
        .select('status, created_at')
        .gte('created_at', prevStartDate.toISOString())
        .lte('created_at', prevEndDate.toISOString());

      const totalReferrals = allReferrals?.length || 0;
      const verifiedReferrals = allReferrals?.filter(r => r.status === 'verified').length || 0;
      const conversionRate = totalReferrals > 0 ? (verifiedReferrals / totalReferrals) * 100 : 0;

      const weeklyReferralCount = weeklyReferrals?.length || 0;
      const prevWeekReferralCount = prevWeekReferrals?.length || 0;
      const weeklyGrowth = prevWeekReferralCount > 0 
        ? ((weeklyReferralCount - prevWeekReferralCount) / prevWeekReferralCount) * 100 
        : weeklyReferralCount > 0 ? 100 : 0;

      return {
        totalUsers: totalUsers || 0,
        totalReferrals,
        verifiedReferrals,
        conversionRate: Math.round(conversionRate * 100) / 100,
        weeklyGrowth: Math.round(weeklyGrowth * 100) / 100,
      };
    } catch (error) {
      console.error('[EmailDigestService] Error in getTotalGrowth:', error);
      return {
        totalUsers: 0,
        totalReferrals: 0,
        verifiedReferrals: 0,
        conversionRate: 0,
        weeklyGrowth: 0,
      };
    }
  }

  /**
   * Gets flagged accounts statistics
   */
  private static async getFlaggedAccounts(startDate: Date, endDate: Date) {
    try {
      // Get total flagged accounts
      const { count: totalFlagged } = await supabase
        .from('fraud_records')
        .select('*', { count: 'exact', head: true });

      // Get weekly flagged accounts
      const { count: weeklyFlagged } = await supabase
        .from('fraud_records')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Get unique IPs from fraud records
      const { data: fraudIPs } = await supabase
        .from('fraud_records')
        .select('ip_address')
        .limit(1000);

      const uniqueIPs = new Set(fraudIPs?.map(r => r.ip_address) || []).size;

      return {
        totalFlagged: totalFlagged || 0,
        weeklyFlagged: weeklyFlagged || 0,
        uniqueIPs,
      };
    } catch (error) {
      console.error('[EmailDigestService] Error in getFlaggedAccounts:', error);
      return {
        totalFlagged: 0,
        weeklyFlagged: 0,
        uniqueIPs: 0,
      };
    }
  }

  /**
   * Gets tier breakdown based on referral count
   */
  private static async getTierBreakdown() {
    try {
      const { data: users } = await supabase
        .from('users')
        .select('referral_count');

      if (!users) return [];

      const tierCounts = {
        'Bronze (0-2)': 0,
        'Silver (3-5)': 0,
        'Gold (6-10)': 0,
        'Platinum (11-20)': 0,
        'Diamond (20+)': 0,
      };

      users.forEach(user => {
        const count = user.referral_count;
        if (count <= 2) tierCounts['Bronze (0-2)']++;
        else if (count <= 5) tierCounts['Silver (3-5)']++;
        else if (count <= 10) tierCounts['Gold (6-10)']++;
        else if (count <= 20) tierCounts['Platinum (11-20)']++;
        else tierCounts['Diamond (20+)']++;
      });

      const totalUsers = users.length;
      
      return Object.entries(tierCounts).map(([tier, count]) => ({
        tier,
        count,
        percentage: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0,
      }));
    } catch (error) {
      console.error('[EmailDigestService] Error in getTierBreakdown:', error);
      return [];
    }
  }

  /**
   * Sends weekly digest email via HubSpot
   */
  static async sendWeeklyDigest(teamEmail: string): Promise<boolean> {
    try {
      const digestData = await this.generateWeeklyDigest();
      
      // Create email content
      const emailContent = this.generateEmailContent(digestData);
      
      // Send via HubSpot API
      console.log('[EmailDigestService] Sending weekly digest to:', teamEmail);
      
      const response = await fetch('https://api.hubapi.com/marketing/v3/transactional/single-email/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: teamEmail,
          subject: `Weekly Referral Digest - ${new Date().toLocaleDateString()}`,
          html: emailContent,
          from: {
            email: 'noreply@yourcompany.com', // You can customize this
            name: 'Referral System'
          }
        }),
      });

      if (response.ok) {
        console.log('[EmailDigestService] Email sent successfully via HubSpot');
        return true;
      } else {
        const errorData = await response.text();
        console.error('[EmailDigestService] HubSpot API error:', response.status, errorData);
        return false;
      }
    } catch (error) {
      console.error('[EmailDigestService] Error sending weekly digest:', error);
      return false;
    }
  }

  /**
   * Generates HTML email content
   */
  private static generateEmailContent(data: EmailDigestData): string {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Weekly Referral Digest</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; }
          .section { background: white; margin: 20px 0; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .section h2 { color: #374151; margin-top: 0; }
          .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 15px 0; }
          .stat-card { background: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #1f2937; }
          .stat-label { font-size: 14px; color: #6b7280; margin-top: 5px; }
          .referrer-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .referrer-item:last-child { border-bottom: none; }
          .tier-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Weekly Referral Digest</h1>
            <p>${formatDate(data.weekRange.start)} - ${formatDate(data.weekRange.end)}</p>
          </div>
          
          <div class="content">
            <!-- Top 10 Referrers -->
            <div class="section">
              <h2>🏆 Top 10 Referrers</h2>
              ${data.topReferrers.map((referrer, index) => `
                <div class="referrer-item">
                  <div>
                    <strong>#${index + 1}</strong> ${referrer.username} (${referrer.email})
                    <br><small>Code: ${referrer.referral_code}</small>
                  </div>
                  <div class="stat-value">${referrer.count}</div>
                </div>
              `).join('')}
            </div>

            <!-- Total Growth -->
            <div class="section">
              <h2>📈 Total Growth</h2>
              <div class="stat-grid">
                <div class="stat-card">
                  <div class="stat-value">${data.totalGrowth.totalUsers.toLocaleString()}</div>
                  <div class="stat-label">Total Users</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${data.totalGrowth.totalReferrals.toLocaleString()}</div>
                  <div class="stat-label">Total Referrals</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${data.totalGrowth.verifiedReferrals.toLocaleString()}</div>
                  <div class="stat-label">Verified Referrals</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${data.totalGrowth.conversionRate}%</div>
                  <div class="stat-label">Conversion Rate</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${data.totalGrowth.weeklyGrowth > 0 ? '+' : ''}${data.totalGrowth.weeklyGrowth}%</div>
                  <div class="stat-label">Weekly Growth</div>
                </div>
              </div>
            </div>

            <!-- Flagged Accounts -->
            <div class="section">
              <h2>🚨 Flagged Accounts</h2>
              <div class="stat-grid">
                <div class="stat-card">
                  <div class="stat-value">${data.flaggedAccounts.totalFlagged.toLocaleString()}</div>
                  <div class="stat-label">Total Flagged</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${data.flaggedAccounts.weeklyFlagged.toLocaleString()}</div>
                  <div class="stat-label">This Week</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${data.flaggedAccounts.uniqueIPs.toLocaleString()}</div>
                  <div class="stat-label">Unique IPs</div>
                </div>
              </div>
            </div>

            <!-- Tier Breakdown -->
            <div class="section">
              <h2>💎 Tier Breakdown</h2>
              ${data.tierBreakdown.map(tier => `
                <div class="tier-item">
                  <span>${tier.tier}</span>
                  <span><strong>${tier.count}</strong> users (${tier.percentage}%)</span>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="footer">
            <p>This digest is automatically generated every week.</p>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
} 