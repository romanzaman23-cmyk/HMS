const fs = require('fs');
const path = require('path');
const { query, isMySQLConnected, getFallbackStore, saveStore } = require('../config/db');
const whatsappService = require('../services/whatsappService');

// Helper to determine next sequential class for student promotion
function getNextClass(currentClassId, currentClassName, allClasses = []) {
  if (!allClasses || allClasses.length === 0) return null;

  // 1. Check numeric name: e.g. "Grade 5" -> "Grade 6", "Class 1" -> "Class 2"
  const currentNumMatch = (currentClassName || '').match(/\d+/);
  if (currentNumMatch) {
    const currentNum = parseInt(currentNumMatch[0], 10);
    const nextNum = currentNum + 1;
    const matchByNum = allClasses.find(c => {
      const m = (c.name || '').match(/\d+/);
      return m && parseInt(m[0], 10) === nextNum;
    });
    if (matchByNum) return matchByNum;
  }

  // 2. Match by next id in ascending order
  const sorted = [...allClasses].sort((a, b) => (parseInt(a.id, 10) || 0) - (parseInt(b.id, 10) || 0));
  const currentIndex = sorted.findIndex(c => String(c.id) === String(currentClassId));
  if (currentIndex !== -1 && currentIndex + 1 < sorted.length) {
    return sorted[currentIndex + 1];
  }

  return null;
}


// Helper to generate Official Detailed Marks Certificate (DMC) HTML
function generateDmcHtml(student, subjects = [], term = 'Term 1 (2025-26)') {
  let totalObtained = 0;
  let totalMax = 0;
  let totalPass = 0;
  let hasFailedSubject = false;

  const subjectRows = subjects.map((s, idx) => {
    const obt = parseFloat(s.marks) || 0;
    const max = parseFloat(s.total_marks) || 100;
    const pass = Math.round(max * 0.4); // 40% passing criteria
    totalObtained += obt;
    totalMax += max;
    totalPass += pass;
    const isFail = obt < pass || s.grade === 'F';
    if (isFail) hasFailedSubject = true;
    const statusColor = isFail ? '#dc2626' : '#059669';
    return `
      <tr>
        <td style="text-align:center;padding:10px 6px;">${idx + 1}</td>
        <td style="font-weight:700;text-align:left;padding:10px 14px;color:#0f172a;">${s.subject || 'Subject'}</td>
        <td style="text-align:center;padding:10px 6px;">${max}</td>
        <td style="text-align:center;padding:10px 6px;">${pass}</td>
        <td style="text-align:center;font-weight:800;color:#173B73;padding:10px 6px;">${obt}</td>
        <td style="text-align:center;font-weight:900;color:${statusColor};padding:10px 6px;">${s.grade || (isFail ? 'F' : 'A')}</td>
        <td style="text-align:center;font-size:12px;font-weight:800;color:${statusColor};padding:10px 6px;">${isFail ? 'FAIL' : 'PASS'}</td>
      </tr>
    `;
  }).join('');

  const pct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
  const isOverallPass = pct >= 40 && !hasFailedSubject;
  const overallGrade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : 'F';
  const issueDate = new Date().toISOString().slice(0, 10);
  const photoUrl = student?.avatar_url || '/uploads/student_avatar_1792156410934_1792156469549.jpg';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Detailed Marks Certificate (DMC) - ${student?.full_name || 'Student'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
    .dmc-frame { border: 8px double #173B73; padding: 28px; border-radius: 14px; background: #ffffff; max-width: 820px; margin: auto; box-shadow: 0 10px 25px rgba(0,0,0,0.08); position: relative; }
    .header { text-align: center; border-bottom: 2px solid #173B73; padding-bottom: 14px; position: relative; }
    .photo-stamp { position: absolute; right: 0; top: 0; width: 90px; height: 110px; border: 2px solid #173B73; border-radius: 8px; overflow: hidden; background: #f1f5f9; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .photo-stamp img { width: 100%; height: 100%; object-fit: cover; }
    .school-name { font-size: 26px; font-weight: 900; text-transform: uppercase; color: #173B73; margin: 0; letter-spacing: 1px; }
    .school-sub { font-size: 12px; font-weight: 700; color: #3478D4; text-transform: uppercase; margin-top: 4px; }
    .dmc-title { font-size: 15px; font-weight: 800; text-transform: uppercase; background: #e0f2fe; color: #173B73; padding: 6px 24px; border-radius: 20px; display: inline-block; margin-top: 12px; border: 1px solid #bae6fd; letter-spacing: 0.5px; }
    .student-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f8fafc; padding: 14px; border-radius: 10px; margin: 18px 0; border: 1px solid #cbd5e1; font-size: 12px; }
    .student-grid div { font-weight: 500; color: #64748b; }
    .student-grid strong { display: block; color: #0f172a; font-size: 13px; font-weight: 700; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; background: #fff; margin: 16px 0; font-size: 13px; }
    th { background: #173B73; color: #fff; padding: 10px 8px; border: 1px solid #0f2b57; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
    td { padding: 9px 8px; border: 1px solid #e2e8f0; }
    .total-row { background: #f1f5f9; font-weight: bold; }
    .summary-badge { background: ${isOverallPass ? '#ecfdf5' : '#fef2f2'}; border: 1px solid ${isOverallPass ? '#a7f3d0' : '#fecaca'}; padding: 12px 16px; border-radius: 8px; font-size: 13px; font-weight: bold; color: ${isOverallPass ? '#065f46' : '#991b1b'}; display: flex; justify-content: space-between; align-items: center; margin-top: 15px; }
    .foot-sig { display: flex; justify-content: space-between; margin-top: 45px; text-align: center; font-size: 12px; font-weight: bold; color: #334155; }
    .sig-line { width: 140px; border-bottom: 1.5px solid #1e293b; margin: 0 auto 6px auto; }
    @media print { body { padding: 0; background: #fff; } .dmc-frame { border: 4px double #173B73; box-shadow: none; } }
  </style>
</head>
<body>
  <div class="dmc-frame">
    <div class="header">
      <div class="photo-stamp">
        <img src="${photoUrl}" alt="${student?.full_name || 'Student'}" onerror="this.src='/uploads/roman_profile.png'" />
      </div>
      <h1 class="school-name">Highlight Model School</h1>
      <div class="school-sub">Saraghundi Thall District Hangu • Session 2025-2026</div>
      <div><span class="dmc-title">Detailed Marks Certificate (DMC)</span></div>
    </div>

    <div class="student-grid">
      <div>Student Name:<strong>${student?.full_name || 'Roman'}</strong></div>
      <div>Father's Name:<strong>${student?.father_name || student?.parent_name || 'Khalid'}</strong></div>
      <div>Roll Number:<strong>${student?.roll_number || 'HMS-679'}</strong></div>
      <div>Class:<strong>${student?.class_name || 'Grade 3'}</strong></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Sr.</th>
          <th style="text-align:left;padding-left:14px;">Subject Title</th>
          <th>Max Marks</th>
          <th>Pass Marks</th>
          <th>Marks Obtained</th>
          <th>Grade</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${subjectRows}
        <tr class="total-row">
          <td colspan="2" style="text-align:right;padding-right:14px;font-weight:800;">Grand Total:</td>
          <td style="text-align:center;font-weight:800;">${totalMax}</td>
          <td style="text-align:center;font-weight:800;">${totalPass}</td>
          <td style="text-align:center;font-weight:900;color:#173B73;font-size:15px;">${totalObtained}</td>
          <td style="text-align:center;font-weight:900;color:${isOverallPass ? '#059669' : '#dc2626'};font-size:15px;">${overallGrade} (${Math.round(pct)}%)</td>
          <td style="text-align:center;font-weight:800;color:${isOverallPass ? '#059669' : '#dc2626'};">${isOverallPass ? 'PASSED' : 'RETAINED'}</td>
        </tr>
      </tbody>
    </table>

    <div class="summary-badge">
      <span>Result: ${isOverallPass ? '🎉 PASSED & PROMOTED' : '⚠️ RETAINED IN SAME CLASS'}</span>
      <span>Examination: ${term}</span>
      <span>Date of Issue: ${issueDate}</span>
    </div>

    <div class="foot-sig">
      <div>
        <div class="sig-line"></div>
        Class Incharge
      </div>
      <div>
        <div class="sig-line"></div>
        Controller of Examinations
      </div>
      <div>
        <div class="sig-line"></div>
        Principal / Headmaster
      </div>
    </div>
  </div>
</body>
</html>`;
}

// Helper to ensure DMC exists for student and results
function ensureStudentDmc(store, student, results, term) {
  if (!student || !results || results.length === 0) return null;
  const sid = student.id;

  store.student_documents = store.student_documents || [];
  store.result_documents = store.result_documents || [];

  // Look for existing DMC
  let existingDmc = store.student_documents.find(d => 
    String(d.student_id) === String(sid) &&
    (d.category === 'Detailed Marks Certificate' || d.category === 'DMC' || (d.title && (d.title.includes('Detailed Marks') || d.title.includes('DMC'))))
  );

  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const htmlContent = generateDmcHtml(student, results, term || results[0]?.term);
  const timestamp = Date.now();
  const fileName = `dmc_${sid}_${timestamp}.html`;
  const filePathOnDisk = path.join(uploadsDir, fileName);

  fs.writeFileSync(filePathOnDisk, htmlContent, 'utf8');
  const filePath = `/uploads/${fileName}`;
  const fileSizeFormatted = `${Math.max(5, Math.round(htmlContent.length / 1024))} KB`;

  if (existingDmc) {
    existingDmc.file_path = filePath;
    existingDmc.file_size_formatted = fileSizeFormatted;
    existingDmc.updated_at = new Date().toISOString();
    return existingDmc;
  }

  const newDmc = {
    id: timestamp,
    student_id: sid,
    student_name: student.full_name || 'Student',
    roll_number: student.roll_number || '',
    class_name: student.class_name || 'Class',
    title: `Detailed Marks Certificate (DMC) - ${student.full_name || 'Student'}`,
    category: 'Detailed Marks Certificate',
    file_path: filePath,
    file_size_formatted: fileSizeFormatted,
    file_type: 'text/html',
    uploaded_at: new Date().toISOString().slice(0, 10),
    term: term || results[0]?.term || 'Term 1 (2025-26)'
  };

  store.student_documents.unshift(newDmc);

  const hasResultDocDmc = store.result_documents.some(d => String(d.student_id) === String(sid) && (d.title && d.title.includes('DMC')));
  if (!hasResultDocDmc) {
    store.result_documents.unshift({
      ...newDmc,
      id: timestamp + 1
    });
  }

  saveStore();
  return newDmc;
}


// Get all results (Admin) or for specific student/term
async function getResults(req, res) {
  try {
    const { student_id, term, class_id } = req.query;

    if (isMySQLConnected()) {
      let sql = `
        SELECT r.*, s.full_name as student_name, s.roll_number, c.name as class_name
        FROM results r
        JOIN students s ON r.student_id = s.id
        JOIN classes c ON r.class_id = c.id
        WHERE 1=1
      `;
      const params = [];
      if (student_id) {
        sql += ' AND r.student_id = ?';
        params.push(student_id);
      }
      if (term) {
        sql += ' AND r.term = ?';
        params.push(term);
      }
      if (class_id) {
        sql += ' AND r.class_id = ?';
        params.push(class_id);
      }
      sql += ' ORDER BY r.term DESC, r.id ASC';

      const results = await query(sql, params);

      let dmcDoc = null;
      let attachedDocs = [];

      if (student_id) {
        const dmcRows = await query(
          `SELECT * FROM student_documents WHERE student_id = ? AND (category = 'Detailed Marks Certificate' OR title LIKE '%DMC%' OR title LIKE '%Detailed Marks%') ORDER BY id DESC LIMIT 1`,
          [student_id]
        );
        if (dmcRows && dmcRows.length > 0) dmcDoc = dmcRows[0];

        const attRows = await query(
          `SELECT * FROM result_documents WHERE student_id = ? ORDER BY id DESC`,
          [student_id]
        );
        if (attRows) attachedDocs = attRows;
      }

      return res.json({
        success: true,
        count: results.length,
        results,
        dmc_document: dmcDoc,
        attached_documents: attachedDocs
      });
    }

    const store = getFallbackStore();
    let results = [...(store.results || [])];
    if (student_id) {
      results = results.filter(r => String(r.student_id) === String(student_id));
    }
    if (term) {
      results = results.filter(r => r.term === term);
    }
    if (class_id) {
      results = results.filter(r => String(r.class_id) === String(class_id));
    }

    // Attach student name and class name
    results = results.map(r => {
      const student = (store.students || []).find(s => String(s.id) === String(r.student_id));
      return {
        ...r,
        student_name: r.student_name || student?.full_name || 'Student',
        roll_number: r.roll_number || student?.roll_number || '',
        class_name: r.class_name || student?.class_name || 'Grade 5'
      };
    });

    let dmcDoc = null;
    let attachedDocs = [];

    if (student_id) {
      const stu = (store.students || []).find(s => String(s.id) === String(student_id));
      if (stu && results.length > 0) {
        dmcDoc = ensureStudentDmc(store, stu, results, term);
      } else {
        dmcDoc = (store.student_documents || []).find(d => 
          String(d.student_id) === String(student_id) &&
          (d.category === 'Detailed Marks Certificate' || d.category === 'DMC' || (d.title && (d.title.includes('Detailed Marks') || d.title.includes('DMC'))))
        ) || null;
      }

      // Find all attached documents for this student
      attachedDocs = (store.result_documents || []).filter(d => String(d.student_id) === String(student_id));
    }

    return res.json({
      success: true,
      count: results.length,
      results,
      dmc_document: dmcDoc,
      attached_documents: attachedDocs
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Get student results package (Subjects, Overall Summary, Uploaded PDF document)
async function getStudentResultsPackage(req, res) {
  try {
    const studentId = req.params.id || 1;
    const term = req.query.term || 'Term 1 (2025-26)';

    let subjects = [];
    let document = null;

    if (isMySQLConnected()) {
      subjects = await query(
        `SELECT subject, marks, total_marks, grade, overall_performance, result_date
         FROM results
         WHERE student_id = ? AND term = ?
         ORDER BY id ASC`,
        [studentId, term]
      );

      const docs = await query(
        `SELECT id, term, title, file_path, file_size_formatted, file_type, uploaded_at
         FROM result_documents
         WHERE student_id = ? AND term = ?
         ORDER BY id DESC LIMIT 1`,
        [studentId, term]
      );
      if (docs && docs.length > 0) document = docs[0];
    } else {
      const store = getFallbackStore();
      subjects = (store.results || []).filter(r => String(r.student_id) === String(studentId) && r.term === term);
      const docs = (store.result_documents || []).filter(d => String(d.student_id) === String(studentId) && d.term === term);
      if (docs && docs.length > 0) document = docs[0];
    }

    // Calculate overall summary
    let totalMarksObtained = 0;
    let maxMarks = 0;
    subjects.forEach(s => {
      totalMarksObtained += parseFloat(s.marks);
      maxMarks += parseFloat(s.total_marks || 100);
    });

    const percentage = maxMarks > 0 ? Math.round((totalMarksObtained / maxMarks) * 100) : 88;
    let overallGrade = 'A+';
    if (percentage < 50) overallGrade = 'F';
    else if (percentage < 60) overallGrade = 'C';
    else if (percentage < 70) overallGrade = 'B';
    else if (percentage < 80) overallGrade = 'B+';
    else if (percentage < 90) overallGrade = 'A';

    return res.json({
      success: true,
      term,
      studentId,
      performanceSummary: {
        percentage,
        overallGrade,
        performanceLevel: percentage >= 85 ? 'Excellent' : percentage >= 70 ? 'Good' : 'Needs Improvement',
        totalSubjects: subjects.length,
        totalMarksObtained,
        maxMarks
      },
      subjects,
      uploadedDocument: document || null
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Add/Create subject results in batch (or single) + optional file upload (Admin)
async function createResult(req, res) {
  try {
    let { student_id, class_id, term, subjects, subject, marks, total_marks = 100, grade, overall_performance, result_date, document_title } = req.body;
    const dateVal = result_date || new Date().toISOString().slice(0, 10);
    const termVal = term || 'Term 1 (2025-26)';
    const sid = parseInt(student_id || 1, 10);
    const cid = parseInt(class_id || 1, 10);

    // If subjects was passed as JSON string (from FormData)
    if (typeof subjects === 'string') {
      try {
        subjects = JSON.parse(subjects);
      } catch (e) {
        subjects = [];
      }
    }

    // Build the list of subjects to record
    let subjectList = [];
    if (Array.isArray(subjects) && subjects.length > 0) {
      subjectList = subjects.filter(s => s && s.subject && s.marks !== undefined && s.marks !== '');
    } else if (subject && marks !== undefined && marks !== '') {
      subjectList = [{ subject, marks, total_marks, grade, overall_performance }];
    }

    const fileObj = req.file || (req.files && req.files[0]);

    if (subjectList.length === 0 && !fileObj) {
      return res.status(400).json({ success: false, message: 'Please provide subject marks or attach a result document.' });
    }

    const calcGrade = (m, tm) => {
      const num = parseFloat(m);
      const total = parseFloat(tm) || 100;
      const pct = total > 0 ? (num / total) * 100 : num;
      if (pct >= 90) return 'A+';
      if (pct >= 80) return 'A';
      if (pct >= 70) return 'B+';
      if (pct >= 60) return 'B';
      if (pct >= 50) return 'C';
      return 'F';
    };

    // Calculate grades and overall performance
    let totalObt = 0;
    let totalMax = 0;
    subjectList.forEach(s => {
      const numM = parseFloat(s.marks);
      const numT = parseFloat(s.total_marks || 100);
      totalObt += isNaN(numM) ? 0 : numM;
      totalMax += isNaN(numT) ? 100 : numT;
      if (!s.grade) {
        s.grade = calcGrade(numM, numT);
      }
    });

    const overallPct = totalMax > 0 ? (totalObt / totalMax) * 100 : 80;
    const computedOverall = overallPct >= 85 ? 'Excellent' : overallPct >= 70 ? 'Very Good' : overallPct >= 50 ? 'Good' : 'Needs Improvement';
    const finalOverallPerf = overall_performance || computedOverall;

    // Handle attached document if provided
    let savedDocument = null;
    if (fileObj) {
      const bytes = fileObj.size || 0;
      const fileSizeFormatted = bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      const filePath = `/uploads/${fileObj.filename}`;
      const docTitle = document_title || fileObj.originalname;

      savedDocument = {
        title: docTitle,
        file_path: filePath,
        file_size_formatted: fileSizeFormatted,
        file_type: fileObj.mimetype || 'application/pdf',
        term: termVal
      };
    }

    // Check Pass / Fail status
    const hasFailedSubject = subjectList.some(s => s.grade === 'F' || (s.marks !== undefined && s.total_marks && (parseFloat(s.marks) / parseFloat(s.total_marks)) * 100 < 33));
    const isPassed = overallPct >= 40 && !hasFailedSubject;
    const computedGrade = overallPct >= 90 ? 'A+' : overallPct >= 80 ? 'A' : overallPct >= 70 ? 'B+' : overallPct >= 60 ? 'B' : overallPct >= 50 ? 'C' : 'F';
    const shouldAutoPromote = req.body.auto_promote !== false && req.body.auto_promote !== 'false';

    let promotionInfo = {
      is_passed: isPassed,
      status: isPassed ? 'PROMOTED' : 'RETAINED',
      percentage: Math.round(overallPct),
      grade: computedGrade
    };

    if (isMySQLConnected()) {
      for (const s of subjectList) {
        await query(
          `INSERT INTO results (student_id, class_id, term, subject, marks, total_marks, grade, overall_performance, result_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [sid, cid, termVal, s.subject, parseFloat(s.marks), parseFloat(s.total_marks || 100), s.grade, finalOverallPerf, dateVal]
        );
      }

      if (savedDocument) {
        const docInsert = await query(
          `INSERT INTO result_documents (student_id, term, title, file_path, file_size_formatted, file_type)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [sid, termVal, savedDocument.title, savedDocument.file_path, savedDocument.file_size_formatted, savedDocument.file_type]
        );
        savedDocument.id = docInsert.insertId;
      }

      // Fetch student, current class, and parent contact
      const studentRows = await query(
        `SELECT s.id, s.full_name, s.roll_number, s.class_id, c.name as class_name, 
                p.id as parent_id, p.user_id as parent_user_id, u.full_name as parent_name, u.phone as parent_phone
         FROM students s 
         LEFT JOIN classes c ON s.class_id = c.id
         LEFT JOIN parents p ON s.parent_id = p.id
         LEFT JOIN users u ON p.user_id = u.id
         WHERE s.id = ?`,
        [sid]
      );

      const stuRow = studentRows && studentRows[0];
      const studentName = stuRow?.full_name || 'Student';
      const studentRoll = stuRow?.roll_number || 'N/A';
      const currentClassName = stuRow?.class_name || 'Current Class';
      const parentUserId = stuRow?.parent_user_id || 2;
      const parentPhone = stuRow?.parent_phone || '03001234567';
      const parentName = stuRow?.parent_name || 'Parent';

      const allClasses = await query('SELECT * FROM classes ORDER BY id ASC');
      let newClassName = currentClassName;

      if (shouldAutoPromote) {
        if (isPassed) {
          const nextCls = getNextClass(stuRow?.class_id, currentClassName, allClasses);
          if (nextCls) {
            newClassName = nextCls.name;
            await query('UPDATE students SET class_id = ? WHERE id = ?', [nextCls.id, sid]);
            promotionInfo.new_class_id = nextCls.id;
            promotionInfo.new_class_name = nextCls.name;
          }
        }
      }

      // Web in-app Notification
      const notifTitle = isPassed ? '🎉 Mubarak! Student Promoted to Next Class' : '⚠️ Exam Result: Retained in Same Class';
      const notifMsg = isPassed
        ? `Mubarak ho! ${studentName} ne ${termVal} pass kar liya hai (${Math.round(overallPct)}% • Grade ${computedGrade}) aur agli class "${newClassName}" me promote ho gaye hain!`
        : `Afsoos, ${studentName} ${termVal} me pass nahi ho sake (${Math.round(overallPct)}% • Grade F). School policy ke mutabiq bacha isi class "${currentClassName}" me repeat karega.`;

      await query(
        `INSERT INTO notifications (user_id, title, message, type, action_url)
         VALUES (?, ?, ?, ?, '/parent/results')`,
        [parentUserId, notifTitle, notifMsg, isPassed ? 'Promotion' : 'Result']
      );

      // Automated WhatsApp & SMS alert
      try {
        await whatsappService.sendExamResultAlert({
          studentName,
          rollNumber: studentRoll,
          currentClassName,
          newClassName,
          isPassed,
          percentage: Math.round(overallPct),
          term: termVal,
          overallGrade: computedGrade,
          parentPhone,
          parentName
        });
      } catch (waErr) {
        console.warn('[WhatsApp Alert Error]:', waErr.message);
      }

      return res.status(201).json({
        success: true,
        message: `Results recorded. ${isPassed ? `Student PROMOTED to ${newClassName}!` : `Student FAILED and RETAINED in ${currentClassName}.`} Web & WhatsApp alerts sent.`,
        subjectsCount: subjectList.length,
        document: savedDocument,
        promotion: promotionInfo
      });
    }

    const store = getFallbackStore();
    store.results = store.results || [];
    store.result_documents = store.result_documents || [];
    store.notifications = store.notifications || [];

    const stu = (store.students || []).find(s => s.id === sid);
    const studentName = stu?.full_name || 'Student';
    const studentRoll = stu?.roll_number || 'N/A';
    const currentClassName = stu?.class_name || 'Grade 5';
    const parentUserId = stu?.parent_user_id || 2;
    const parentPhone = stu?.parent_phone || '03001234567';
    const parentName = stu?.parent_name || 'Parent';
    const baseTime = Date.now();

    subjectList.forEach((s, idx) => {
      store.results.push({
        id: baseTime + idx,
        student_id: sid,
        class_id: cid,
        term: termVal,
        subject: s.subject,
        marks: parseFloat(s.marks),
        total_marks: parseFloat(s.total_marks || 100),
        grade: s.grade,
        overall_performance: finalOverallPerf,
        result_date: dateVal
      });
    });

    if (savedDocument) {
      savedDocument.id = baseTime + 1000;
      savedDocument.student_id = sid;
      savedDocument.student_name = studentName;
      savedDocument.class_name = stu?.class_name || 'Grade 5';
      savedDocument.uploaded_at = new Date().toISOString();
      store.result_documents.unshift(savedDocument);
    }

    let newClassName = currentClassName;
    if (shouldAutoPromote && stu) {
      if (isPassed) {
        const nextCls = getNextClass(stu.class_id, currentClassName, store.classes || []);
        if (nextCls) {
          stu.class_id = nextCls.id;
          stu.class_name = nextCls.name;
          newClassName = nextCls.name;
          promotionInfo.new_class_id = nextCls.id;
          promotionInfo.new_class_name = nextCls.name;
        }
      }
    }

    // In-App Web Notification
    const notifTitle = isPassed ? '🎉 Mubarak! Student Promoted to Next Class' : '⚠️ Exam Result: Retained in Same Class';
    const notifMsg = isPassed
      ? `Mubarak ho! ${studentName} ne ${termVal} pass kar liya hai (${Math.round(overallPct)}% • Grade ${computedGrade}) aur agli class "${newClassName}" me promote ho gaye hain!`
      : `Afsoos, ${studentName} ${termVal} me pass nahi ho sake (${Math.round(overallPct)}% • Grade F). School policy ke mutabiq bacha isi class "${currentClassName}" me repeat karega.`;

    store.notifications.unshift({
      id: baseTime + 2000,
      user_id: parentUserId,
      title: notifTitle,
      message: notifMsg,
      type: isPassed ? 'Promotion' : 'Result',
      is_read: 0,
      action_url: '/parent/results',
      created_at: new Date().toISOString()
    });

    saveStore();

    // Automated WhatsApp & SMS alert
    try {
      await whatsappService.sendExamResultAlert({
        studentName,
        rollNumber: studentRoll,
        currentClassName,
        newClassName,
        isPassed,
        percentage: Math.round(overallPct),
        term: termVal,
        overallGrade: computedGrade,
        parentPhone,
        parentName
      });
    } catch (waErr) {
      console.warn('[WhatsApp Alert Error]:', waErr.message);
    }

    return res.status(201).json({
      success: true,
      message: `Results recorded. ${isPassed ? `Student PROMOTED to ${newClassName}!` : `Student FAILED and RETAINED in ${currentClassName}.`} Web & WhatsApp alerts sent.`,
      subjectsCount: subjectList.length,
      document: savedDocument,
      promotion: promotionInfo
    });
  } catch (err) {
    console.error('createResult error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Get all uploaded result documents
async function getResultDocuments(req, res) {
  try {
    const { student_id, term } = req.query;

    if (isMySQLConnected()) {
      let sql = `
        SELECT rd.*, s.full_name as student_name, s.roll_number, c.name as class_name
        FROM result_documents rd
        JOIN students s ON rd.student_id = s.id
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE 1=1
      `;
      const params = [];
      if (student_id) {
        sql += ' AND rd.student_id = ?';
        params.push(student_id);
      }
      if (term) {
        sql += ' AND rd.term = ?';
        params.push(term);
      }
      sql += ' ORDER BY rd.id DESC';

      const docs = await query(sql, params);
      return res.json({ success: true, count: docs.length, documents: docs });
    }

    const store = getFallbackStore();
    let docs = [...(store.result_documents || [])];
    if (student_id) {
      docs = docs.filter(d => String(d.student_id) === String(student_id));
    }
    if (term) {
      docs = docs.filter(d => d.term === term);
    }

    docs = docs.map(d => {
      const stu = (store.students || []).find(s => s.id === d.student_id);
      return {
        ...d,
        student_name: d.student_name || stu?.full_name || 'Student',
        roll_number: d.roll_number || stu?.roll_number || '',
        class_name: d.class_name || stu?.class_name || 'Grade 5'
      };
    });

    return res.json({ success: true, count: docs.length, documents: docs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Upload result document / PDF sheet
async function uploadResultDocument(req, res) {
  try {
    const { student_id, term, title } = req.body;
    const fileObj = req.file || (req.files && req.files[0]);
    if (!fileObj) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    // Format human-friendly file size
    const bytes = fileObj.size || 0;
    let fileSizeFormatted = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes < 1024 * 1024) {
      fileSizeFormatted = `${Math.round(bytes / 1024)} KB`;
    }

    const filePath = `/uploads/${fileObj.filename}`;
    const docTitle = title || fileObj.originalname;
    const termVal = term || 'Term 1 (2025-26)';
    const sid = student_id ? parseInt(student_id, 10) : 1;

    let studentName = 'Student';
    let className = 'Grade 5';
    let parentUserId = 2;

    if (isMySQLConnected()) {
      const stuInfo = await query(
        `SELECT s.full_name, c.name as class_name, p.user_id as parent_user_id
         FROM students s
         LEFT JOIN classes c ON s.class_id = c.id
         LEFT JOIN parents p ON s.parent_id = p.id
         WHERE s.id = ?`,
        [sid]
      );
      if (stuInfo && stuInfo[0]) {
        studentName = stuInfo[0].full_name;
        className = stuInfo[0].class_name || className;
        parentUserId = stuInfo[0].parent_user_id || parentUserId;
      }

      const insertResult = await query(
        `INSERT INTO result_documents (student_id, term, title, file_path, file_size_formatted, file_type)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [sid, termVal, docTitle, filePath, fileSizeFormatted, fileObj.mimetype || 'application/pdf']
      );

      // Notify parent
      await query(
        `INSERT INTO notifications (user_id, title, message, type, action_url)
         VALUES (?, 'New Result Sheet Uploaded', ?, 'Result', '/parent/results')`,
        [parentUserId, `Official result sheet "${docTitle}" for ${studentName} (${termVal}) is now available.`]
      );

      return res.json({
        success: true,
        message: 'Result sheet uploaded successfully.',
        document: {
          id: insertResult.insertId,
          student_id: sid,
          student_name: studentName,
          class_name: className,
          title: docTitle,
          file_path: filePath,
          file_size_formatted: fileSizeFormatted,
          term: termVal
        }
      });
    }

    const store = getFallbackStore();
    store.result_documents = store.result_documents || [];
    store.notifications = store.notifications || [];

    const stu = (store.students || []).find(s => s.id === sid);
    if (stu) {
      studentName = stu.full_name || studentName;
      className = stu.class_name || className;
      parentUserId = stu.parent_user_id || parentUserId;
    }

    const newDoc = {
      id: Date.now(),
      student_id: sid,
      student_name: studentName,
      class_name: className,
      term: termVal,
      title: docTitle,
      file_path: filePath,
      file_size_formatted: fileSizeFormatted,
      file_type: fileObj.mimetype || 'application/pdf',
      uploaded_at: new Date().toISOString().slice(0, 10)
    };

    store.result_documents.unshift(newDoc);

    store.notifications.unshift({
      id: Date.now() + 1,
      user_id: parentUserId,
      title: 'New Result Sheet Uploaded',
      message: `Official result sheet "${docTitle}" for ${studentName} (${termVal}) has been published.`,
      type: 'Result',
      is_read: 0,
      action_url: '/parent/results',
      created_at: new Date().toISOString()
    });

    saveStore();

    return res.json({
      success: true,
      message: 'Result sheet uploaded successfully.',
      document: newDoc
    });
  } catch (err) {
    console.error('[Upload Document Error]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Stream/Download result document
async function downloadResultDocument(req, res) {
  try {
    const { id } = req.params;
    let doc = null;

    if (isMySQLConnected()) {
      const rows = await query('SELECT * FROM result_documents WHERE id = ?', [id]);
      if (rows && rows.length > 0) doc = rows[0];
    } else {
      const store = getFallbackStore();
      doc = (store.result_documents || []).find(d => String(d.id) === String(id));
    }

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document record not found.' });
    }

    const fileName = path.basename(doc.file_path);
    const filePathOnDisk = path.join(__dirname, '..', 'uploads', fileName);

    if (!fs.existsSync(filePathOnDisk)) {
      return res.status(404).json({ success: false, message: 'Physical file not found on server.' });
    }

    const ext = path.extname(fileName).toLowerCase();
    let contentType = doc.file_type || 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.webp') contentType = 'image/webp';

    const isDownload = req.query.download === '1' || req.query.download === 'true';
    const dispositionType = isDownload ? 'attachment' : 'inline';
    let originalTitle = doc.title || fileName;
    if (!path.extname(originalTitle) && ext) {
      originalTitle = `${originalTitle}${ext}`;
    }

    res.setHeader('Content-Type', contentType);
    if (isDownload) {
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalTitle)}"`);
    } else {
      res.setHeader('Content-Disposition', 'inline');
    }
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    return res.sendFile(filePathOnDisk);
  } catch (err) {
    console.error('[Download Document Error]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Delete result document
async function deleteResultDocument(req, res) {
  try {
    const { id } = req.params;

    if (isMySQLConnected()) {
      const existing = await query('SELECT file_path FROM result_documents WHERE id = ?', [id]);
      if (existing && existing[0]?.file_path) {
        const fileName = path.basename(existing[0].file_path);
        const filePathOnDisk = path.join(__dirname, '..', 'uploads', fileName);
        if (fs.existsSync(filePathOnDisk)) {
          try { fs.unlinkSync(filePathOnDisk); } catch (_) {}
        }
      }
      await query('DELETE FROM result_documents WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Result document deleted successfully.' });
    }

    const store = getFallbackStore();
    store.result_documents = store.result_documents || [];
    const index = store.result_documents.findIndex(d => String(d.id) === String(id));
    if (index !== -1) {
      const doc = store.result_documents[index];
      if (doc?.file_path) {
        const fileName = path.basename(doc.file_path);
        const filePathOnDisk = path.join(__dirname, '..', 'uploads', fileName);
        if (fs.existsSync(filePathOnDisk)) {
          try { fs.unlinkSync(filePathOnDisk); } catch (_) {}
        }
      }
      store.result_documents.splice(index, 1);
      saveStore();
    }

    return res.json({ success: true, message: 'Result document deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Return JSON base64 data for safe in-browser result preview without IDM download hijacking
async function getResultDocumentPreview(req, res) {
  try {
    const { id } = req.params;
    let doc = null;

    if (isMySQLConnected()) {
      const rows = await query('SELECT * FROM result_documents WHERE id = ?', [id]);
      if (rows && rows.length > 0) doc = rows[0];
    } else {
      const store = getFallbackStore();
      doc = (store.result_documents || []).find(d => String(d.id) === String(id));
    }

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Result document not found.' });
    }

    const fileName = path.basename(doc.file_path);
    const filePathOnDisk = path.join(__dirname, '..', 'uploads', fileName);

    if (!fs.existsSync(filePathOnDisk)) {
      return res.status(404).json({ success: false, message: 'Physical file not found on server.' });
    }

    const ext = path.extname(fileName).toLowerCase();
    let contentType = doc.file_type || 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.webp') contentType = 'image/webp';

    const fileBuffer = fs.readFileSync(filePathOnDisk);
    const base64Data = fileBuffer.toString('base64');

    return res.json({
      success: true,
      id: doc.id,
      title: doc.title,
      fileName,
      contentType,
      fileSize: fileBuffer.length,
      base64: base64Data
    });
  } catch (err) {
    console.error('[Preview Document Error]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Bulk / On-demand promotion processing for a class, term, or student
async function processPromotion(req, res) {
  try {
    const { term = 'Term 1 (2025-26)', class_id, student_id, passing_percentage = 40 } = req.body;
    const minPassPct = parseFloat(passing_percentage) || 40;

    let targetStudents = [];
    let allClasses = [];

    if (isMySQLConnected()) {
      let stuSql = `
        SELECT s.id, s.full_name, s.roll_number, s.class_id, c.name as class_name,
               p.id as parent_id, p.user_id as parent_user_id, u.full_name as parent_name, u.phone as parent_phone
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN parents p ON s.parent_id = p.id
        LEFT JOIN users u ON p.user_id = u.id
        WHERE s.status = 'Active'
      `;
      const params = [];
      if (student_id) {
        stuSql += ' AND s.id = ?';
        params.push(student_id);
      }
      if (class_id) {
        stuSql += ' AND s.class_id = ?';
        params.push(class_id);
      }
      targetStudents = await query(stuSql, params);
      allClasses = await query('SELECT * FROM classes ORDER BY id ASC');
    } else {
      const store = getFallbackStore();
      targetStudents = (store.students || []).filter(s => {
        if (student_id && String(s.id) !== String(student_id)) return false;
        if (class_id && String(s.class_id) !== String(class_id)) return false;
        return true;
      });
      allClasses = store.classes || [];
    }

    if (targetStudents.length === 0) {
      return res.status(404).json({ success: false, message: 'No students found matching criteria.' });
    }

    const processedList = [];
    let promotedCount = 0;
    let retainedCount = 0;

    for (const stu of targetStudents) {
      const sid = stu.id;
      let subjects = [];

      if (isMySQLConnected()) {
        subjects = await query('SELECT * FROM results WHERE student_id = ? AND term = ?', [sid, term]);
      } else {
        const store = getFallbackStore();
        subjects = (store.results || []).filter(r => String(r.student_id) === String(sid) && r.term === term);
      }

      let totalObt = 0;
      let totalMax = 0;
      let hasFailedSubject = false;

      if (subjects.length > 0) {
        subjects.forEach(s => {
          const m = parseFloat(s.marks) || 0;
          const tm = parseFloat(s.total_marks) || 100;
          totalObt += m;
          totalMax += tm;
          if (s.grade === 'F' || (tm > 0 && (m / tm) * 100 < 33)) {
            hasFailedSubject = true;
          }
        });
      }

      const pct = totalMax > 0 ? (totalObt / totalMax) * 100 : (subjects.length > 0 ? 0 : 75);
      const isPassed = (subjects.length > 0 ? (pct >= minPassPct && !hasFailedSubject) : true);
      const computedGrade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : 'F';
      const currentClassName = stu.class_name || 'Class';
      let newClassName = currentClassName;

      if (isPassed) {
        const nextCls = getNextClass(stu.class_id, currentClassName, allClasses);
        if (nextCls) {
          newClassName = nextCls.name;
          if (isMySQLConnected()) {
            await query('UPDATE students SET class_id = ? WHERE id = ?', [nextCls.id, sid]);
          } else {
            stu.class_id = nextCls.id;
            stu.class_name = nextCls.name;
          }
          promotedCount++;
        }
      } else {
        retainedCount++;
      }

      // Notifications: In-app
      const parentUserId = stu.parent_user_id || 2;
      const notifTitle = isPassed ? '🎉 Mubarak! Student Promoted to Next Class' : '⚠️ Exam Result: Retained in Same Class';
      const notifMsg = isPassed
        ? `Mubarak ho! ${stu.full_name} ne ${term} pass kar liya hai (${Math.round(pct)}% • Grade ${computedGrade}) aur agli class "${newClassName}" me promote ho gaye hain!`
        : `Afsoos, ${stu.full_name} ${term} me pass nahi ho sake (${Math.round(pct)}% • Grade F). School policy ke mutabiq bacha isi class "${currentClassName}" me repeat karega.`;

      if (isMySQLConnected()) {
        await query(
          `INSERT INTO notifications (user_id, title, message, type, action_url)
           VALUES (?, ?, ?, ?, '/parent/results')`,
          [parentUserId, notifTitle, notifMsg, isPassed ? 'Promotion' : 'Result']
        );
      } else {
        const store = getFallbackStore();
        store.notifications = store.notifications || [];
        store.notifications.unshift({
          id: Date.now() + Math.floor(Math.random() * 10000),
          user_id: parentUserId,
          title: notifTitle,
          message: notifMsg,
          type: isPassed ? 'Promotion' : 'Result',
          is_read: 0,
          action_url: '/parent/results',
          created_at: new Date().toISOString()
        });
      }

      // WhatsApp & SMS
      try {
        await whatsappService.sendExamResultAlert({
          studentName: stu.full_name,
          rollNumber: stu.roll_number || 'N/A',
          currentClassName,
          newClassName,
          isPassed,
          percentage: Math.round(pct),
          term,
          overallGrade: computedGrade,
          parentPhone: stu.parent_phone || '03001234567',
          parentName: stu.parent_name || 'Parent'
        });
      } catch (waErr) {
        console.warn('[WhatsApp Alert Error]:', waErr.message);
      }

      processedList.push({
        student_id: sid,
        student_name: stu.full_name,
        roll_number: stu.roll_number,
        previous_class: currentClassName,
        new_class: newClassName,
        is_passed: isPassed,
        percentage: Math.round(pct),
        grade: computedGrade,
        status: isPassed ? 'PROMOTED' : 'RETAINED'
      });
    }

    if (!isMySQLConnected()) saveStore();

    return res.json({
      success: true,
      message: `Processed ${processedList.length} students: ${promotedCount} Promoted to next class, ${retainedCount} Retained. Web & WhatsApp alerts sent!`,
      evaluated_count: processedList.length,
      promoted_count: promotedCount,
      retained_count: retainedCount,
      results: processedList
    });
  } catch (err) {
    console.error('[Process Promotion Error]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getResults,
  getResultDocuments,
  getStudentResultsPackage,
  createResult,
  uploadResultDocument,
  downloadResultDocument,
  getResultDocumentPreview,
  deleteResultDocument,
  processPromotion
};
