const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const formsFilePath = path.join(process.cwd(), 'data', 'forms.json');
if (!fs.existsSync(formsFilePath)) {
  console.error('forms.json not found at:', formsFilePath);
  process.exit(1);
}

const forms = JSON.parse(fs.readFileSync(formsFilePath, 'utf8'));
console.log(`Loaded ${forms.length} forms from forms.json`);

const connectionString = process.env.DATABASE_URL || 'postgresql://belhagh:belhagh@2026!secure@127.0.0.1:5432/belhagh_db';
const pool = new Pool({ connectionString });

async function syncForms() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS forms (
        id VARCHAR(255) PRIMARY KEY,
        slug VARCHAR(255),
        title TEXT,
        data JSONB,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    for (const form of forms) {
      await client.query(
        `INSERT INTO forms (id, slug, title, data, updated_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET
           slug = EXCLUDED.slug,
           title = EXCLUDED.title,
           data = EXCLUDED.data,
           updated_at = CURRENT_TIMESTAMP`,
        [form.id, form.slug, form.title, JSON.stringify(form)]
      );
      console.log(`Synced form: ${form.id} (${form.title}) - fields: ${form.fields ? form.fields.length : 0}`);
    }

    const verify = await client.query(`
      SELECT id, title, slug, jsonb_array_length(data->'fields') as fields_count, jsonb_array_length(data->'rules') as rules_count
      FROM forms
      WHERE id = 'form-belhagh-booking'
    `);
    console.log('Verification for form-belhagh-booking in DB:', verify.rows[0]);

  } catch (err) {
    console.error('Error syncing forms:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

syncForms();
