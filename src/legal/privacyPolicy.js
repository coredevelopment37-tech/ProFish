/**
 * Privacy Policy — ProFish (#464)
 *
 * GDPR + CCPA compliant. Hosted at profish.app/privacy.
 * This file generates the in-app privacy policy screen content.
 *
 * Last updated: 2025-01-15
 */

const PRIVACY_POLICY = {
  lastUpdated: '2025-01-15',
  version: '1.0',

  sections: [
    {
      title: 'Introduction',
      content: `ProFish ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application ProFish (the "App"). Please read this policy carefully. If you do not agree with the terms, please do not use the App.`,
    },
    {
      title: 'Information We Collect',
      subsections: [
        {
          title: 'Information You Provide',
          items: [
            'Account information: email address, display name, profile photo',
            'Catch data: species, weight, length, photos, GPS coordinates, notes',
            'Fishing spots: saved locations with names and coordinates',
            'Community content: posts, comments, photos shared in feeds',
            'Support requests: messages sent to our support team',
          ],
        },
        {
          title: 'Information Collected Automatically',
          items: [
            'Device information: model, OS version, unique device identifiers',
            'Usage data: features used, session duration, screens viewed',
            'Location data: GPS coordinates (only when App is in use, with permission)',
            'Crash reports: technical error data via Sentry (anonymized)',
            'Analytics: aggregated usage patterns via Firebase Analytics',
          ],
        },
        {
          title: 'Information from Third Parties',
          items: [
            'Google Sign-In: name, email, profile photo (if you choose Google SSO)',
            'Apple Sign-In: email (may be forwarded/hidden per your Apple settings)',
            'RevenueCat: subscription status (no payment details stored by us)',
          ],
        },
      ],
    },
    {
      title: 'How We Use Your Information',
      items: [
        'Provide and maintain the App functionality',
        'Store and sync your catch log across devices',
        'Generate personalized fishing recommendations and FishCast scores',
        'Display weather, tide, and solunar data for your location',
        'Process subscription purchases and manage access',
        'Send push notifications (fishing alerts, catch confirmations) — opt-in only',
        'Improve the App through anonymized analytics',
        'Respond to support requests',
        'Prevent fraud and abuse',
      ],
    },
    {
      title: 'Data Storage and Security',
      content: `Your data is stored in Google Firebase (Firestore) with encryption at rest and in transit. Catch photos are stored in Firebase Storage. Local data is stored on-device using encrypted AsyncStorage. We implement industry-standard security measures including TLS 1.3, Firebase Security Rules, and regular security audits.`,
    },
    {
      title: 'Data Sharing',
      content: `We do NOT sell your personal data. We share data only with:`,
      items: [
        'Firebase (Google): Backend infrastructure and authentication',
        'RevenueCat: Subscription management (receives anonymized user ID only)',
        'Sentry: Crash reporting (receives anonymized device/error data only)',
        'Stripe: Payment processing for marketplace transactions (PCI compliant)',
        'Community features: Posts you share are visible to other users (opt-in)',
      ],
    },
    {
      title: 'Your Rights (GDPR)',
      content: `If you are in the European Economic Area (EEA), you have the right to:`,
      items: [
        'Access: Request a copy of all data we hold about you',
        'Rectification: Correct inaccurate personal data',
        'Erasure: Request deletion of your account and all associated data',
        'Portability: Export your data in a machine-readable format (JSON/CSV)',
        'Restriction: Limit how we process your data',
        'Objection: Object to processing based on legitimate interests',
        'Withdraw consent: Opt out of optional data collection at any time',
      ],
    },
    {
      title: 'Your Rights (CCPA)',
      content: `If you are a California resident, you have the right to:`,
      items: [
        'Know what personal information is collected',
        'Know whether your data is sold or disclosed',
        'Say no to the sale of personal information (we do NOT sell data)',
        'Access your personal information',
        'Request deletion of your data',
        'Not be discriminated against for exercising these rights',
      ],
    },
    {
      title: 'Data Retention',
      content: `We retain your data for as long as your account is active. If you delete your account, all personal data is permanently erased within 30 days. Anonymized analytics data may be retained indefinitely. Catch data you've shared in community feeds will be removed from public view upon account deletion.`,
    },
    {
      title: "Children's Privacy",
      content: `ProFish is not directed at children under 13 (or 16 in the EEA). We do not knowingly collect data from children. If you believe a child has provided us with personal data, please contact us and we will delete it immediately.`,
    },
    {
      title: 'Changes to This Policy',
      content: `We may update this Privacy Policy from time to time. We will notify you of material changes via in-app notification or email. Your continued use of the App after changes constitutes acceptance of the updated policy.`,
    },
    {
      title: 'Contact Us',
      content: `For privacy questions, data requests, or concerns:\n\nEmail: privacy@profish.app\nAddress: ProFish App, [Address TBD]\nData Protection Officer: dpo@profish.app`,
    },
  ],
};

export default PRIVACY_POLICY;
