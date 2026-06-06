process.env.DB_HOST = process.env.DB_HOST || '127.0.0.1';

const User = require('./server/models/User');
const pool = require('./server/config/database');

const EMAIL = 'superadmin@school.com';
const PASSWORD = 'SuperAdmin@123';

(async () => {
  let user = await User.findByEmail(EMAIL);

  if (!user) {
    const id = await User.create({
      username: 'superadmin',
      full_name: 'Super Admin',
      email: EMAIL,
      phone: '+250788000000',
      password: PASSWORD,
      role: 'super_admin',
      status: 'active',
      is_verified: true
    });
    user = await User.findById(id);
  } else {
    await User.updateProfile(user.id, {
      username: user.username || 'superadmin',
      full_name: user.full_name || 'Super Admin',
      email: EMAIL,
      phone: user.phone || '+250788000000',
      password: PASSWORD,
      profile_photo: user.profile_photo
    });
    await pool.query(
      "UPDATE users SET role = 'super_admin', status = 'active', is_verified = 1 WHERE id = ?",
      [user.id]
    );
    user = await User.findByEmail(EMAIL);
  }

  const ok = await User.comparePassword(PASSWORD, user.password_hash || user.password);
  console.log(JSON.stringify({
    email: EMAIL,
    password: PASSWORD,
    user_id: user.id,
    role: user.role,
    status: user.status,
    password_valid: ok
  }, null, 2));
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
