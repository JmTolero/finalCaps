const express = require('express');
const router = express.Router();
const { 
  getDeliveryPricing, 
  updateDeliveryPricing, 
  addDeliveryZone, 
  removeDeliveryZone, 
  getDeliveryPriceForLocation,
  validateAddress
} = require('../../controller/vendor/deliveryController');

// Get delivery pricing zones for a vendor
router.get('/:vendor_id/pricing', getDeliveryPricing);

// Update delivery pricing zones for a vendor
router.put('/:vendor_id/pricing', updateDeliveryPricing);

// Add a new delivery zone for a vendor
router.post('/:vendor_id/zones', addDeliveryZone);

// Remove a delivery zone for a vendor
router.delete('/:vendor_id/zones/:delivery_pricing_id', removeDeliveryZone);

// Get delivery price for a specific location (used by checkout)
router.get('/:vendor_id/price', getDeliveryPriceForLocation);

// Validate address and get suggestions
router.get('/validate', validateAddress);

module.exports = router;

