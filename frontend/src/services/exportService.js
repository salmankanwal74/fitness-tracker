import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

// CSV Export — kisi bhi data array ko CSV file mein download karta hai
export const exportToCSV = (data, filename) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
};

// Har PDF ke upar same header — title, user name, date
const addReportHeader = (doc, title, userName) => {
  doc.setFontSize(18);
  doc.text(title, 14, 20);
  doc.setFontSize(11);
  doc.text(`Generated for: ${userName}`, 14, 28);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 34);
};

// PDF Export — Workouts ke liye
export const exportWorkoutsToPDF = (workouts, userName) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  addReportHeader(doc, 'Workout Report', userName);

  const tableData = workouts.map((w) => [
    w.exerciseName,
    w.category || '-',
    w.sets,
    w.reps,
    w.weight || '-',
    w.duration || '-',
    w.caloriesBurned || '-',
    (w.tags || []).join(', ') || '-',
    w.notes || '-',
    new Date(w.date).toLocaleDateString(),
  ]);

  autoTable(doc, {
    startY: 40,
    head: [
      ['Exercise', 'Category', 'Sets', 'Reps', 'Weight (kg)', 'Duration (min)', 'Calories', 'Tags', 'Notes', 'Date'],
    ],
    body: tableData,
    styles: { fontSize: 8 },
    columnStyles: { 8: { cellWidth: 50 } },
  });

  doc.save('workout-report.pdf');
};

// PDF Export — Nutrition ke liye
export const exportNutritionToPDF = (nutrition, userName) => {
  const doc = new jsPDF();
  addReportHeader(doc, 'Nutrition Report', userName);

  const tableData = nutrition.map((n) => [
    n.foodItem,
    n.mealType,
    n.quantity,
    n.calories,
    n.protein || '-',
    n.carbs || '-',
    n.fats || '-',
    new Date(n.date).toLocaleDateString(),
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['Food', 'Meal', 'Qty', 'Calories', 'Protein', 'Carbs', 'Fats', 'Date']],
    body: tableData,
  });

  doc.save('nutrition-report.pdf');
};

// PDF Export — Weight ke liye (weights array kg mein hoti hai, display unit alag ho sakti hai)
export const exportWeightToPDF = (weights, userName, unit = 'kg', displayFn = (v) => v) => {
  const doc = new jsPDF();
  addReportHeader(doc, 'Weight Report', userName);

  const tableData = weights.map((w) => [displayFn(w.weight, unit), new Date(w.date).toLocaleDateString()]);

  autoTable(doc, {
    startY: 40,
    head: [[`Weight (${unit})`, 'Date']],
    body: tableData,
  });

  doc.save('weight-report.pdf');
};

// PDF Export — Body Measurements ke liye
export const exportMeasurementsToPDF = (entries, userName, unit = 'cm', displayFn = (v) => v) => {
  const doc = new jsPDF();
  addReportHeader(doc, 'Body Measurements Report', userName);

  const tableData = entries.map((e) => [
    e.chest ? displayFn(e.chest, unit) : '-',
    e.waist ? displayFn(e.waist, unit) : '-',
    e.hips ? displayFn(e.hips, unit) : '-',
    e.arms ? displayFn(e.arms, unit) : '-',
    e.thighs ? displayFn(e.thighs, unit) : '-',
    new Date(e.date).toLocaleDateString(),
  ]);

  autoTable(doc, {
    startY: 40,
    head: [[`Chest (${unit})`, `Waist (${unit})`, `Hips (${unit})`, `Arms (${unit})`, `Thighs (${unit})`, 'Date']],
    body: tableData,
  });

  doc.save('measurements-report.pdf');
};

// PDF Export — Performance records ke liye
export const exportPerformanceToPDF = (entries, userName) => {
  const doc = new jsPDF();
  addReportHeader(doc, 'Performance Report', userName);

  const tableData = entries.map((e) => [
    e.exerciseName,
    e.type,
    `${e.value} ${e.unit}`,
    new Date(e.date).toLocaleDateString(),
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['Exercise', 'Type', 'Result', 'Date']],
    body: tableData,
  });

  doc.save('performance-report.pdf');
};

// Combined "Full Progress Report" — sab kuch ek hi PDF mein, section by section.
// data = { workouts, nutrition, weights, measurements, performance }
export const exportFullReportToPDF = (data, userName, units = { weightUnit: 'kg', lengthUnit: 'cm' }, displayWeight = (v) => v, displayLength = (v) => v) => {
  const doc = new jsPDF();
  addReportHeader(doc, 'Full Progress Report', userName);

  let y = 42;

  const addSection = (title, head, rows) => {
    if (rows.length === 0) return;

    // Agar page khatam hone ke qareeb hai to nayi page shuru karo
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(13);
    doc.text(title, 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [head],
      body: rows,
      styles: { fontSize: 8 },
      margin: { top: 10 },
    });

    y = doc.lastAutoTable.finalY + 14;
  };

  addSection(
    'Workouts',
    ['Exercise', 'Category', 'Sets', 'Reps', 'Weight (kg)', 'Date'],
    (data.workouts || []).map((w) => [
      w.exerciseName,
      w.category || '-',
      w.sets,
      w.reps,
      w.weight || '-',
      new Date(w.date).toLocaleDateString(),
    ])
  );

  addSection(
    'Nutrition',
    ['Food', 'Meal', 'Calories', 'Date'],
    (data.nutrition || []).map((n) => [n.foodItem, n.mealType, n.calories, new Date(n.date).toLocaleDateString()])
  );

  addSection(
    `Weight (${units.weightUnit})`,
    [`Weight (${units.weightUnit})`, 'Date'],
    (data.weights || []).map((w) => [displayWeight(w.weight, units.weightUnit), new Date(w.date).toLocaleDateString()])
  );

  addSection(
    `Body Measurements (${units.lengthUnit})`,
    ['Chest', 'Waist', 'Hips', 'Arms', 'Thighs', 'Date'],
    (data.measurements || []).map((e) => [
      e.chest ? displayLength(e.chest, units.lengthUnit) : '-',
      e.waist ? displayLength(e.waist, units.lengthUnit) : '-',
      e.hips ? displayLength(e.hips, units.lengthUnit) : '-',
      e.arms ? displayLength(e.arms, units.lengthUnit) : '-',
      e.thighs ? displayLength(e.thighs, units.lengthUnit) : '-',
      new Date(e.date).toLocaleDateString(),
    ])
  );

  addSection(
    'Performance',
    ['Exercise', 'Type', 'Result', 'Date'],
    (data.performance || []).map((e) => [e.exerciseName, e.type, `${e.value} ${e.unit}`, new Date(e.date).toLocaleDateString()])
  );

  doc.save('full-progress-report.pdf');
};