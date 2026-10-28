const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const Module = require('module');
const { neon } = require('@neondatabase/serverless');

// Module resolution hook for @/
const origResolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent) {
  if (request.startsWith('@/')) {
    const rel = request.slice(2);
    const full = path.join(__dirname, '..', 'src', rel);
    for (const ext of ['.ts', '.tsx', '.js', '/index.ts', '/index.js']) {
      if (fs.existsSync(full + ext)) {
        return full + ext;
      }
    }
    return full;
  }
  return origResolve.call(this, request, parent);
};

require.extensions['.ts'] = function(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  module._compile(compiled, filename);
};

require.extensions['.tsx'] = require.extensions['.ts'];

const { safaanInitialSubmissions } = require('../src/lib/safaan-submissions.ts');
const { initialSubmissions } = require('../src/lib/mock-data.ts');
const { quizSubmissions, recruitmentSubmissions, orderSubmissions } = require('../src/lib/additional-mock-submissions.ts');

const connectionString = process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_hbad8wm9oYIT@ep-flat-band-b70xzvhu-pooler.c-13.us-east-1.aws.neon.tech/neondb?sslmode=require';

const sql = neon(connectionString);

function normalizeMobile(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '');
  if (digits.startsWith('98') && digits.length === 12) {
    return '0' + digits.slice(2);
  }
  if (!digits.startsWith('0') && digits.length === 10) {
    return '0' + digits;
  }
  return digits || null;
}

async function migrate() {
  console.log('🚀 Starting migration to Neon PostgreSQL...');

  const allToInsert = [
    ...safaanInitialSubmissions,
    ...initialSubmissions,
    ...quizSubmissions,
    ...recruitmentSubmissions,
    ...orderSubmissions,
  ];

  console.log(`📦 Found ${allToInsert.length} submissions to insert.`);

  let insertedCount = 0;
  let casesCount = 0;

  for (const s of allToInsert) {
    const rawMobile = s.data?.f_mobile || s.data?.mobile || s.data?.phone || s.data?.f_phone;
    const mobile = normalizeMobile(rawMobile);
    const trackingCode = s.trackingCode || s.data?.caseCode || s.data?.user_code || s.id;
    const fullData = {
      ...s.data,
      evaluationResult: s.evaluationResult,
      quizResult: s.quizResult,
      comments: s.comments,
      userIp: s.userIp,
    };

    // 1. Insert into form_submissions
    try {
      await sql.query(
        `INSERT INTO form_submissions (id, form_id, tracking_code, mobile, data, status, payment_status, payment_amount, payment_ref_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           tracking_code = EXCLUDED.tracking_code,
           mobile = EXCLUDED.mobile,
           data = EXCLUDED.data,
           status = EXCLUDED.status,
           payment_status = EXCLUDED.payment_status`,
        [
          s.id,
          s.formId,
          trackingCode,
          mobile,
          JSON.stringify(fullData),
          s.status || 'new',
          s.paymentStatus || 'none',
          s.paymentAmount ? Number(s.paymentAmount) : null,
          s.paymentRefId || null,
          s.createdAt || new Date().toISOString(),
        ]
      );
      insertedCount++;
    } catch (err) {
      console.error(`❌ Error inserting submission ${s.id}:`, err.message);
    }

    // 2. Insert into belhagh_cases if it is a case/registration/safaan
    const caseCode = s.data?.caseCode || s.trackingCode;
    if (caseCode && mobile) {
      try {
        const firstName = s.data?.f_name || s.data?.fullName?.split(' ')?.[0] || '';
        const lastName = s.data?.f_family || s.data?.fullName?.split(' ')?.[1] || '';
        const province = s.data?.f_province_city_province || s.data?.province || '';
        const city = s.data?.f_province_city_city || s.data?.city || '';

        await sql.query(
          `INSERT INTO belhagh_cases (case_code, mobile, first_name, last_name, province, city, data)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT DO NOTHING`,
          [caseCode, mobile, firstName, lastName, province, city, JSON.stringify(fullData)]
        );
        casesCount++;
      } catch (err) {
        // ignore duplicate
      }
    }
  }

  console.log(`✅ Successfully processed ${insertedCount} submissions into form_submissions.`);
  console.log(`✅ Processed ${casesCount} cases into belhagh_cases.`);

  // Verify total count in DB
  const totalSubRes = await sql.query('SELECT count(*) as cnt FROM form_submissions');
  const totalCaseRes = await sql.query('SELECT count(*) as cnt FROM belhagh_cases');

  console.log(`\n🎉 FINAL DATABASE STATS:`);
  console.log(`📊 form_submissions total rows in Neon DB: ${totalSubRes[0].cnt}`);
  console.log(`📊 belhagh_cases total rows in Neon DB: ${totalCaseRes[0].cnt}`);
}

migrate().catch(console.error);
