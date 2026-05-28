const db = require('../config/database');

class ConflictDetectionService {
  /**
   * Check for teacher double-booking conflict
   * @param {number} teacherId - Teacher ID
   * @param {string} dayOfWeek - Day of week
   * @param {string} startTime - Start time (HH:mm:ss)
   * @param {string} endTime - End time (HH:mm:ss)
   * @param {number} excludeTimetableId - Timetable ID to exclude (for updates)
   * @returns {Promise<Object>} Conflict details or null
   */
  async checkTeacherConflict(teacherId, dayOfWeek, startTime, endTime, excludeTimetableId = null, schoolId = null) {
    const schoolClause = schoolId ? 'AND t.school_id = ?' : '';
    const query = `
      SELECT t.*, c.class_name, m.module_name
      FROM timetable t
      JOIN assignment a ON t.assignment_id = a.assignment_id
      JOIN class c ON t.class_id = c.class_id
      JOIN module m ON a.module_id = m.module_id
      WHERE a.teacher_id = ?
        AND t.day_of_week = ?
        AND (
          (t.start_time < ? AND t.end_time > ?) OR
          (t.start_time < ? AND t.end_time > ?) OR
          (t.start_time >= ? AND t.end_time <= ?)
        )
        ${schoolClause}
        ${excludeTimetableId ? 'AND t.timetable_id != ?' : ''}
    `;
    
    const params = [teacherId, dayOfWeek, endTime, startTime, endTime, startTime, startTime, endTime];
    if (schoolId) params.push(schoolId);
    if (excludeTimetableId) params.push(excludeTimetableId);
    
    const [conflicts] = await db.query(query, params);
    
    if (conflicts.length > 0) {
      return {
        type: 'teacher_conflict',
        message: `Teacher is already scheduled for ${conflicts[0].class_name} - ${conflicts[0].module_name} at this time`,
        details: conflicts
      };
    }
    
    return null;
  }

  /**
   * Check for room availability conflict
   * @param {number} roomId - Room ID
   * @param {string} dayOfWeek - Day of week
   * @param {string} startTime - Start time (HH:mm:ss)
   * @param {string} endTime - End time (HH:mm:ss)
   * @param {number} excludeTimetableId - Timetable ID to exclude (for updates)
   * @returns {Promise<Object>} Conflict details or null
   */
  async checkRoomConflict(roomId, dayOfWeek, startTime, endTime, excludeTimetableId = null, schoolId = null) {
    if (!roomId) return null;
    const schoolClause = schoolId ? 'AND t.school_id = ?' : '';
    
    const query = `
      SELECT t.*, c.class_name, r.room_name
      FROM timetable t
      JOIN class c ON t.class_id = c.class_id
      JOIN room r ON t.room_id = r.room_id
      WHERE t.room_id = ?
        AND t.day_of_week = ?
        AND (
          (t.start_time < ? AND t.end_time > ?) OR
          (t.start_time < ? AND t.end_time > ?) OR
          (t.start_time >= ? AND t.end_time <= ?)
        )
        ${schoolClause}
        ${excludeTimetableId ? 'AND t.timetable_id != ?' : ''}
    `;
    
    const params = [roomId, dayOfWeek, endTime, startTime, endTime, startTime, startTime, endTime];
    if (schoolId) params.push(schoolId);
    if (excludeTimetableId) params.push(excludeTimetableId);
    
    const [conflicts] = await db.query(query, params);
    
    if (conflicts.length > 0) {
      return {
        type: 'room_conflict',
        message: `Room ${conflicts[0].room_name} is already booked for ${conflicts[0].class_name} at this time`,
        details: conflicts
      };
    }
    
    return null;
  }

  /**
   * Check for student section overlap conflict
   * @param {number} classId - Class ID
   * @param {string} dayOfWeek - Day of week
   * @param {string} startTime - Start time (HH:mm:ss)
   * @param {string} endTime - End time (HH:mm:ss)
   * @param {number} excludeTimetableId - Timetable ID to exclude (for updates)
   * @returns {Promise<Object>} Conflict details or null
   */
  async checkSectionConflict(classId, dayOfWeek, startTime, endTime, excludeTimetableId = null, schoolId = null) {
    const schoolClause = schoolId ? 'AND school_id = ?' : '';
    const classParams = [classId];
    if (schoolId) classParams.push(schoolId);

    // Get the section_id for the given class
    const [classData] = await db.query(
      `SELECT section_id FROM class WHERE class_id = ? ${schoolClause}`,
      classParams
    );
    
    if (!classData.length || !classData[0].section_id) return null;
    
    const sectionId = classData[0].section_id;
    
    // Check if any other class in the same section has a timetable entry at this time
    const timetableSchoolClause = schoolId ? 'AND t.school_id = ? AND c.school_id = ?' : '';
    const query = `
      SELECT t.*, c.class_name
      FROM timetable t
      JOIN class c ON t.class_id = c.class_id
      WHERE c.section_id = ?
        AND c.class_id != ?
        AND t.day_of_week = ?
        AND (
          (t.start_time < ? AND t.end_time > ?) OR
          (t.start_time < ? AND t.end_time > ?) OR
          (t.start_time >= ? AND t.end_time <= ?)
        )
        ${timetableSchoolClause}
        ${excludeTimetableId ? 'AND t.timetable_id != ?' : ''}
    `;
    
    const params = [sectionId, classId, dayOfWeek, endTime, startTime, endTime, startTime, startTime, endTime];
    if (schoolId) params.push(schoolId, schoolId);
    if (excludeTimetableId) params.push(excludeTimetableId);
    
    const [conflicts] = await db.query(query, params);
    
    if (conflicts.length > 0) {
      return {
        type: 'section_conflict',
        message: `Section has a conflict with class ${conflicts[0].class_name} at this time`,
        details: conflicts
      };
    }
    
    return null;
  }

  /**
   * Check teacher availability based on their availability matrix
   * @param {number} teacherId - Teacher ID
   * @param {string} dayOfWeek - Day of week
   * @param {string} startTime - Start time (HH:mm:ss)
   * @param {string} endTime - End time (HH:mm:ss)
   * @returns {Promise<Object>} Availability conflict or null
   */
  async checkTeacherAvailability(teacherId, dayOfWeek, startTime, endTime, schoolId = null) {
    const schoolClause = schoolId ? 'AND school_id = ?' : '';
    const params = [teacherId];
    if (schoolId) params.push(schoolId);
    const [teachers] = await db.query(
      `SELECT availability FROM teacher WHERE teacher_id = ? ${schoolClause}`,
      params
    );
    
    if (!teachers.length || !teachers[0].availability) return null;
    
    const availability = JSON.parse(teachers[0].availability);
    const dayAvailability = availability[dayOfWeek];
    
    if (!dayAvailability) return null;
    
    // Check if the time slot is marked as unavailable
    for (const [slot, isAvailable] of Object.entries(dayAvailability)) {
      if (!isAvailable) {
        const [slotStart, slotEnd] = slot.split('-');
        if (this.timeRangesOverlap(slotStart, slotEnd, startTime, endTime)) {
          return {
            type: 'availability_conflict',
            message: `Teacher is not available during this time slot (${slot})`
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Check if room type matches module requirements
   * @param {number} roomId - Room ID
   * @param {number} moduleId - Module ID
   * @returns {Promise<Object>} Type mismatch or null
   */
  async checkRoomTypeMatch(roomId, moduleId, schoolId = null) {
    if (!roomId || !moduleId) return null;
    const schoolClause = schoolId ? 'AND school_id = ?' : '';
    const roomParams = [roomId];
    const moduleParams = [moduleId];
    if (schoolId) {
      roomParams.push(schoolId);
      moduleParams.push(schoolId);
    }
    
    const [rooms] = await db.query(
      `SELECT room_type FROM room WHERE room_id = ? ${schoolClause}`,
      roomParams
    );
    
    const [modules] = await db.query(
      `SELECT required_room_type FROM module WHERE module_id = ? ${schoolClause}`,
      moduleParams
    );
    
    if (!rooms.length || !modules.length) return null;
    
    const roomType = rooms[0].room_type;
    const requiredType = modules[0].required_room_type;
    
    if (requiredType && roomType !== requiredType) {
      return {
        type: 'room_type_mismatch',
        message: `Room type (${roomType}) does not match module requirement (${requiredType})`
      };
    }
    
    return null;
  }

  /**
   * Comprehensive conflict check for a timetable entry
   * @param {Object} timetableData - Timetable entry data
   * @returns {Promise<Array>} Array of conflicts
   */
  async checkAllConflicts(timetableData) {
    const conflicts = [];
    const { class_id, assignment_id, day_of_week, start_time, end_time, room_id, timetable_id, school_id } = timetableData;
    
    // Get teacher_id from assignment
    let teacherId = null;
    let moduleId = null;
    
    if (assignment_id) {
      const schoolClause = school_id ? 'AND school_id = ?' : '';
      const params = [assignment_id];
      if (school_id) params.push(school_id);
      const [assignments] = await db.query(
        `SELECT teacher_id, module_id FROM assignment WHERE assignment_id = ? ${schoolClause}`,
        params
      );
      if (assignments.length) {
        teacherId = assignments[0].teacher_id;
        moduleId = assignments[0].module_id;
      }
    }
    
    // Check teacher conflict
    if (teacherId) {
      const teacherConflict = await this.checkTeacherConflict(
        teacherId,
        day_of_week,
        start_time,
        end_time,
        timetable_id,
        school_id
      );
      if (teacherConflict) conflicts.push(teacherConflict);
      
      // Check teacher availability
      const availabilityConflict = await this.checkTeacherAvailability(
        teacherId,
        day_of_week,
        start_time,
        end_time,
        school_id
      );
      if (availabilityConflict) conflicts.push(availabilityConflict);
    }
    
    // Check room conflict
    if (room_id) {
      const roomConflict = await this.checkRoomConflict(
        room_id,
        day_of_week,
        start_time,
        end_time,
        timetable_id,
        school_id
      );
      if (roomConflict) conflicts.push(roomConflict);
      
      // Check room type match
      if (moduleId) {
        const typeMismatch = await this.checkRoomTypeMatch(room_id, moduleId, school_id);
        if (typeMismatch) conflicts.push(typeMismatch);
      }
    }
    
    // Check section conflict
    if (class_id) {
      const sectionConflict = await this.checkSectionConflict(
        class_id,
        day_of_week,
        start_time,
        end_time,
        timetable_id,
        school_id
      );
      if (sectionConflict) conflicts.push(sectionConflict);
    }
    
    return conflicts;
  }

  /**
   * Helper function to check if two time ranges overlap
   */
  timeRangesOverlap(start1, end1, start2, end2) {
    return start1 < end2 && end1 > start2;
  }
}

module.exports = new ConflictDetectionService();
