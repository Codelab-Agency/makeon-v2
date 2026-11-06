import * as checkoutReservations from './20261029_140000_checkout_reservations';
import * as merchantOrderEmails from './20261105_120000_merchant_order_emails';
import * as googleProductIdentifiers from './20261106_120000_google_product_identifiers';
import * as productSkus from './20261106_140000_product_skus';
import * as migration_20261002_120914_initial from './20261002_120914_initial';
import * as migration_20261002_121000_inventory_constraints from './20261002_121000_inventory_constraints';
import * as migration_20261002_121759_r2_storage from './20261002_121759_r2_storage';
import * as migration_20261002_134255 from './20261002_134255';
import * as migration_20261005_113310_production_orders from './20261005_113310_production_orders';
import * as migration_20261005_120000_restore_inventory_constraints from './20261005_120000_restore_inventory_constraints';
import * as migration_20261005_144420_order_legal_acceptance from './20261005_144420_order_legal_acceptance';
import * as migration_20261007_132345 from './20261007_132345';
import * as migration_20261011_120000_order_status_emails from './20261011_120000_order_status_emails';
import * as migration_20261022_120000_sameday_shipments from './20261022_120000_sameday_shipments';

import * as migration_20261029_120000_payment_methods from './20261029_120000_payment_methods';

export const migrations = [
  {
    up: migration_20261002_120914_initial.up,
    down: migration_20261002_120914_initial.down,
    name: '20261002_120914_initial',
  },
  {
    up: migration_20261002_121000_inventory_constraints.up,
    down: migration_20261002_121000_inventory_constraints.down,
    name: '20261002_121000_inventory_constraints',
  },
  {
    up: migration_20261002_121759_r2_storage.up,
    down: migration_20261002_121759_r2_storage.down,
    name: '20261002_121759_r2_storage',
  },
  {
    up: migration_20261002_134255.up,
    down: migration_20261002_134255.down,
    name: '20261002_134255',
  },
  {
    up: migration_20261005_113310_production_orders.up,
    down: migration_20261005_113310_production_orders.down,
    name: '20261005_113310_production_orders',
  },
  {
    up: migration_20261005_120000_restore_inventory_constraints.up,
    down: migration_20261005_120000_restore_inventory_constraints.down,
    name: '20261005_120000_restore_inventory_constraints',
  },
  {
    up: migration_20261005_144420_order_legal_acceptance.up,
    down: migration_20261005_144420_order_legal_acceptance.down,
    name: '20261005_144420_order_legal_acceptance',
  },
  {
    up: migration_20261007_132345.up,
    down: migration_20261007_132345.down,
    name: '20261007_132345'
  },
  {
    up: migration_20261011_120000_order_status_emails.up,
    down: migration_20261011_120000_order_status_emails.down,
    name: '20261011_120000_order_status_emails',
  },
  {
    up: migration_20261022_120000_sameday_shipments.up,
    down: migration_20261022_120000_sameday_shipments.down,
    name: '20261022_120000_sameday_shipments',
  },
  { up: migration_20261029_120000_payment_methods.up, down: migration_20261029_120000_payment_methods.down, name: '20261029_120000_payment_methods' },
  { up: checkoutReservations.up, down: checkoutReservations.down, name: '20261029_140000_checkout_reservations' },
  { up: merchantOrderEmails.up, down: merchantOrderEmails.down, name: '20261105_120000_merchant_order_emails' },
  { up: googleProductIdentifiers.up, down: googleProductIdentifiers.down, name: '20261106_120000_google_product_identifiers' },
  { up: productSkus.up, down: productSkus.down, name: '20261106_140000_product_skus' },
];
