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

export interface CreateContactData {
  email: string;
  username?: string;
  referralCode?: string;
}

export interface UpdateContactData {
  email: string;
  referralCount?: number;
  lastReferralAt?: string;
  referralCode?: string;
}

// New interfaces for HubSpot Forms
export interface HubSpotFormField {
  name: string;
  value: string;
}

export interface HubSpotFormSubmission {
  fields: HubSpotFormField[];
  context?: {
    pageUri?: string;
    pageName?: string;
  };
}

export interface HubSpotFormResponse {
  success: boolean;
  message?: string;
  contactId?: string;
}

/**
 * HubSpot service for managing contacts and referral tracking using Forms API
 */
export class HubSpotService {
  private static client: Client;
  private static isInitialized = false;
  private static formId: string;
  private static portalId: string;

  /**
   * Initialize the HubSpot client and form configuration
   */
  private static initialize() {
    if (!this.isInitialized) {
      const apiKey = process.env.HUBSPOT_API_KEY;
      this.formId = process.env.HUBSPOT_FORM_ID || '';
      this.portalId = process.env.HUBSPOT_PORTAL_ID || '';
      
      console.log('[HubSpotService] apiKey exists:', !!apiKey);
      console.log('[HubSpotService] formId exists:', !!this.formId);
      console.log('[HubSpotService] portalId exists:', !!this.portalId);
      
      if (!apiKey) {
        throw new Error('HUBSPOT_API_KEY environment variable is required');
      }
      
      if (!this.formId) {
        throw new Error('HUBSPOT_FORM_ID environment variable is required');
      }
      
      if (!this.portalId) {
        throw new Error('HUBSPOT_PORTAL_ID environment variable is required');
      }
      
      this.client = new Client({ accessToken: apiKey });
      this.isInitialized = true;
      console.log('[HubSpotService] Client initialized successfully');
    }
  }

  /**
   * Submits a form to HubSpot to create a new contact
   * @param contactData - Contact data to submit via form
   * @returns Form submission response
   */
  static async submitForm(
    contactData: CreateContactData
  ): Promise<HubSpotFormResponse> {
    try {
      this.initialize();

      console.log('[HubSpotService] Submitting form for:', contactData.email);

      // Prepare form fields
      const fields: HubSpotFormField[] = [
        { name: 'email', value: contactData.email }
      ];

      if (contactData.username) {
        fields.push({ name: 'full_name', value: contactData.username });
      }

      if (contactData.referralCode) {
        fields.push({ name: 'ref_code', value: contactData.referralCode });
      }

      const formSubmission: HubSpotFormSubmission = {
        fields,
        context: {
          pageUri: process.env.NEXT_PUBLIC_APP_URL || '',
          pageName: 'Referral System Registration'
        }
      };

      console.log('[HubSpotService] Submitting form with fields:', fields);

      // Submit form using HubSpot Forms API
      const response = await fetch(
        `https://api.hubapi.com/forms/v2/forms/${this.formId}/submissions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formSubmission),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[HubSpotService] Form submission failed:', errorData);
        return {
          success: false,
          message: `Form submission failed: ${response.status} ${response.statusText}`
        };
      }

      const result = await response.json();
      console.log('[HubSpotService] Form submitted successfully:', result);

      // Try to get the contact ID from the response or search for it
      let contactId: string | undefined;
      if (result.contactId) {
        contactId = result.contactId;
      } else {
        // Search for the contact that was just created
        const contact = await this.getContactByEmail(contactData.email);
        contactId = contact?.id;
      }

      return {
        success: true,
        message: 'Form submitted successfully',
        contactId
      };
    } catch (error) {
      console.error('[HubSpotService] Error submitting form:', error);
      return {
        success: false,
        message: `Error submitting form: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Creates a new contact via form submission (replaces createOrUpdateContact)
   * @param contactData - Contact data to create
   * @returns The created contact or existing contact
   */
  static async createOrUpdateContact(
    contactData: CreateContactData
  ): Promise<HubSpotContactResponse | null> {
    try {
      this.initialize();

      console.log('[HubSpotService] Creating/updating contact via form:', contactData.email);

      // Check if contact already exists
      const existingContact = await this.getContactByEmail(contactData.email);
      
      if (existingContact) {
        console.log('[HubSpotService] Contact already exists, updating:', existingContact.id);
        // Update existing contact with new data using CRM API
        return await this.updateContact({
          email: contactData.email,
          referralCode: contactData.referralCode,
        });
      }

      // Submit form to create new contact
      const formResult = await this.submitForm(contactData);
      
      if (!formResult.success) {
        console.error('[HubSpotService] Form submission failed:', formResult.message);
        return null;
      }

      // Get the newly created contact
      const newContact = await this.getContactByEmail(contactData.email);
      if (newContact) {
        console.log('[HubSpotService] Contact created successfully via form:', newContact.id);
        return newContact;
      }

      return null;
    } catch (error) {
      console.error('[HubSpotService] Error creating/updating contact:', error);
      return null;
    }
  }

  /**
   * Updates an existing contact in HubSpot (still uses CRM API for updates)
   * @param updateData - Data to update
   * @returns The updated contact
   */
  static async updateContact(
    updateData: UpdateContactData
  ): Promise<HubSpotContactResponse | null> {
    try {
      this.initialize();

      console.log('[HubSpotService] Updating contact:', updateData.email);

      // Get existing contact
      const existingContact = await this.getContactByEmail(updateData.email);
      if (!existingContact) {
        console.error('[HubSpotService] Contact not found for update:', updateData.email);
        return null;
      }

      // Prepare update properties
      const updateProperties: Partial<HubSpotContact> = {};
      
      if (updateData.referralCount !== undefined) {
        updateProperties.referral_count = updateData.referralCount;
      }
      
      if (updateData.lastReferralAt !== undefined) {
        updateProperties.last_referral_at = updateData.lastReferralAt;
      }

      // Add referral_code if provided
      if ('referralCode' in updateData && updateData.referralCode) {
        updateProperties.referral_code = updateData.referralCode;
      }

      console.log('[HubSpotService] Updating contact with properties:', updateProperties);

      const response = await this.client.crm.contacts.basicApi.update(
        existingContact.id,
        { properties: updateProperties as unknown as Record<string, string> }
      );

      console.log('[HubSpotService] Contact updated successfully:', response.id);
      return {
        id: response.id,
        properties: response.properties as unknown as HubSpotContact,
        createdAt: response.createdAt.toISOString(),
        updatedAt: response.updatedAt.toISOString(),
      };
    } catch (error) {
      console.error('[HubSpotService] Error updating contact:', error);
      return null;
    }
  }

  /**
   * Gets a contact by email (still uses CRM API for lookups)
   * @param email - Email to search for
   * @returns The contact or null if not found
   */
  static async getContactByEmail(email: string): Promise<HubSpotContactResponse | null> {
    try {
      this.initialize();

      const response = await this.client.crm.contacts.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'email',
                operator: 'EQ' as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                value: email,
              },
            ],
          },
        ],
        properties: ['email', 'firstname', 'lastname', 'username', 'referral_count', 'last_referral_at', 'referral_code', 'created_at'],
        limit: 1,
      });

      if (response.results && response.results.length > 0) {
        const contact = response.results[0];
        return {
          id: contact.id,
          properties: contact.properties as unknown as HubSpotContact,
          createdAt: contact.createdAt.toISOString(),
          updatedAt: contact.updatedAt.toISOString(),
        };
      }

      return null;
    } catch (error) {
      console.error('[HubSpotService] Error getting contact by email:', error);
      return null;
    }
  }

  /**
   * Updates referral count and last referral date for a contact
   * @param email - Contact email
   * @param referralCount - New referral count
   * @param lastReferralAt - Last referral timestamp
   * @returns Success status
   */
  static async updateReferralStats(
    email: string,
    referralCount: number,
    lastReferralAt?: string
  ): Promise<boolean> {
    try {
      console.log('[HubSpotService] Updating referral stats for:', email, 'count:', referralCount);
      
      const result = await this.updateContact({
        email,
        referralCount,
        lastReferralAt: lastReferralAt || new Date().toISOString(),
      });

      return result !== null;
    } catch (error) {
      console.error('[HubSpotService] Error updating referral stats:', error);
      return false;
    }
  }

  /**
   * Creates a referral activity note in HubSpot
   * @param referrerEmail - Email of the person who made the referral
   * @param referredEmail - Email of the person who was referred
   * @param referralCode - The referral code used
   * @returns Success status
   */
  static async createReferralActivity(
    referrerEmail: string,
    referredEmail: string,
    referralCode: string
  ): Promise<boolean> {
    try {
      this.initialize();

      // Get referrer contact
      const referrerContact = await this.getContactByEmail(referrerEmail);
      if (!referrerContact) {
        console.error('[HubSpotService] Referrer contact not found:', referrerEmail);
        return false;
      }

      // Create activity note
      const noteContent = `Referral made to ${referredEmail} using code: ${referralCode}`;
      
      await this.client.crm.objects.notes.basicApi.create({
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
                associationCategory: 'HUBSPOT_DEFINED' as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                associationTypeId: 1, // Contact to Note association
              },
            ],
          },
        ],
      });

      console.log('[HubSpotService] Referral activity created for:', referrerEmail);
      return true;
    } catch (error) {
      console.error('[HubSpotService] Error creating referral activity:', error);
      return false;
    }
  }

  /**
   * Gets all contacts with referral data
   * @param limit - Number of contacts to return (default: 100)
   * @returns Array of contacts with referral data
   */
  static async getContactsWithReferrals(limit: number = 100): Promise<HubSpotContactResponse[]> {
    try {
      this.initialize();

      const response = await this.client.crm.contacts.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'referral_count',
                operator: 'GT' as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                value: '0',
              },
            ],
          },
        ],
        properties: ['email', 'firstname', 'lastname', 'username', 'referral_count', 'last_referral_at', 'referral_code', 'created_at'],
        limit,
        sorts: ['referral_count'],
      });

      return (response.results || []).map(contact => ({
        id: contact.id,
        properties: contact.properties as unknown as HubSpotContact,
        createdAt: contact.createdAt.toISOString(),
        updatedAt: contact.updatedAt.toISOString(),
      }));
    } catch (error) {
      console.error('[HubSpotService] Error getting contacts with referrals:', error);
      return [];
    }
  }

  /**
   * Syncs a user from Supabase to HubSpot via form submission
   * @param userData - User data from Supabase
   * @returns Success status
   */
  static async syncUserToHubSpot(userData: {
    id?: string;
    email: string;
    username?: string;
    referral_code: string;
    is_verified?: boolean;
    referral_count: number;
    last_referral_at?: string;
    created_at?: string;
  }): Promise<boolean> {
    try {
      console.log('[HubSpotService] Syncing user to HubSpot via form:', userData.email);

      const result = await this.createOrUpdateContact({
        email: userData.email,
        referralCode: userData.referral_code,
      });

      if (result) {
        // Update referral stats if they exist
        if (userData.referral_count > 0) {
          await this.updateReferralStats(
            userData.email,
            userData.referral_count,
            userData.last_referral_at
          );
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('[HubSpotService] Error syncing user to HubSpot:', error);
      return false;
    }
  }

  /**
   * Gets form information from HubSpot
   * @returns Form details or null if not found
   */
  static async getFormInfo(): Promise<any> {
    try {
      this.initialize();

      const response = await fetch(
        `https://api.hubapi.com/forms/v2/forms/${this.formId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('[HubSpotService] Failed to get form info:', response.statusText);
        return null;
      }

      const formInfo = await response.json();
      console.log('[HubSpotService] Form info retrieved:', formInfo);
      return formInfo;
    } catch (error) {
      console.error('[HubSpotService] Error getting form info:', error);
      return null;
    }
  }

  /**
   * Sends an admin invitation email via HubSpot API directly
   * @param email - Admin's email address
   * @param password - Generated password
   * @param role - Admin role
   * @returns Success status
   */
  static async sendAdminInvitationEmail(
    email: string,
    password: string,
    role: 'super_admin' | 'admin' 
  ): Promise<boolean> {
    try {
      const apiKey = process.env.HUBSPOT_API_KEY;
      if (!apiKey) {
        throw new Error('HUBSPOT_API_KEY environment variable is required');
      }

      // Send transactional email using fetch
      const response = await fetch('https://api.hubapi.com/marketing/v3/transactional/single-email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          emailId: process.env.HUBSPOT_ADMIN_INVITE_TEMPLATE_ID,
          message: {
            to: email,
            customProperties: {
              role: role.replace('_', ' '),
              password: password,
              loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/login`,
            },
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[HubSpotService] Failed to send invitation email:', errorData);
        return false;
      }

      console.log('[HubSpotService] Admin invitation email sent to:', email);
      return true;
    } catch (error) {
      console.error('[HubSpotService] Error sending admin invitation email:', error);
      return false;
    }
  }
} 