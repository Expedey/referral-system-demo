import { Client } from '@hubspot/api-client';

// HubSpot contact properties mapping
export interface HubSpotContact {
  email: string;
  firstname?: string;
  lastname?: string;
  username?: string;
  referral_count?: number;
  last_referral_at?: string;
  created_at?: string;
  referral_code?: string;
}

export interface HubSpotContactResponse {
  id: string;
  properties: HubSpotContact;
  createdAt: string;
  updatedAt: string;
}

/**
 * HubSpot Direct API service for managing contacts and referral tracking
 * Uses direct API calls instead of SDK for better control
 */
export class HubSpotDirectService {
  private static apiKey = process.env.HUBSPOT_API_KEY;
  private static baseUrl = 'https://api.hubapi.com/crm/v3';

  /**
   * Search for contact by email using direct API
   */
  static async getContactByEmail(email: string): Promise<HubSpotContactResponse | null> {
    try {
      console.log('[HubSpotDirectService] Searching for contact by email:', email);

      const response = await fetch(`${this.baseUrl}/objects/contacts/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: 'EQ',
                  value: email,
                },
              ],
            },
          ],
          properties: ['email', 'firstname', 'lastname', 'username', 'referral_count', 'last_referral_at', 'referral_code', 'created_at'],
          limit: 1,
        }),
      });

      if (!response.ok) {
        console.error('[HubSpotDirectService] API error:', response.status, response.statusText);
        throw new Error(`HubSpot API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[HubSpotDirectService] Search response:', data);
      
      if (data.results && data.results.length > 0) {
        const contact = data.results[0];
        return {
          id: contact.id,
          properties: contact.properties,
          createdAt: contact.createdAt,
          updatedAt: contact.updatedAt,
        };
      }

      console.log('[HubSpotDirectService] Contact not found for email:', email);
      return null;
    } catch (error) {
      console.error('[HubSpotDirectService] Error getting contact by email:', error);
      return null;
    }
  }

  /**
   * Update contact properties using direct API
   */
  static async updateContact(contactId: string, properties: Record<string, any>): Promise<boolean> {
    try {
      console.log('[HubSpotDirectService] Updating contact:', contactId, 'with properties:', properties);

      const response = await fetch(`${this.baseUrl}/objects/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties,
        }),
      });

      if (!response.ok) {
        console.error('[HubSpotDirectService] Update API error:', response.status, response.statusText);
        throw new Error(`HubSpot API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('[HubSpotDirectService] Contact updated successfully:', result);
      return true;
    } catch (error) {
      console.error('[HubSpotDirectService] Error updating contact:', error);
      return false;
    }
  }

  /**
   * Update referral stats for a contact (referrer)
   * This is called when a referred user confirms their email
   */
  static async updateReferrerStats(email: string, referralCount: number, lastReferralAt?: string): Promise<boolean> {
    try {
      console.log('[HubSpotDirectService] Updating referrer stats for:', email, 'count:', referralCount);
      
      // First, find the contact by email
      const contact = await this.getContactByEmail(email);
      if (!contact) {
        console.error('[HubSpotDirectService] Contact not found for referrer email:', email);
        return false;
      }

      // Prepare update properties
      const properties: Record<string, any> = {
        referral_count: referralCount.toString(),
      };

      if (lastReferralAt) {
        properties.last_referral_at = lastReferralAt;
      }

      console.log('[HubSpotDirectService] Updating referrer contact with properties:', properties);

      // Update the contact
      return await this.updateContact(contact.id, properties);
    } catch (error) {
      console.error('[HubSpotDirectService] Error updating referrer stats:', error);
      return false;
    }
  }

  /**
   * Create a referral activity note in HubSpot
   */
  static async createReferralActivity(referrerEmail: string, referredEmail: string, referralCode: string): Promise<boolean> {
    try {
      console.log('[HubSpotDirectService] Creating referral activity for:', referrerEmail);

      // Get referrer contact
      const referrerContact = await this.getContactByEmail(referrerEmail);
      if (!referrerContact) {
        console.error('[HubSpotDirectService] Referrer contact not found:', referrerEmail);
        return false;
      }

      // Create activity note
      const noteContent = `Referral made to ${referredEmail} using code: ${referralCode}`;
      
      const response = await fetch(`${this.baseUrl}/objects/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            hs_note_body: noteContent,
            hs_timestamp: new Date().toISOString(),
          },
          associations: [
            {
              to: {
                id: referrerContact.id,
              },
              types: [
                {
                  associationCategory: 'HUBSPOT_DEFINED',
                  associationTypeId: 1, // Contact to Note association
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        console.error('[HubSpotDirectService] Error creating note:', response.status);
        return false;
      }

      console.log('[HubSpotDirectService] Referral activity created for:', referrerEmail);
      return true;
    } catch (error) {
      console.error('[HubSpotDirectService] Error creating referral activity:', error);
      return false;
    }
  }
} 