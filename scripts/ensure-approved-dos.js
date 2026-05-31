const bcrypt = require('bcryptjs');
const pool = require('../server/config/database');
const School = require('../server/models/School');
const User = require('../server/models/User');

const DOS_ACCOUNT = {
  full_name: 'Demo Director of Studies',
  username: 'Demo Director of Studies',
  email: 'dos@school.com',
  phone: '+250788300000',
  password: 'Dos@12345',
  national_id: 'DOS-DEMO-001'
};

const findOne = async (query, params = []) => {
  const [rows] = await pool.execute(query, params);
  return rows[0] || null;
};

const ensureActiveSchool = async () => {
  await School.ensureSchema();
  await School.ensureTenantColumns();

  const existing = await findOne(
    "SELECT school_id FROM schools WHERE status = 'active' AND deleted_at IS NULL ORDER BY school_id LIMIT 1"
  );
  if (existing) return existing.school_id;

  const [result] = await pool.execute(
    `INSERT INTO schools
      (school_name, school_email, registration_number, school_code, school_address, phone, status, approved_at, subscription_status)
     VALUES (?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, 'active')`,
    [
      'Academic Bridge Demo School',
      'demo-school@academicbridge.local',
      'AB-DEMO-001',
      'AB-DEMO',
      'Kigali',
      '+250788000000'
    ]
  );

  return result.insertId;
};

const ensureApprovedDos = async () => {
  const schoolId = await ensureActiveSchool();
  await User.ensureAuthColumns();

  let user = await User.findByEmail(DOS_ACCOUNT.email);
  if (!user) {
    const userId = await User.create({
      ...DOS_ACCOUNT,
      role: 'dos',
      is_verified: true,
      school_id: schoolId,
      status: 'active'
    });
    user = await User.findById(userId);
  } else {
    const passwordHash = await bcrypt.hash(DOS_ACCOUNT.password, 10);
    await pool.execute(
      `UPDATE users
       SET username = ?,
           full_name = ?,
           phone = ?,
           password = ?,
           password_hash = ?,
           role = 'dos',
           is_verified = 1,
           school_id = ?,
           status = 'active'
       WHERE id = ?`,
      [
        DOS_ACCOUNT.username,
        DOS_ACCOUNT.full_name,
        DOS_ACCOUNT.phone,
        passwordHash,
        passwordHash,
        schoolId,
        user.id
      ]
    );
    user = await User.findByEmail(DOS_ACCOUNT.email);
  }

  const director = await School.findDirectorByEmail(DOS_ACCOUNT.email);
  if (director) {
    await pool.execute(
      `UPDATE directors_of_studies
       SET user_id = ?,
           school_id = ?,
           full_name = ?,
           phone = ?,
           national_id = ?,
           status = 'active'
       WHERE dos_id = ?`,
      [
        user.id,
        schoolId,
        DOS_ACCOUNT.full_name,
        DOS_ACCOUNT.phone,
        DOS_ACCOUNT.national_id,
        director.dos_id
      ]
    );
  } else {
    await School.createDirector({
      user_id: user.id,
      school_id: schoolId,
      full_name: DOS_ACCOUNT.full_name,
      email: DOS_ACCOUNT.email,
      phone: DOS_ACCOUNT.phone,
      national_id: DOS_ACCOUNT.national_id,
      status: 'active'
    });
  }

  await School.updateStatus(schoolId, 'active');
  await School.updateDirectorStatusBySchool(schoolId, 'active');

  console.log('Approved DOS account is ready:');
  console.log(`Email: ${DOS_ACCOUNT.email}`);
  console.log(`Password: ${DOS_ACCOUNT.password}`);
  console.log(`School ID: ${schoolId}`);
};

ensureApprovedDos()
  .catch((error) => {
    console.error('Failed to ensure approved DOS account:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
