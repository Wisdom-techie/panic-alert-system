require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const users = [
    { username: 'admin', password: 'RSUmaster2026!', full_name: 'Chief Security Officer', role: 'master' },
    { username: 'jdoe', password: 'Staff2026!', full_name: 'John Doe', role: 'staff' },
    { username: 'msmith', password: 'Staff2026!', full_name: 'Mary Smith', role: 'staff' },
  ];

  for (const u of users) {
    const exists = await User.findOne({ username: u.username });
    if (exists) { console.log(`Skipped ${u.username}, already exists`); continue; }
    const password_hash = await bcrypt.hash(u.password, 10);
    await User.create({ ...u, password_hash });
    console.log(`Created ${u.username} (${u.role})`);
  }

  await mongoose.disconnect();
  console.log('Done seeding');
}

seed();