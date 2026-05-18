import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import ical from 'ical-generator';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const exportToPDF = (timetableData, className = 'Timetable') => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(`${className} - Timetable`, 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);
  
  const tableData = [];
  const timeSlots = new Map();
  
  timetableData.forEach(entry => {
    const key = `${entry.start_time}-${entry.end_time}`;
    if (!timeSlots.has(key)) {
      timeSlots.set(key, {
        start_time: entry.start_time,
        end_time: entry.end_time,
        entriesByDay: {}
      });
    }
    timeSlots.get(key).entriesByDay[entry.day_of_week] = entry;
  });
  
  const sortedSlots = Array.from(timeSlots.values()).sort((a, b) => 
    a.start_time.localeCompare(b.start_time)
  );
  
  sortedSlots.forEach((slot, index) => {
    const row = {
      Period: index + 1,
      Time: `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`
    };
    
    DAYS.forEach(day => {
      const entry = slot.entriesByDay[day];
      row[day] = entry 
        ? `${entry.module_name}\n${entry.teacher_name || ''}\n${entry.room_name || 'TBA'}`
        : '-';
    });
    
    tableData.push(row);
  });
  
  autoTable(doc, {
    head: ['Period', 'Time', ...DAYS],
    body: tableData.map(row => [
      row.Period,
      row.Time,
      ...DAYS.map(day => row[day])
    ]),
    startY: 35,
    styles: {
      fontSize: 8,
      cellPadding: 2
    },
    headStyles: {
      fillColor: [0, 102, 204],
      textColor: 255,
      fontStyle: 'bold'
    }
  });
  
  doc.save(`${className.replace(/\s+/g, '_')}_timetable.pdf`);
};

export const exportToExcel = (timetableData, className = 'Timetable') => {
  const timeSlots = new Map();
  
  timetableData.forEach(entry => {
    const key = `${entry.start_time}-${entry.end_time}`;
    if (!timeSlots.has(key)) {
      timeSlots.set(key, {
        start_time: entry.start_time,
        end_time: entry.end_time,
        entriesByDay: {}
      });
    }
    timeSlots.get(key).entriesByDay[entry.day_of_week] = entry;
  });
  
  const sortedSlots = Array.from(timeSlots.values()).sort((a, b) => 
    a.start_time.localeCompare(b.start_time)
  );
  
  const tableData = [['Period', 'Time', ...DAYS]];
  
  sortedSlots.forEach((slot, index) => {
    const row = [
      index + 1,
      `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`
    ];
    
    DAYS.forEach(day => {
      const entry = slot.entriesByDay[day];
      row.push(entry 
        ? `${entry.module_name} - ${entry.teacher_name || ''} (${entry.room_name || 'TBA'})`
        : '-'
      );
    });
    
    tableData.push(row);
  });
  
  const ws = XLSX.utils.aoa_to_sheet(tableData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Timetable');
  XLSX.writeFile(wb, `${className.replace(/\s+/g, '_')}_timetable.xlsx`);
};

export const exportToICal = (timetableData, className = 'Timetable') => {
  const calendar = ical({ name: `${className} Timetable` });
  
  timetableData.forEach(entry => {
    if (!entry.start_time || !entry.end_time || !entry.day_of_week) return;
    
    const dayIndex = DAYS.indexOf(entry.day_of_week);
    if (dayIndex === -1) return;
    
    const today = new Date();
    const eventDate = new Date(today);
    eventDate.setDate(today.getDate() + ((dayIndex + 7 - today.getDay()) % 7));
    
    const [startHour, startMin] = entry.start_time.split(':').map(Number);
    const [endHour, endMin] = entry.end_time.split(':').map(Number);
    
    const startDate = new Date(eventDate);
    startDate.setHours(startHour, startMin, 0, 0);
    
    const endDate = new Date(eventDate);
    endDate.setHours(endHour, endMin, 0, 0);
    
    calendar.createEvent({
      start: startDate,
      end: endDate,
      summary: entry.module_name || 'Class',
      description: `Teacher: ${entry.teacher_name || 'TBA'}\nRoom: ${entry.room_name || 'TBA'}\nClass: ${entry.class_name || className}`,
      location: entry.room_name || 'TBA',
      repeating: {
        freq: 'WEEKLY'
      }
    });
  });
  
  calendar.download(`${className.replace(/\s+/g, '_')}_timetable.ics`);
};
