import { sql, type MigrateUpArgs, type MigrateDownArgs } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs) {
  await db.execute(sql`
    ALTER TABLE order_status_emails ADD COLUMN audience varchar NOT NULL DEFAULT 'customer'
      CHECK (audience IN ('customer', 'merchant'));
    CREATE UNIQUE INDEX order_merchant_email_once ON order_status_emails(order_id) WHERE audience = 'merchant';
  `);
}

export async function down({ db }: MigrateDownArgs) {
  await db.execute(sql`DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM order_status_emails WHERE audience = 'merchant') THEN
      RAISE EXCEPTION 'Cannot remove merchant notification history';
    END IF;
  END $$;
  DROP INDEX order_merchant_email_once;
  ALTER TABLE order_status_emails DROP COLUMN audience;`);
}
