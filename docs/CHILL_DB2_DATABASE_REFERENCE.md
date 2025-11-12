# Chill DB2 Database Reference

Last updated: 2025-11-10  
Primary schema source: current backend migrations and models

> The application now points to the `chill_db2` MySQL schema (see `.env` `DB_NAME`).  
> This document lists every table and view that the codebase expects, along with the
> most important columns and relationships. When introducing new features, add the
> table or column here **and** supply a migration.

## Core Identity & Addressing

### `users`
- **Purpose:** Master record for customers, vendors, and admins.
- **Key columns:** `user_id`, `fname`, `lname`, `email`, `username`, `password`, `role`, `status`, `primary_address_id`, `profile_image_url`, `created_at`.
- **Notes:** `status` enum is `active | inactive | suspended`. `email` and `username` are unique. Primary address links to `addresses`.

### `vendors`
- **Purpose:** Vendor profile tied to a user.
- **Key columns:** `vendor_id`, `user_id`, `store_name`, `status`, `subscription_plan`, `subscription_status`, `primary_address_id`, `exact_latitude`, `exact_longitude`, `qr_code_setup_completed`, `created_at`.
- **Notes:** Tracks subscription limits, exact GPS coordinates, and Cloudinary proof URLs (`*_url` columns sized to 500 chars).

### `addresses`
- **Purpose:** Structured Philippine address catalog.
- **Key columns:** `address_id`, `street_name`, `barangay`, `cityVillage`, `province`, `region`, `latitude`, `longitude`, `exact_latitude`, `exact_longitude`, `coordinate_accuracy`, `coordinate_source`, `is_active`, `created_at`.
- **Notes:** Stores both approximate and exact coordinates; includes indexes for locality and coordinate searches.

### `user_addresses`
- **Purpose:** Many-to-many bridge between users and addresses.
- **Key columns:** `user_address_id`, `user_id`, `address_id`, `address_label`, `is_default`, `created_at`, `updated_at`.
- **Notes:** Enforces one default per user. Cascades on user or address deletion.

## Catalog & Inventory

### `container_drum`
- **Purpose:** Master list of drum containers.
- **Key columns:** `drum_id`, `size`, `gallons`, `stock`, `created_at`.
- **Notes:** Referenced by `products` and `order_items`.

### `drum_stats`
- **Purpose:** Static drum status lookup.
- **Key columns:** `drum_status_id`, `status_name`.
- **Notes:** Expected values are `in use`, `not returned`, `returned`.

### `flavors`
- **Purpose:** Water flavors sold by vendors.
- **Key columns:** `flavor_id`, `flavor_name`, `flavor_description`, `vendor_id`, `image_url`, `store_status`, `locked_by_subscription`, `sold_count`, `average_rating`, `total_ratings`, `created_at`.
- **Notes:** `store_status` enum is `draft | ready | published`. `locked_by_subscription` hides flavors on plan downgrade.

### `products`
- **Purpose:** Concrete purchasable items.
- **Key columns:** `product_id`, `name`, `flavor_id`, `drum_id`, `vendor_id`, `product_url_image`, `created_at`.
- **Notes:** Foreign keys point to `flavors`, `container_drum`, and `vendors`.

### `daily_drum_availability`
- **Purpose:** Capacity planning per vendor/day/size.
- **Key columns:** `availability_id`, `vendor_id`, `delivery_date`, `drum_size`, `total_capacity`, `booked_count`, `reserved_count`, `available_count`, `created_at`.
- **Notes:** `reserved_count` tracks items held before payment.

### `cart_items`
- **Purpose:** Persisted carts per user.
- **Key columns:** `cart_item_id`, `user_id`, `flavor_id`, `size`, `quantity`, `price`, `created_at`, `updated_at`.
- **Notes:** Unique compound index on (`user_id`, `flavor_id`, `size`).

## Orders & Fulfillment

### `orders`
- **Purpose:** Customer orders.
- **Key columns:** `order_id`, `customer_id`, `vendor_id`, `delivery_datetime`, `delivery_address`, `total_amount`, `status`, `payment_status`, `payment_method`, `payment_intent_id`, `payment_reference`, `payment_amount`, `remaining_balance`, `remaining_payment_method`, `remaining_payment_method_selected_at`, `remaining_payment_confirmed_at`, `remaining_payment_confirmed_by`, `payment_deadline`, `reservation_expires_at`, `decline_reason`, `created_at`.
- **Notes:** `status` enum includes `pending_payment`. `payment_status` remains `unpaid | partial | paid`. Indexes cover payment/reservation lookups.

### `order_items`
- **Purpose:** Line items for orders.
- **Key columns:** `orderItemsID`, `order_id`, `product_id`, `containerDrum_id`, `quantity`, `price`, `drum_status_id`.
- **Notes:** Cascades on order or product deletion. Tracks drum disposition.

### `pending_payment_orders`
- **Purpose:** Tracks orders awaiting payment confirmation.
- **Key columns:** `order_id`, `payment_deadline`, `reminder_sent`, `created_at`, `updated_at`.
- **Notes:** `order_id` is both primary key and foreign key to `orders`.

### `vendor_delivery_pricing`
- **Purpose:** Delivery fees per city/province.
- **Key columns:** `delivery_pricing_id`, `vendor_id`, `city`, `province`, `delivery_price`, `is_active`, `created_at`, `updated_at`.
- **Notes:** Enforces unique combination of (`vendor_id`, `city`, `province`). View `vendor_delivery_zones` exposes active rows.

### `vendor_rejections`
- **Purpose:** Automates vendor return workflow after rejection.
- **Key columns:** `rejection_id`, `vendor_id`, `user_id`, `rejected_at`, `auto_return_at`, `is_returned`, `returned_at`.
- **Notes:** Created during vendor onboarding moderation.

## Payments & Billing

### `system_settings`
- **Purpose:** Key-value feature flags (GCASH/Xendit).
- **Key columns:** `id`, `setting_key`, `setting_value`, `description`, `created_at`, `updated_at`.
- **Notes:** Stores service toggles. PayMongo keys were removed; active keys cover GCASH/Xendit payments.

### `vendor_gcash_qr`
- **Purpose:** Vendor-uploaded GCASH QR catalog.
- **Key columns:** `qr_id`, `vendor_id`, `qr_code_image`, `gcash_number`, `business_name`, `is_active`, `created_at`, `updated_at`.
- **Notes:** One-to-one relationship with vendor.

### `qr_payment_transactions`
- **Purpose:** Manual GCASH QR payment confirmations.
- **Key columns:** `transaction_id`, `order_id`, `customer_id`, `vendor_id`, `payment_amount`, `payment_method`, `payment_status`, `qr_code_used`, `payment_confirmation_image`, `customer_notes`, `vendor_notes`, `created_at`, `updated_at`.
- **Notes:** Handles proof-of-payment uploads and updates `orders`.

## Reviews, Feedback, Notifications

### `notifications`
- **Purpose:** Persistent notifications for users.
- **Key columns:** `notification_id`, `user_id`, `user_type`, `title`, `message`, `notification_type`, `related_order_id`, `related_vendor_id`, `related_customer_id`, `is_read`, `created_at`, `updated_at`.
- **Notes:** Enum covers order lifecycle plus vendor approval/review events; includes `payment_reminder` for pending-payment alerts.

### `feedback`
- **Purpose:** Support tickets and product feedback.
- **Key columns:** `id`, `user_id`, `user_role`, `category`, `subject`, `description`, `status`, `priority`, `admin_response`, `admin_id`, `image_url`, `responded_at`, `created_at`, `updated_at`.
- **Notes:** Tracks SLA status. `admin_id` references responders.

### `vendor_reviews`
- **Purpose:** Vendor-level reviews.
- **Key columns:** `review_id`, `order_id`, `vendor_id`, `customer_id`, `rating`, `comment`, `created_at`, `updated_at`.
- **Notes:** `unique_review` constraint ensures one review per order/customer.

### `flavor_ratings`
- **Purpose:** Per-flavor ratings.
- **Key columns:** `rating_id`, `flavor_id`, `customer_id`, `rating`, `review_text`, `created_at`, `updated_at`.
- **Notes:** Updates aggregate rating columns in `flavors`.

## Subscriptions & Billing Analytics

### `subscription_plans`
- **Purpose:** Catalog of vendor subscription plans.
- **Key columns:** `plan_id`, `plan_name`, `plan_type`, `price`, `billing_cycle`, `max_flavors`, `max_orders_per_month`, `features`, `is_active`, `created_at`, `updated_at`.
- **Notes:** Seeded with Free, Professional, and Premium.

### `vendor_subscriptions`
- **Purpose:** Vendor plan enrollment.
- **Key columns:** `subscription_id`, `vendor_id`, `plan_id`, `status`, `start_date`, `end_date`, `next_billing_date`, `auto_renew`, `payment_method`, `stripe_subscription_id`, `created_at`, `updated_at`.
- **Notes:** Links vendor to plan. Tracks lifecycle status and billing cadence.

### `subscription_usage`
- **Purpose:** Monthly usage metrics per vendor.
- **Key columns:** `usage_id`, `vendor_id`, `subscription_id`, `month_year`, `flavors_used`, `orders_processed`, `features_used`, `created_at`, `updated_at`.
- **Notes:** Unique per (`vendor_id`, `month_year`).

### `payment_history`
- **Purpose:** Legacy Stripe subscription payment receipts.
- **Key columns:** `payment_id`, `subscription_id`, `amount`, `currency`, `payment_method`, `payment_status`, `stripe_payment_intent_id`, `transaction_id`, `payment_date`, `created_at`.
- **Notes:** Retained for audit history.

### `subscription_payments`
- **Purpose:** Xendit/GCash subscription payments.
- **Key columns:** `payment_id`, `vendor_id`, `plan_name`, `amount`, `payment_status`, `xendit_invoice_id`, `xendit_payment_id`, `payment_method`, `payment_date`, `created_at`, `updated_at`.
- **Notes:** Primary billing table in current use.

## Authentication & Security

### `password_reset_tokens`
- **Purpose:** Tracks password reset flows.
- **Key columns:** `id`, `user_id`, `token`, `email`, `expires_at`, `used`, `created_at`, `updated_at`.
- **Notes:** Tokens invalidate on use. Cascade deletes with the associated user.

## Database Views

### Summary
- `user_formatted_addresses`: Combines `user_addresses` with `addresses` to produce formatted strings (active entries only).
- `vendor_locations`: Joins `vendors` and `addresses` for listing primary address details.
- `vendor_delivery_zones`: Shows active delivery pricing rows for approved vendors (source: `vendor_delivery_pricing`).
- `payment_summary`: Aggregates payment intent data with order and profile context.
- `vendor_location_accuracy`: Indicates whether a vendor has exact GPS coordinates or approximate address coordinates.

## Maintenance Checklist

- Always add a migration when altering schema; update this document in the same PR.
- Verify foreign keys and indexes with `backend/scripts/check_database_structure.js` (update DB name to `chill_db2` before running locally).
- Seed data expectations:
  - `subscription_plans` contains four default plans.
- `system_settings` seeds GCASH/Xendit toggles.
  - `drum_stats` should include three base statuses.
- For quick validation, run `SHOW TABLES FROM chill_db2;` and compare against this inventory.


