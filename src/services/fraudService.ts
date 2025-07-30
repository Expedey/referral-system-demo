import { supabase } from "@/lib/supabase";

export interface FraudRecord {
  id: string;
  ip_address: string;
  user_email: string;
  referred_from?: string;
  fraud_flag: boolean;
  created_at: string;
}

export interface CreateFraudRecordData {
  ipAddress: string;
  userEmail: string;
  referredFrom?: string;
  reason?: string;
}

/**
 * Fraud service for tracking and managing fraud attempts
 */
export class FraudService {
  /**
   * Records a fraud attempt in the database
   * @param fraudData - The fraud data to record
   * @returns The created fraud record
   */
  static async recordFraudAttempt(
    fraudData: CreateFraudRecordData
  ): Promise<FraudRecord | null> {
    try {
      const { data, error } = await supabase
        .from("fraud_records")
        .insert({
          ip_address: fraudData.ipAddress,
          user_email: fraudData.userEmail.toLowerCase(),
          referred_from: fraudData.referredFrom,
          fraud_flag: true,
        })
        .select()
        .single();

      if (error) {
        console.error("Error recording fraud attempt:", error);
        return null;
      }

      console.log(`[FraudService] Fraud attempt recorded for IP: ${fraudData.ipAddress}, Email: ${fraudData.userEmail}`);
      return data;
    } catch (error) {
      console.error("Error in recordFraudAttempt:", error);
      return null;
    }
  }

  /**
   * Gets all fraud records for admin viewing
   * @param limit - Number of records to return (default: 50)
   * @param offset - Number of records to skip (default: 0)
   * @returns Array of fraud records
   */
  static async getFraudRecords(
    limit: number = 50,
    offset: number = 0
  ): Promise<FraudRecord[]> {
    try {
      const { data, error } = await supabase
        .from("fraud_records")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error fetching fraud records:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getFraudRecords:", error);
      return [];
    }
  }

  /**
   * Gets fraud records with filters
   * @param filters - Filter options
   * @returns Array of filtered fraud records
   */
  static async getFraudRecordsWithFilters(filters: {
    ipAddress?: string;
    userEmail?: string;
    referredFrom?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<FraudRecord[]> {
    try {
      let query = supabase
        .from("fraud_records")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters.ipAddress) {
        query = query.ilike("ip_address", `%${filters.ipAddress}%`);
      }

      if (filters.userEmail) {
        query = query.ilike("user_email", `%${filters.userEmail}%`);
      }

      if (filters.referredFrom) {
        query = query.ilike("referred_from", `%${filters.referredFrom}%`);
      }

      if (filters.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte("created_at", filters.dateTo);
      }

      const limit = filters.limit || 50;
      const offset = filters.offset || 0;

      const { data, error } = await query.range(offset, offset + limit - 1);

      if (error) {
        console.error("Error fetching filtered fraud records:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getFraudRecordsWithFilters:", error);
      return [];
    }
  }

  /**
   * Gets fraud statistics for admin dashboard
   * @returns Fraud statistics
   */
  static async getFraudStats(): Promise<{
    totalRecords: number;
    todayRecords: number;
    uniqueIPs: number;
    uniqueEmails: number;
  }> {
    try {
      // Get total records
      const { count: totalRecords, error: totalError } = await supabase
        .from("fraud_records")
        .select("*", { count: "exact", head: true });

      // Get today's records
      const today = new Date().toISOString().split('T')[0];
      const { count: todayRecords, error: todayError } = await supabase
        .from("fraud_records")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today);

      // Get unique IPs
      const { data: uniqueIPs, error: ipError } = await supabase
        .from("fraud_records")
        .select("ip_address")
        .limit(1000); // Limit for performance

      // Get unique emails
      const { data: uniqueEmails, error: emailError } = await supabase
        .from("fraud_records")
        .select("user_email")
        .limit(1000); // Limit for performance

      if (totalError || todayError || ipError || emailError) {
        console.error("Error fetching fraud stats:", { totalError, todayError, ipError, emailError });
        return {
          totalRecords: 0,
          todayRecords: 0,
          uniqueIPs: 0,
          uniqueEmails: 0,
        };
      }

      const uniqueIPSet = new Set(uniqueIPs?.map(r => r.ip_address) || []);
      const uniqueEmailSet = new Set(uniqueEmails?.map(r => r.user_email) || []);

      return {
        totalRecords: totalRecords || 0,
        todayRecords: todayRecords || 0,
        uniqueIPs: uniqueIPSet.size,
        uniqueEmails: uniqueEmailSet.size,
      };
    } catch (error) {
      console.error("Error in getFraudStats:", error);
      return {
        totalRecords: 0,
        todayRecords: 0,
        uniqueIPs: 0,
        uniqueEmails: 0,
      };
    }
  }
} 