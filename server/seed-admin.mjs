import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const uri = 'mongodb://syamkdoram_db_user:xVMRfYAFMYYZvLzT@ac-k6ux81i-shard-00-00.mongodb.net:27017,ac-k6ux81i-shard-00-01.mongodb.net:27017,ac-k6ux81i-shard-00-02.mongodb.net:27017/aquagrow?ssl=true&replicaSet=atlas-k6ux81i-shard-0&authSource=admin&retryWrites=true&w=majority';

const PHONE    = '7382279533';
const PASSWORD = 'Syam@73822';
const NAME     = 'Super Admin';

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  console.log('✅ Connected to MongoDB Atlas');

  const db = client.db('aquagrow');

  // ── Check current state ──────────────────────────────────────────────────────
  const inUsers      = await db.collection('users').findOne({ phoneNumber: PHONE });
  const inAdminUsers = await db.collection('adminusers').findOne({ phoneNumber: PHONE });

  console.log('\n── users collection ──');
  console.log(inUsers ? `  Found: name=${inUsers.name}, role=${inUsers.role}` : '  NOT FOUND');

  console.log('\n── adminusers collection ──');
  console.log(inAdminUsers ? `  Found: name=${inAdminUsers.name}, role=${inAdminUsers.role}` : '  NOT FOUND');

  // ── Step 1: If user exists in `users` with wrong role, update to 'admin' ─────
  // (This makes the CURRENTLY DEPLOYED backend work immediately)
  if (inUsers && inUsers.role !== 'admin') {
    await db.collection('users').updateOne(
      { phoneNumber: PHONE },
      { $set: { role: 'admin' } }
    );
    console.log(`\n✅ Updated users.role → 'admin' for ${PHONE} (deployed server fix)`);
  } else if (inUsers && inUsers.role === 'admin') {
    console.log(`\n✅ users.role is already 'admin' for ${PHONE}`);
  }

  // ── Step 2: Seed adminusers collection (for new server after deploy) ──────────
  if (!inAdminUsers) {
    const hash = await bcrypt.hash(PASSWORD, 12);
    const result = await db.collection('adminusers').insertOne({
      name:        NAME,
      phoneNumber: PHONE,
      email:       'superadmin@aquagrow.app',
      password:    hash,
      role:        'super_admin',
      isActive:    true,
      createdAt:   new Date(),
      updatedAt:   new Date(),
    });
    console.log(`✅ Created super_admin in adminusers: _id=${result.insertedId}`);
  } else {
    console.log('✅ adminusers entry already exists — skipping insert');
  }

  await client.close();
  console.log('\n🎉 Done! You can now log in to the admin panel.');
}

run().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
