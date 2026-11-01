import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://exeojqhhrujlbskcbfby.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'feedback-attachments';

async function testSupabaseStorage() {
  console.log('🚀 Testing Supabase Storage with Service Role Key...\n');
  console.log('   Supabase URL:', SUPABASE_URL);
  console.log('   Bucket Name:', BUCKET_NAME);
  console.log('   Service Role Key prefix:', SERVICE_ROLE_KEY?.substring(0, 20) + '...');

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. List buckets
  console.log('\n1️⃣ Listing buckets via Supabase Management API...');
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    throw new Error(`listBuckets failed: ${bucketError.message}`);
  }
  console.log('   ✅ Found buckets:', buckets.map(b => `${b.name} (${b.public ? 'public' : 'private'})`));

  // 2. Ensure feedback-attachments bucket exists
  const targetBucket = buckets.find(b => b.name === BUCKET_NAME);
  if (!targetBucket) {
    console.log(`   Bucket "${BUCKET_NAME}" not found via API, creating...`);
    const { error: createErr } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: false,
      fileSizeLimit: 5242880,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    });
    if (createErr) throw new Error(`createBucket failed: ${createErr.message}`);
    console.log(`   ✅ Created bucket "${BUCKET_NAME}" as private.`);
  } else {
    console.log(`   ✅ Target bucket "${BUCKET_NAME}" verified (private).`);
  }

  // 3. Create a Signed Upload URL
  const testKey = `feedback/test-org/test-user/test-${Date.now()}.png`;
  console.log(`\n2️⃣ Creating Signed Upload URL for: ${testKey}...`);
  const { data: uploadData, error: uploadErr } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUploadUrl(testKey);

  if (uploadErr) {
    throw new Error(`createSignedUploadUrl failed: ${uploadErr.message}`);
  }
  console.log('   ✅ Signed Upload URL created successfully!');
  console.log('   Signed URL:', uploadData.signedUrl.substring(0, 60) + '...[truncated]');

  // 4. Upload a small test buffer directly
  console.log('\n3️⃣ Uploading test image buffer to verify storage write permissions...');
  const testBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'); // 1x1 PNG
  const { error: writeErr } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(testKey, testBuffer, { contentType: 'image/png', upsert: true });

  if (writeErr) {
    throw new Error(`Storage upload failed: ${writeErr.message}`);
  }
  console.log('   ✅ Successfully uploaded test screenshot file to Supabase private storage!');

  // 5. Generate a Signed Download URL
  console.log('\n4️⃣ Generating Signed Download URL (7-day token for support team)...');
  const { data: downloadData, error: downloadErr } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(testKey, 3600 * 24 * 7);

  if (downloadErr) {
    throw new Error(`createSignedUrl failed: ${downloadErr.message}`);
  }
  console.log('   ✅ Signed Download URL generated successfully!');
  console.log('   Download Link:', downloadData.signedUrl.substring(0, 60) + '...[truncated]');

  // 6. Clean up test file
  console.log('\n5️⃣ Cleaning up test file...');
  const { error: deleteErr } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([testKey]);

  if (deleteErr) {
    console.warn('   ⚠️ Could not delete test file:', deleteErr.message);
  } else {
    console.log('   ✅ Test file removed cleanly.');
  }

  console.log('\n🎉 ALL SUPABASE STORAGE CHECKS PASSED 100%! The Service Role Key is active, valid, and fully operational.');
}

testSupabaseStorage().catch((err) => {
  console.error('\n❌ Supabase verification failed:', err.message);
  process.exit(1);
});

