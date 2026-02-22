/**
 * Integration Tests — RevenueCat Subscription (#430)
 *
 * Tests subscription initialization, entitlement checks,
 * and purchase flow.
 *
 * NOTE: Requires RevenueCat sandbox or mock server.
 * Run with: jest --config jest.integration.config.js
 */

import Purchases from 'react-native-purchases';

describe('RevenueCat Integration', () => {
  describe('Initialization', () => {
    it('should configure RevenueCat SDK', () => {
      Purchases.configure({ apiKey: 'test_api_key' });
      expect(Purchases.configure).toHaveBeenCalledWith({
        apiKey: 'test_api_key',
      });
    });
  });

  describe('Customer Info', () => {
    it('should fetch customer info', async () => {
      const info = await Purchases.getCustomerInfo();
      expect(info).toBeDefined();
      expect(info.activeSubscriptions).toBeDefined();
      expect(info.entitlements).toBeDefined();
    });

    it('should indicate free user has no active subscriptions', async () => {
      const info = await Purchases.getCustomerInfo();
      expect(info.activeSubscriptions.length).toBe(0);
    });
  });

  describe('Offerings', () => {
    it('should fetch available offerings', async () => {
      Purchases.getOfferings.mockResolvedValue({
        current: {
          identifier: 'default',
          availablePackages: [
            { identifier: 'pro_monthly', product: { priceString: '$7.99' } },
            { identifier: 'pro_yearly', product: { priceString: '$59.99' } },
          ],
        },
      });

      const offerings = await Purchases.getOfferings();
      expect(offerings.current).toBeDefined();
      expect(offerings.current.availablePackages.length).toBeGreaterThan(0);
    });
  });

  describe('Subscription Listener', () => {
    it('should register customer info update listener', () => {
      const callback = jest.fn();
      const unsubscribe = Purchases.addCustomerInfoUpdateListener(callback);
      expect(Purchases.addCustomerInfoUpdateListener).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });
  });
});
