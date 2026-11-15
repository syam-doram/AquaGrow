/**
 * seed-staff.mjs
 * Seeds the 'staffusers' collection with an owner account for testing.
 * Run with: node server/seed-staff.mjs
 */
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const uri = 'mongodb://syamkdoram_db_user:xVMRfYAFMYYZvLzT@ac-k6ux81i-shard-00-00.mongodb.net:27017,ac-k6ux81i-shard-00-01.mongodb.net:27017,ac-k6ux81i-shard-00-02.mongodb.net:27017/aquagrow?ssl=true&replicaSet=atlas-k6ux81i-shard-0&authSource=admin&retryWrites=true&w=majority';

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  console.log('Connected to MongoDB Atlas');

  const db = client.db('aquagrow');
  const col = db.collection('staffusers');

  const accounts = [
    { name: 'Shop Owner', email: 'owner@aquagrow.app', password: 'Owner@12345', role: 'owner' },
    { name: 'Stock Staff', email: 'stock@aquagrow.app', password: 'Staff@12345', role: 'stock_staff' },
    { name: 'Billing Staff', email: 'billing@aquagrow.app', password: 'Staff@12345', role: 'billing_staff' },
  ];

  for (const acc of accounts) {
    const existing = await col.findOne({ email: acc.email });
    if (existing) {
      console.log('Already exists: ' + acc.email);
      continue;
    }
    const hash = await bcrypt.hash(acc.password, 12);
    await col.insertOne({
      name: acc.name, email: acc.email, password: hash,
      role: acc.role, active: true,
      createdAt: new Date(), updatedAt: new Date(),
    });
    console.log('Created: ' + acc.email + ' (' + acc.role + ')');
  }

  await client.close();
  console.log('Done!');
}

run().catch(e => { console.error(e.message); process.exit(1); });
