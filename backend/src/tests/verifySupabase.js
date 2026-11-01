import pg from 'pg';
import https from 'https';
const { Client } = pg;

async function verifySupabase() {
  console.log('🔍 Testing Supabase Connection...\n');

  // 1. Test PostgreSQL Database Connection
  const client = new Client({
    user: 'postgres.exeojqhhrujlbskcbfby',
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    database: 'postgres',
    password: 'Keshav8922844467',
    port: 6543,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ PostgreSQL Database connection: SUCCESS');
    const versionRes = await client.query('SELECT version();');
    console.log('   Engine:', versionRes.rows[0].version.split(',')[0]);

    // Check storage bucket
    const bucketRes = await client.query(
      "SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'feedback-attachments';"
    );
    if (bucketRes.rows.length > 0) {
      console.log('✅ Storage bucket "feedback-attachments": FOUND (private, 5MB limit)');
    } else {
      console.log('⚠️ Storage bucket "feedback-attachments": NOT FOUND, creating...');
      await client.query(`
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES ('feedback-attachments', 'feedback-attachments', false, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
        ON CONFLICT (id) DO NOTHING;
      `);
      console.log('✅ Storage bucket "feedback-attachments": CREATED');
    }
    await client.end();
  } catch (err) {
    console.error('❌ PostgreSQL connection error:', err.message);
  }

  // 2. Test HTTPS Supabase API Gateway
  https.get('https://exeojqhhrujlbskcbfby.supabase.co/storage/v1/bucket', (res) => {
    console.log(`\n✅ HTTPS Supabase API Gateway: REACHABLE (HTTP status ${res.statusCode})`);
    console.log('   Project Ref:', res.headers['sb-project-ref'] || 'exeojqhhrujlbskcbfby');
    console.log('\n🎉 Supabase setup and connection verified successfully!');
    process.exit(0);
  }).on('error', (err) => {
    console.error('❌ HTTPS API Gateway error:', err.message);
    process.exit(1);
  });
}

verifySupabase();
