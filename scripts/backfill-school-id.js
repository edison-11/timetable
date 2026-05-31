/*
Backfill school_id for existing tenant rows.

Assumptions (based on current codebase):
- tenant tables already exist with a nullable school_id column OR schema/migrations can add it.
- Relationship to infer school_id:
  - teacher.school_id from teacher table directly if present
  - classes.school_id from classes table directly if present
  - For timetable/assignments/rooms/etc: infer via parent entities when school_id is NULL.

This script is safe to run multiple times.
It only updates rows where school_id IS NULL.
*/

const pool = require('../server/config/database');

const log = (...args) => console.log('[backfill-school-id]', ...args);

async function columnExists(tableName, columnName) {
  const [rows] = await pool.query(`SHOW COLUMNS FROM \`${tableName}\` LIKE ?`, [columnName]);
  return rows.length > 0;
}

async function tableExists(tableName) {
  const [rows] = await pool.query('SHOW TABLES LIKE ?', [tableName]);
  return rows.length > 0;
}

async function ensureColumn(tableName, columnName) {
  if (!(await tableExists(tableName))) return false;
  if (await columnExists(tableName, columnName)) return true;
  await pool.execute(`ALTER TABLE \`${tableName}\` ADD COLUMN ${columnName} INT NULL`);
  return true;
}

async function backfillFromTeacher(tableName, fkTeacherColumn) {
  if (!(await tableExists(tableName))) return 0;
  await ensureColumn(tableName, 'school_id');

  const teachIdColInTeacher = (await columnExists('teacher', 'teacher_id')) ? 'teacher_id' : null;
  if (!teachIdColInTeacher) return 0;

  // Only set where school_id is null and teacher exists.
  const [result] = await pool.execute(
    `UPDATE \`${tableName}\` t
     JOIN teacher teach ON teach.\`${teachIdColInTeacher}\` = t.\`${fkTeacherColumn}\`
     SET t.school_id = teach.school_id
     WHERE t.school_id IS NULL AND teach.school_id IS NOT NULL`
  );

  return result.affectedRows || 0;
}


async function backfillFromClass(tableName, fkClassColumn) {
  if (!(await tableExists(tableName))) return 0;
  if (!(await tableExists('classes'))) return 0;

  await ensureColumn(tableName, 'school_id');
  const classesHasSchoolId = await columnExists('classes', 'school_id');
  if (!classesHasSchoolId) {
    log(`skip ${tableName} backfill from class: classes.school_id column missing`);
    return 0;
  }

  const [result] = await pool.execute(
    `UPDATE \`${tableName}\` x
     JOIN classes c ON c.class_id = x.\`${fkClassColumn}\`
     SET x.school_id = c.school_id
     WHERE x.school_id IS NULL AND c.school_id IS NOT NULL`
  );

  return result.affectedRows || 0;
}


async function backfillRoomsFromTeacher() {
  // If rooms are not linked via classes.school_id (classes has no school_id),
  // infer rooms.school_id via timetable.school_id (if timetable has room_id).
  if (!(await tableExists('rooms'))) return 0;
  if (!(await tableExists('timetable'))) return 0;

  await ensureColumn('rooms', 'school_id');

  // Rooms may have room_id or id. Timetable has room_id.
  const roomsRoomIdCol = (await columnExists('rooms', 'room_id'))
    ? 'room_id'
    : (await columnExists('rooms', 'id') ? 'id' : null);

  if (!roomsRoomIdCol) {
    log('skip rooms backfill: cannot find room id column in rooms');
    return 0;
  }

  // Backfill where rooms.school_id is NULL using any timetable row for that room.
  const [result] = await pool.execute(
    `UPDATE rooms r
     JOIN (
       SELECT \`room_id\`, MAX(school_id) AS school_id
       FROM timetable
       WHERE school_id IS NOT NULL AND \`room_id\` IS NOT NULL
       GROUP BY \`room_id\`
     ) t ON t.\`room_id\` = r.\`${roomsRoomIdCol}\`
     SET r.school_id = t.school_id
     WHERE r.school_id IS NULL AND t.school_id IS NOT NULL`
  );

  return result.affectedRows || 0;
}



async function backfillTimetableFromClassTeacherRoom() {
  if (!(await tableExists('timetable')) && !(await tableExists('timetable_entries'))) return 0;

  let total = 0;

  const candidateTables = (await tableExists('timetable')) ? ['timetable'] : [];
  if (await tableExists('timetable_entries')) candidateTables.push('timetable_entries');

  for (const tableName of candidateTables) {
    await ensureColumn(tableName, 'school_id');

    // Try infer from classes
    if (await columnExists(tableName, 'class_id') && await tableExists('classes') && await columnExists('classes', 'school_id')) {
      const [res1] = await pool.execute(
        `UPDATE \`${tableName}\` t
         JOIN classes c ON c.class_id = t.class_id
         SET t.school_id = c.school_id
         WHERE t.school_id IS NULL AND c.school_id IS NOT NULL`
      );
      total += res1.affectedRows || 0;
    }


    // Then infer from teacher
    if (await columnExists(tableName, 'teacher_id') && await tableExists('teacher')) {
      const [res2] = await pool.execute(
        `UPDATE \`${tableName}\` t
         JOIN teacher teach ON teach.teacher_id = t.teacher_id
         SET t.school_id = teach.school_id
         WHERE t.school_id IS NULL AND teach.school_id IS NOT NULL`
      );
      total += res2.affectedRows || 0;
    }

    // Then infer from room
    if (await columnExists(tableName, 'room_id') && await tableExists('rooms')) {
      const roomsHasRoomId = await columnExists('rooms', 'room_id');
      const roomsRoomIdCol = roomsHasRoomId ? 'room_id' : (await columnExists('rooms', 'id') ? 'id' : null);
      if (roomsRoomIdCol) {
        const [res3] = await pool.execute(
          `UPDATE \`${tableName}\` t
           JOIN rooms r ON r.\`${roomsRoomIdCol}\` = t.room_id
           SET t.school_id = r.school_id
           WHERE t.school_id IS NULL AND r.school_id IS NOT NULL`
        );
        total += res3.affectedRows || 0;
      } else {
        log(`skip ${tableName} timetable backfill from room: cannot find rooms room id column`);
      }
    }

  }

  return total;
}

async function main() {
  try {
    log('starting...');

    // Teacher table itself is usually the most reliable.
    // If teacher.school_id is already set, nothing to do.

    // classes: infer from class-related tables when possible (currently not implemented here).

    // rooms: infer via timetable if classes.school_id doesn't exist.
    const roomsUpdated = await backfillRoomsFromTeacher();
    log(`rooms updated: ${roomsUpdated}`);


    // assignments: infer from class_id.
    // assignment table in this codebase uses `class_id` and `teacher_id`.
    const assignmentFromClass = await backfillFromClass('assignment', 'class_id');
    log(`assignment updated from class: ${assignmentFromClass}`);

    // timetables (timetable / timetable_entries): infer from class/teacher/room.
    const timetableUpdated = await backfillTimetableFromClassTeacherRoom();
    log(`timetable updated: ${timetableUpdated}`);

    // notifications: infer from recipient role is hard; skip.

    // student: infer from classes/class_id if schema has class_id on student.
    // Some schemas may use student.class_id or student.section_id.
    if (await tableExists('student')) {
      await ensureColumn('student', 'school_id');
      if (await columnExists('student', 'class_id') && await tableExists('classes')) {
        const stUpdated = await backfillFromClass('student', 'class_id');
        log(`student updated from class: ${stUpdated}`);
      }
    }

    log('done');
  } catch (err) {
    console.error('backfill-school-id failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => {});
  }
}

main();

