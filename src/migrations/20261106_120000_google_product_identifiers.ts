import { sql, type MigrateUpArgs, type MigrateDownArgs } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs) {
  await db.execute(sql`
    ALTER TABLE products
      ADD COLUMN IF NOT EXISTS brand varchar,
      ADD COLUMN IF NOT EXISTS gtin varchar,
      ADD COLUMN IF NOT EXISTS mpn varchar,
      ADD COLUMN IF NOT EXISTS identifiers_absent boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS google_enabled boolean DEFAULT true;
  `);
}

export async function down({ db }: MigrateDownArgs) {
  await db.execute(sql`DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM products WHERE brand IS NOT NULL OR gtin IS NOT NULL OR mpn IS NOT NULL
      OR identifiers_absent IS TRUE OR google_enabled IS FALSE) THEN
      RAISE EXCEPTION 'Cannot remove populated Google product identifiers';
    END IF;
  END $$;
  ALTER TABLE products DROP COLUMN brand, DROP COLUMN gtin, DROP COLUMN mpn,
    DROP COLUMN identifiers_absent, DROP COLUMN google_enabled;`);
}
