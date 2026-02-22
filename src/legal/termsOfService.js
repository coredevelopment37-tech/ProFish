/**
 * Terms of Service — ProFish (#465)
 *
 * Hosted at profish.app/terms.
 * This file generates the in-app ToS screen content.
 *
 * Last updated: 2025-01-15
 */

const TERMS_OF_SERVICE = {
  lastUpdated: '2025-01-15',
  version: '1.0',

  sections: [
    {
      title: 'Acceptance of Terms',
      content: `By downloading, installing, or using ProFish ("the App"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these Terms, you may not use the App.`,
    },
    {
      title: 'Description of Service',
      content: `ProFish is a mobile fishing companion app providing catch logging, weather forecasts, tide predictions, solunar tables, map layers, AI species identification, and community features. The App is available as a free tier with limited features and a paid Pro subscription with full access.`,
    },
    {
      title: 'User Accounts',
      items: [
        'You must be at least 13 years old (16 in the EEA) to create an account.',
        'You are responsible for maintaining the security of your account credentials.',
        'You may not share your account with others or create multiple accounts.',
        'You must provide accurate information when creating your account.',
        'We reserve the right to suspend or terminate accounts that violate these Terms.',
      ],
    },
    {
      title: 'Subscriptions and Billing',
      subsections: [
        {
          title: 'Free Tier',
          content:
            'The free tier includes: 5 catches/month, 1-day FishCast, 5 fishing spots, 5 AI species IDs/day, basic map layers, weather, and solunar data.',
        },
        {
          title: 'Pro Subscription',
          content:
            'Pro is available at $7.99/month or $59.99/year (prices may vary by region). Pro includes: unlimited catches, all 18 map layers, 7-day FishCast, offline maps, catch statistics, unlimited AI species ID, and no ads.',
        },
        {
          title: 'Billing',
          items: [
            'Subscriptions are billed through Apple App Store or Google Play Store.',
            'Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period.',
            'Refunds are handled by Apple/Google per their respective policies.',
            'Price changes will be communicated in advance with option to cancel.',
          ],
        },
      ],
    },
    {
      title: 'User Content',
      items: [
        'You retain ownership of all content you create (catches, photos, posts).',
        'By sharing content in community features, you grant ProFish a non-exclusive, worldwide license to display that content within the App.',
        "You may not post content that is illegal, harmful, abusive, or violates others' rights.",
        'We may remove content that violates these Terms or our Community Guidelines.',
        'You are solely responsible for the content you share.',
      ],
    },
    {
      title: 'Prohibited Uses',
      items: [
        'Using the App to violate any fishing regulations or laws.',
        'Uploading false catch data or manipulating leaderboards.',
        'Harassing, threatening, or abusing other users.',
        'Attempting to reverse-engineer, decompile, or hack the App.',
        'Using automated scripts, bots, or scrapers.',
        'Impersonating another person or entity.',
        'Using the App for commercial fishing regulation evasion.',
      ],
    },
    {
      title: 'Marketplace',
      content: `The ProFish Marketplace connects buyers and sellers of fishing gear, guide services, and charter bookings. ProFish charges a 10% platform fee on transactions. ProFish is not responsible for the quality, safety, or legality of items or services listed. All disputes between buyers and sellers should be resolved directly between parties.`,
    },
    {
      title: 'Intellectual Property',
      content: `ProFish, the ProFish logo, and all related branding are trademarks of ProFish. The App's code, design, and content are protected by copyright. Third-party data (weather from Open-Meteo, tides from NOAA/WorldTides, maps from Mapbox) are subject to their respective licenses.`,
    },
    {
      title: 'Disclaimer of Warranties',
      content: `THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We do not guarantee the accuracy of weather forecasts, tide predictions, FishCast scores, or AI species identifications. Fishing involves inherent risks — always follow local safety guidelines and regulations. ProFish is not a substitute for professional weather or navigation services.`,
    },
    {
      title: 'Limitation of Liability',
      content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, PROFISH SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE APP. Our total liability shall not exceed the amount you paid for the App in the 12 months preceding the claim.`,
    },
    {
      title: 'Governing Law',
      content: `These Terms are governed by the laws of the United States. Any disputes shall be resolved through binding arbitration in accordance with the AAA rules, except that either party may seek injunctive relief in any court of competent jurisdiction.`,
    },
    {
      title: 'Changes to Terms',
      content: `We may modify these Terms at any time. Material changes will be communicated via in-app notification. Continued use of the App after changes constitutes acceptance.`,
    },
    {
      title: 'Contact',
      content: `For questions about these Terms:\n\nEmail: legal@profish.app\nAddress: ProFish App, [Address TBD]`,
    },
  ],
};

export default TERMS_OF_SERVICE;
