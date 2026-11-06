import { sql, type MigrateUpArgs, type MigrateDownArgs } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs) {
  await db.execute(sql`
    ALTER TABLE products ADD COLUMN IF NOT EXISTS sku varchar;
    UPDATE products SET sku = 'MKN-' || lpad(id::text, greatest(6, length(id::text)), '0')
      WHERE sku IS NULL OR btrim(sku) = '';
    CREATE UNIQUE INDEX IF NOT EXISTS products_sku_idx ON products (sku);
    ALTER TABLE products ADD CONSTRAINT products_sku_valid
      CHECK (sku IS NOT NULL AND length(sku) BETWEEN 1 AND 50 AND sku ~ '^[A-Z0-9]+(-[A-Z0-9]+)*$');
  `);
}

export async function down({ db }: MigrateDownArgs) {
  await db.execute(sql`DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM products WHERE sku IS NOT NULL) THEN
      RAISE EXCEPTION 'Cannot remove assigned product SKUs: external references may exist';
    END IF;
  END $$;
  ALTER TABLE products DROP CONSTRAINT products_sku_valid;
  DROP INDEX products_sku_idx;
  ALTER TABLE products DROP COLUMN sku;`);
}
