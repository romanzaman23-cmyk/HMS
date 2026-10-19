const fs = require('fs');
const path = require('path');
const { query, isMySQLConnected, getFallbackStore, saveStore } = require('../config/db');

// Get student documents
async function getDocuments(req, res) {
  try {
    const isParent = req.user.role === 'PARENT';
    const { student_id } = req.query;

    if (isMySQLConnected()) {
      let sql = `
        SELECT sd.*, s.full_name as student_name, s.roll_number, u.full_name as uploaded_by_name
        FROM student_documents sd
        JOIN students s ON sd.student_id = s.id
        LEFT JOIN users u ON sd.uploaded_by = u.id
      `;
      const params = [];
      if (isParent) {
        sql += ' WHERE s.parent_user_id = ?';
        params.push(req.user.id);
      } else if (student_id) {
        sql += ' WHERE sd.student_id = ?';
        params.push(student_id);
      }
      sql += ' ORDER BY sd.uploaded_at DESC';

      const docs = await query(sql, params);
      return res.json({ success: true, count: docs.length, documents: docs });
    }

    const store = getFallbackStore();
    let docs = [...(store.student_documents || [])];
    if (isParent) {
      const myStudents = (store.students || []).filter(s => s.parent_user_id === req.user.id);
      const studentIds = myStudents.map(s => s.id);
      if (studentIds.length > 0) {
        docs = docs.filter(d => studentIds.includes(d.student_id));
      } else {
        docs = docs.filter(d => d.student_id === 1);
      }
    } else if (student_id) {
      docs = docs.filter(d => String(d.student_id) === String(student_id));
    }

    // Enrich with student details
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

// Upload academic/performance document (Admin)
async function uploadDocument(req, res) {
  try {
    const { student_id, title, category } = req.body || {};
    const fileObj = req.file || (req.files && req.files[0]);
    if (!fileObj) {
      return res.status(400).json({ success: false, message: 'Please select a file to upload.' });
    }

    const sid = parseInt(student_id, 10) || 1;
    const docTitle = (title && title.trim()) || fileObj.originalname;
    const filePath = `/uploads/${fileObj.filename}`;
    const bytes = fileObj.size || 0;
    let fileSizeFormatted = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes < 1024 * 1024) {
      fileSizeFormatted = `${Math.round(bytes / 1024)} KB`;
    }
    const uploadedBy = req.user.id;

    if (isMySQLConnected()) {
      const insertResult = await query(
        `INSERT INTO student_documents (student_id, title, category, file_path, file_size_formatted, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [sid, docTitle, category, filePath, fileSizeFormatted, uploadedBy]
      );

      // Notify parent
      const parents = await query(
        'SELECT p.user_id FROM students s JOIN parents p ON s.parent_id = p.id WHERE s.id = ?',
        [sid]
      );
      if (parents && parents[0]) {
        await query(
          `INSERT INTO notifications (user_id, title, message, type, action_url)
           VALUES (?, 'New Document Uploaded', ?, 'Document', '/parent/documents')`,
          [parents[0].user_id, `A new document (${docTitle}) has been uploaded for your child.`]
        );
      }

      return res.status(201).json({
        success: true,
        message: 'Document uploaded successfully.',
        document: {
          id: insertResult.insertId,
          student_id: sid,
          title: docTitle,
          category,
          file_path: filePath,
          file_size_formatted: fileSizeFormatted
        }
      });
    }

    const store = getFallbackStore();
    store.student_documents = store.student_documents || [];
    store.notifications = store.notifications || [];

    const stu = (store.students || []).find(s => s.id === sid);
    const parentUserId = stu?.parent_user_id || 2;
    const studentName = stu?.full_name || 'Student';

    const newDoc = {
      id: Date.now(),
      student_id: sid,
      student_name: studentName,
      class_name: stu?.class_name || 'Grade 5',
      title: docTitle,
      category,
      file_path: filePath,
      file_size_formatted: fileSizeFormatted,
      file_type: fileObj.mimetype || 'application/pdf',
      uploaded_by: uploadedBy,
      uploaded_at: new Date().toISOString().slice(0, 10)
    };
    store.student_documents.unshift(newDoc);

    store.notifications.unshift({
      id: Date.now() + 1,
      user_id: parentUserId,
      title: 'New Document Uploaded',
      message: `A new document "${docTitle}" has been uploaded for ${studentName}.`,
      type: 'Document',
      is_read: 0,
      action_url: '/parent/documents',
      created_at: new Date().toISOString()
    });

    saveStore();

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully.',
      document: newDoc
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Download or view student document stream
async function downloadDocument(req, res) {
  try {
    const { id } = req.params;
    let doc = null;

    if (isMySQLConnected()) {
      const rows = await query('SELECT * FROM student_documents WHERE id = ?', [id]);
      if (rows && rows.length > 0) doc = rows[0];
    } else {
      const store = getFallbackStore();
      doc = (store.student_documents || []).find(d => String(d.id) === String(id));
    }

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const fileName = path.basename(doc.file_path);
    const filePathOnDisk = path.join(__dirname, '..', 'uploads', fileName);

    if (!fs.existsSync(filePathOnDisk)) {
      return res.status(404).json({ success: false, message: 'File not found on server disk.' });
    }

    const ext = path.extname(fileName).toLowerCase();
    let contentType = doc.file_type || 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.html' || ext === '.htm') contentType = 'text/html; charset=utf-8';
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
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Return JSON base64 data for safe in-browser preview without IDM download hijacking
async function getDocumentPreview(req, res) {
  try {
    const { id } = req.params;
    let doc = null;

    if (isMySQLConnected()) {
      const rows = await query('SELECT * FROM student_documents WHERE id = ?', [id]);
      if (rows && rows.length > 0) doc = rows[0];
    } else {
      const store = getFallbackStore();
      doc = (store.student_documents || []).find(d => String(d.id) === String(id));
    }

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const fileName = path.basename(doc.file_path);
    const filePathOnDisk = path.join(__dirname, '..', 'uploads', fileName);

    if (!fs.existsSync(filePathOnDisk)) {
      return res.status(404).json({ success: false, message: 'File not found on server disk.' });
    }

    const ext = path.extname(fileName).toLowerCase();
    let contentType = doc.file_type || 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.html' || ext === '.htm') contentType = 'text/html';
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
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Return JSON base64 data for any upload file path (e.g. results or leaves)
async function getFilePreviewByPath(req, res) {
  try {
    const filePathQuery = req.query.path;
    if (!filePathQuery) {
      return res.status(400).json({ success: false, message: 'Path is required' });
    }

    const fileName = path.basename(filePathQuery);
    const filePathOnDisk = path.join(__dirname, '..', 'uploads', fileName);

    if (!fs.existsSync(filePathOnDisk)) {
      return res.status(404).json({ success: false, message: 'File not found on server disk.' });
    }

    const ext = path.extname(fileName).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.html' || ext === '.htm') contentType = 'text/html';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.webp') contentType = 'image/webp';

    const fileBuffer = fs.readFileSync(filePathOnDisk);
    const base64Data = fileBuffer.toString('base64');

    return res.json({
      success: true,
      fileName,
      contentType,
      fileSize: fileBuffer.length,
      base64: base64Data
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Delete student document
async function deleteDocument(req, res) {
  try {
    const { id } = req.params;

    if (isMySQLConnected()) {
      const existing = await query('SELECT file_path FROM student_documents WHERE id = ?', [id]);
      if (existing && existing[0]?.file_path) {
        const fileName = path.basename(existing[0].file_path);
        const filePathOnDisk = path.join(__dirname, '..', 'uploads', fileName);
        if (fs.existsSync(filePathOnDisk)) {
          try { fs.unlinkSync(filePathOnDisk); } catch (_) {}
        }
      }
      await query('DELETE FROM student_documents WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Document deleted successfully.' });
    }

    const store = getFallbackStore();
    store.student_documents = store.student_documents || [];
    const index = store.student_documents.findIndex(d => String(d.id) === String(id));
    if (index !== -1) {
      const doc = store.student_documents[index];
      if (doc?.file_path) {
        const fileName = path.basename(doc.file_path);
        const filePathOnDisk = path.join(__dirname, '..', 'uploads', fileName);
        if (fs.existsSync(filePathOnDisk)) {
          try { fs.unlinkSync(filePathOnDisk); } catch (_) {}
        }
      }
      store.student_documents.splice(index, 1);
      saveStore();
    }

    return res.json({ success: true, message: 'Document deleted successfully.' });
  } catch (err) {
    console.error('deleteDocument error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Save generated birth certificate
async function saveGeneratedCertificate(req, res) {
  try {
    const { student_id, title, category = 'Birth Certificate', metadata = {}, custom_html, batch_documents } = req.body;

    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Support bulk batch saving
    if (Array.isArray(batch_documents) && batch_documents.length > 0) {
      const savedDocs = [];
      const store = getFallbackStore();
      store.student_documents = store.student_documents || [];

      for (const item of batch_documents) {
        const sid = parseInt(item.student_id, 10) || item.student_id;
        const cat = item.category || 'Academic Document';
        const itemTitle = item.title || `${cat} - Student ${sid}`;
        const timestamp = Date.now() + Math.floor(Math.random() * 1000);
        const prefix = cat.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const fileName = `${prefix}_${sid}_${timestamp}.html`;
        const filePathOnDisk = path.join(uploadsDir, fileName);
        const itemHtml = item.custom_html || `<!DOCTYPE html><html><body><h1>${itemTitle}</h1></body></html>`;
        
        fs.writeFileSync(filePathOnDisk, itemHtml, 'utf8');
        const filePath = `/uploads/${fileName}`;
        const fileSizeFormatted = `${Math.max(5, Math.round(itemHtml.length / 1024))} KB`;
        const uploadedBy = req.user.id;

        if (isMySQLConnected()) {
          const insertResult = await query(
            `INSERT INTO student_documents (student_id, title, category, file_path, file_size_formatted, uploaded_by)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [sid, itemTitle, cat, filePath, fileSizeFormatted, uploadedBy]
          );
          savedDocs.push({
            id: insertResult.insertId,
            student_id: sid,
            title: itemTitle,
            category: cat,
            file_path: filePath
          });
        } else {
          const stu = (store.students || []).find(s => String(s.id) === String(sid));
          const parentUserId = stu?.parent_user_id || 2;
          const studentName = item.metadata?.student_name || stu?.full_name || 'Student';

          const newDoc = {
            id: timestamp,
            student_id: sid,
            student_name: studentName,
            roll_number: item.metadata?.roll_number || stu?.roll_number || '',
            class_name: item.metadata?.class_name || stu?.class_name || 'Grade 1',
            title: itemTitle,
            category: cat,
            file_path: filePath,
            file_size_formatted: fileSizeFormatted,
            file_type: 'text/html',
            uploaded_by: uploadedBy,
            uploaded_at: new Date().toISOString().slice(0, 10)
          };
          store.student_documents.unshift(newDoc);
          savedDocs.push(newDoc);

          store.notifications = store.notifications || [];
          store.notifications.unshift({
            id: Date.now() + Math.floor(Math.random() * 1000),
            user_id: parentUserId,
            title: 'Official Document Issued',
            message: `Official ${cat} has been issued for ${studentName}. It is now available in your portal and mobile app.`,
            type: 'Document',
            is_read: 0,
            action_url: '/parent/documents',
            created_at: new Date().toISOString()
          });
        }
      }

      if (!isMySQLConnected()) saveStore();

      return res.status(201).json({
        success: true,
        message: `${savedDocs.length} documents issued and saved to records successfully.`,
        saved_count: savedDocs.length,
        documents: savedDocs
      });
    }

    if (!student_id) {
      return res.status(400).json({ success: false, message: 'Student ID is required.' });
    }

    const sid = parseInt(student_id, 10) || student_id;
    const certTitle = title || `${category} - ${metadata.student_name || 'Student'}`;
    const timestamp = Date.now();
    const prefix = (category || 'certificate').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const fileName = `${prefix}_${sid}_${timestamp}.html`;
    const photoUrl = metadata.photo_url || metadata.avatar_url || '/uploads/roman_profile.png';

    let defaultHtml = '';
    if (category.toLowerCase().includes('id card') || category.toLowerCase().includes('identity')) {
      defaultHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${certTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f1f5f9; margin: 0; padding: 40px 20px; display: flex; justify-content: center; }
    .id-card { width: 340px; background: #fff; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.12); border: 2px solid #e2e8f0; overflow: hidden; text-align: center; }
    .card-head { background: linear-gradient(135deg, #1e3a8a, #0f172a); color: #fff; padding: 20px; }
    .card-head h2 { margin: 0; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
    .card-head p { margin: 4px 0 0 0; font-size: 10px; color: #fde047; text-transform: uppercase; font-weight: bold; }
    .photo-wrap { margin-top: -35px; }
    .photo-wrap img { width: 95px; height: 110px; object-fit: cover; border-radius: 16px; border: 4px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
    .stu-name { font-size: 18px; font-weight: 800; color: #0f172a; margin: 10px 0 2px 0; }
    .stu-roll { font-size: 13px; font-weight: bold; color: #2563eb; font-family: monospace; }
    .info-list { margin: 15px 20px; text-align: left; font-size: 12px; background: #f8fafc; padding: 12px 16px; border-radius: 14px; border: 1px solid #e2e8f0; }
    .info-item { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .info-item:last-child { margin-bottom: 0; }
    .info-label { color: #64748b; font-weight: 500; }
    .info-val { color: #0f172a; font-weight: 700; }
    .card-foot { border-top: 1px dashed #cbd5e1; margin-top: 15px; padding: 12px; font-size: 10px; color: #64748b; font-weight: 600; }
  </style>
</head>
<body>
  <div class="id-card">
    <div class="card-head">
      <h2>Highlight Model School</h2>
      <p>Saraghundi Thall Hangu</p>
    </div>
    <div class="photo-wrap">
      <img src="${photoUrl}" alt="${metadata.student_name || 'Student'}" />
    </div>
    <div class="stu-name">${metadata.student_name || 'Student'}</div>
    <div class="stu-roll">Roll No: ${metadata.roll_number || 'N/A'}</div>
    <div class="info-list">
      <div class="info-item"><span class="info-label">Father:</span><span class="info-val">${metadata.parent_name || 'Guardian'}</span></div>
      <div class="info-item"><span class="info-label">Class:</span><span class="info-val">${metadata.class_name || 'Grade 1'}</span></div>
      <div class="info-item"><span class="info-label">Date of Birth:</span><span class="info-val">${metadata.dob || 'N/A'}</span></div>
      <div class="info-item"><span class="info-label">Emergency:</span><span class="info-val">${metadata.office_contact || '0301-8323146'}</span></div>
    </div>
    <div class="card-foot">Valid Academic Session 2025-2026 • Authorized Signature</div>
  </div>
</body>
</html>`;
    } else if (category.toLowerCase().includes('leaving') || category.toLowerCase().includes('slc')) {
      defaultHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${certTitle}</title>
  <style>
    body { font-family: "Times New Roman", Times, serif; background: #fff; margin: 0; padding: 25px; color: #0f172a; }
    .slc-box { border: 10px double #1e3a8a; padding: 30px; border-radius: 6px; max-width: 820px; margin: auto; position: relative; }
    .slc-head { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; }
    .school-title { font-size: 26px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; margin: 0; letter-spacing: 2px; }
    .school-loc { font-size: 12px; font-weight: bold; color: #1e3a8a; letter-spacing: 1.5px; margin-top: 4px; }
    .slc-badge { display: inline-block; background: #3b4992; color: #fff; font-size: 16px; font-weight: bold; padding: 6px 20px; border-radius: 6px; margin: 15px 0; }
    .meta-line { display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; margin-bottom: 20px; }
    .field-row { display: flex; align-items: baseline; margin-bottom: 14px; font-size: 14px; }
    .field-label { white-space: nowrap; font-weight: bold; min-width: 170px; }
    .field-fill { flex: 1; border-bottom: 2px solid #334155; padding-left: 10px; font-weight: bold; color: #1e3a8a; }
    .photo-box { position: absolute; top: 125px; right: 35px; width: 90px; height: 110px; border: 2px solid #1e3a8a; border-radius: 6px; overflow: hidden; }
    .photo-box img { width: 100%; height: 100%; object-fit: cover; }
    .foot-row { display: flex; justify-content: space-between; margin-top: 45px; text-align: center; font-size: 13px; font-weight: bold; }
    .sig-underline { width: 150px; border-bottom: 1px solid #000; margin: 0 auto 5px auto; }
  </style>
</head>
<body>
  <div class="slc-box">
    <div class="photo-box"><img src="${photoUrl}" alt="${metadata.student_name}" /></div>
    <div class="slc-head">
      <div style="font-size: 11px; font-weight: bold; color: #1e3a8a;">Reg NO: ${metadata.reg_no || '21224'}</div>
      <h1 class="school-title">Highlight Model School</h1>
      <div class="school-loc">SARAGHUNDI THALL DISTRICT HANGU</div>
      <div><span class="slc-badge">School Leaving Certificate</span></div>
    </div>
    <div class="meta-line">
      <div>File No: <u>${metadata.file_no || '0427'}</u></div>
      <div>Admn. No: <u>${metadata.admn_no || metadata.roll_number || '386'}</u></div>
      <div>Date of Issue: <u>${metadata.issue_date || new Date().toISOString().slice(0, 10)}</u></div>
    </div>
    <div class="field-row"><span class="field-label">1. Name of Student:</span><span class="field-fill">${metadata.student_name}</span></div>
    <div class="field-row"><span class="field-label">2. Father's Name:</span><span class="field-fill">${metadata.parent_name}</span></div>
    <div class="field-row"><span class="field-label">3. Date of Birth:</span><span class="field-fill">${metadata.dob} (in words: ${metadata.dob_words})</span></div>
    <div class="field-row"><span class="field-label">4. Attended School:</span><span class="field-fill">From ${metadata.attended_from || '08-05-2023'} to ${metadata.attended_to || '18-04-2026'}</span></div>
    <div class="field-row"><span class="field-label">5. Class & Attendance:</span><span class="field-fill">${metadata.class_name} (Attendance: ${metadata.attendance || '90%'})</span></div>
    <div class="field-row"><span class="field-label">6. Promoted to Class:</span><span class="field-fill">${metadata.promotion_class || 'Next Higher Grade'}</span></div>
    <div class="field-row"><span class="field-label">7. Date of Admission:</span><span class="field-fill">${metadata.date_of_admission || '05-05-2023'} (Withdrawal: ${metadata.date_of_withdrawal || '20-04-2026'})</span></div>
    <div class="field-row"><span class="field-label">8. Conduct & Progress:</span><span class="field-fill">Conduct: ${metadata.conduct || 'Good'}, Progress: ${metadata.progress || 'Excellent'}</span></div>
    <div class="foot-row">
      <div><div class="sig-underline"></div>Prepared By (Office Clerk)</div>
      <div><div class="sig-underline"></div>Checked By (Vice Principal)</div>
      <div><div class="sig-underline"></div>Principal (${metadata.principal_name || 'Principal'})</div>
    </div>
  </div>
</body>
</html>`;
    } else if (category.toLowerCase().includes('marks') || category.toLowerCase().includes('dmc')) {
      defaultHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${certTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fff; margin: 0; padding: 25px; color: #0f172a; }
    .dmc-frame { border: 8px double #064e3b; padding: 30px; border-radius: 12px; background: #f0fdf4; max-width: 820px; margin: auto; }
    .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 15px; position: relative; }
    .photo-stamp { position: absolute; right: 0; top: 0; width: 85px; height: 100px; border: 2px solid #059669; border-radius: 8px; overflow: hidden; }
    .photo-stamp img { width: 100%; height: 100%; object-fit: cover; }
    .school-name { font-size: 26px; font-weight: 900; text-transform: uppercase; color: #064e3b; margin: 0; }
    .tagline { font-size: 11px; font-weight: bold; color: #d97706; text-transform: uppercase; margin-top: 3px; }
    .dmc-title { font-size: 16px; font-weight: bold; text-transform: uppercase; background: #d1fae5; color: #064e3b; padding: 6px 20px; border-radius: 20px; display: inline-block; margin-top: 15px; border: 1px solid #a7f3d0; }
    .student-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #fff; padding: 12px; border-radius: 10px; margin: 20px 0; border: 1px solid #cbd5e1; font-size: 12px; }
    .student-grid div { font-weight: 500; color: #64748b; }
    .student-grid strong { display: block; color: #0f172a; font-size: 13px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; background: #fff; margin: 15px 0; font-size: 13px; }
    th { background: #064e3b; color: #fff; padding: 8px; border: 1px solid #047857; text-transform: uppercase; font-size: 11px; }
    td { padding: 8px; border: 1px solid #e2e8f0; text-align: center; }
    td:nth-child(2) { text-align: left; font-weight: 600; }
    .foot-sig { display: flex; justify-content: space-between; margin-top: 40px; text-align: center; font-size: 12px; font-weight: bold; }
    .sig-line { width: 140px; border-bottom: 1px solid #000; margin: 0 auto 5px auto; }
  </style>
</head>
<body>
  <div class="dmc-frame">
    <div class="header">
      <div class="photo-stamp"><img src="${photoUrl}" alt="${metadata.student_name}" /></div>
      <h1 class="school-name">Highlight Model School</h1>
      <div class="tagline">Department of Examinations • Session 2025-2026</div>
      <div><span class="dmc-title">Detailed Marks Certificate (DMC)</span></div>
    </div>
    <div class="student-grid">
      <div>Student Name:<strong>${metadata.student_name}</strong></div>
      <div>Father's Name:<strong>${metadata.parent_name}</strong></div>
      <div>Roll Number:<strong>${metadata.roll_number || 'N/A'}</strong></div>
      <div>Class:<strong>${metadata.class_name || 'Grade 1'}</strong></div>
    </div>
    <table>
      <thead><tr><th>Sr.</th><th>Subject</th><th>Max</th><th>Pass</th><th>Obtained</th><th>Grade</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>English Literature</td><td>100</td><td>40</td><td>88</td><td style="color:#059669;font-weight:bold;">A+</td></tr>
        <tr><td>2</td><td>Urdu Language</td><td>100</td><td>40</td><td>85</td><td style="color:#059669;font-weight:bold;">A+</td></tr>
        <tr><td>3</td><td>Mathematics</td><td>100</td><td>40</td><td>94</td><td style="color:#059669;font-weight:bold;">A+</td></tr>
        <tr><td>4</td><td>General Science</td><td>100</td><td>40</td><td>91</td><td style="color:#059669;font-weight:bold;">A+</td></tr>
        <tr><td>5</td><td>Social / Pak Studies</td><td>50</td><td>20</td><td>46</td><td style="color:#059669;font-weight:bold;">A+</td></tr>
        <tr><td>6</td><td>Islamiat / Religious</td><td>50</td><td>20</td><td>48</td><td style="color:#059669;font-weight:bold;">A+</td></tr>
        <tr style="background:#e2e8f0;font-weight:bold;"><td colspan="2" style="text-align:right;">Grand Total:</td><td>500</td><td>200</td><td style="color:#064e3b;font-size:15px;">452</td><td style="color:#059669;font-size:15px;">A+ (90.4%)</td></tr>
      </tbody>
    </table>
    <div style="background:#d1fae5;padding:10px 15px;border-radius:8px;font-size:12px;font-weight:bold;color:#064e3b;display:flex;justify-content:space-between;">
      <span>Result: PASS & PROMOTED</span><span>Position: 1st in Class</span><span>Dated: ${metadata.issue_date || new Date().toISOString().slice(0, 10)}</span>
    </div>
    <div class="foot-sig">
      <div><div class="sig-line"></div>Class Teacher</div>
      <div><div class="sig-line"></div>Controller Examinations</div>
      <div><div class="sig-line"></div>${metadata.principal_name || 'Principal'}</div>
    </div>
  </div>
</body>
</html>`;
    } else {
      // Birth Certificate Default
      defaultHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${certTitle}</title>
  <style>
    body { font-family: Georgia, serif; background: #fff; margin: 0; padding: 30px; color: #111; }
    .cert-frame { border: 8px double #78350f; padding: 35px; border-radius: 12px; background: #fffdfa; max-width: 800px; margin: auto; position: relative; }
    .header { text-align: center; border-bottom: 2px solid #78350f33; padding-bottom: 15px; }
    .school-name { font-size: 28px; font-weight: bold; text-transform: uppercase; color: #0f172a; margin: 0; }
    .tagline { font-size: 12px; font-weight: bold; color: #78350f; text-transform: uppercase; margin-top: 5px; }
    .cert-title { text-align: center; margin: 20px 0; font-size: 19px; font-weight: bold; text-transform: uppercase; background: #fef3c7; padding: 8px 25px; border-radius: 30px; display: inline-block; border: 1px solid #fde68a; }
    .meta-row { display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; margin-bottom: 20px; font-family: sans-serif; }
    .photo-badge { float: right; margin-left: 20px; margin-bottom: 15px; width: 95px; height: 115px; border: 2px solid #78350f; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .photo-badge img { width: 100%; height: 100%; object-fit: cover; }
    .cert-body { font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 25px; }
    .dob-box { text-align: center; background: #fffbeb; border: 1px solid #fde68a; padding: 12px; border-radius: 8px; margin: 18px 0; font-size: 20px; font-weight: bold; font-family: monospace; }
    .dob-words { font-size: 13px; font-style: italic; font-family: serif; color: #78350f; margin-top: 4px; }
    .footer-row { display: flex; justify-content: space-between; margin-top: 45px; font-family: sans-serif; text-align: center; }
    .sig-line { width: 140px; border-bottom: 1px solid #000; margin: 0 auto 5px auto; }
    @media print { body { padding: 0; } .cert-frame { border: 6px double #78350f; } }
  </style>
</head>
<body>
  <div class="cert-frame">
    <div class="header">
      <h1 class="school-name">Highlight Model School</h1>
      <div class="tagline">Better Learning | Brighter Future</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Registered & Recognized Secondary Education Institution</div>
    </div>
    <div style="text-align: center;">
      <div class="cert-title">Date of Birth & Character Certificate</div>
    </div>
    <div class="meta-row">
      <div>Ref No: <strong>${metadata.ref_no || `HMS/BC/${new Date().getFullYear()}/${metadata.roll_number || sid}`}</strong></div>
      <div>Date of Issue: <strong>${metadata.issue_date || new Date().toISOString().slice(0, 10)}</strong></div>
    </div>
    <div class="cert-body">
      <div class="photo-badge"><img src="${photoUrl}" alt="${metadata.student_name || 'Student'}" /></div>
      This is to certify that <u><strong>${metadata.student_name || 'Student'}</strong></u>, son/daughter of <u><strong>${metadata.parent_name || 'Guardian'}</strong></u>, having Roll Number <strong>${metadata.roll_number || 'N/A'}</strong>, is a bona fide regular student of this school enrolled in <strong>Class ${metadata.class_name || 'Grade 1'}</strong>.<br><br>
      According to the official admission register of Highlight Model School, the student's recorded Date of Birth is:
      <div class="dob-box">
        ${metadata.dob || 'N/A'}
        <div class="dob-words">(In Words: "${metadata.dob_words || ''}")</div>
      </div>
      To the best of our knowledge, official school records, and teacher observations, the student's moral character, discipline, and general conduct have been <strong>Exemplary & Good</strong>. We wish the student success in all academic pursuits.
    </div>
    <div class="footer-row">
      <div>
        <div class="sig-line"></div>
        <div style="font-size: 12px; font-weight: bold;">Class Incharge</div>
      </div>
      <div>
        <div style="width: 65px; height: 65px; border: 2px dashed #78350f; border-radius: 50%; margin: auto; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: bold; text-transform: uppercase; color: #78350f;">OFFICIAL SEAL</div>
      </div>
      <div>
        <div class="sig-line"></div>
        <div style="font-size: 12px; font-weight: bold;">${metadata.principal_name || 'Principal'}</div>
        <div style="font-size: 10px; color: #78350f; font-weight: bold;">Head Principal</div>
      </div>
    </div>
  </div>
</body>
</html>`;
    }

    const htmlContent = custom_html || defaultHtml;

    const filePathOnDisk = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePathOnDisk, htmlContent, 'utf8');

    const filePath = `/uploads/${fileName}`;
    const fileSizeFormatted = `${Math.max(5, Math.round(htmlContent.length / 1024))} KB`;
    const uploadedBy = req.user.id;

    if (isMySQLConnected()) {
      const insertResult = await query(
        `INSERT INTO student_documents (student_id, title, category, file_path, file_size_formatted, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [sid, certTitle, category, filePath, fileSizeFormatted, uploadedBy]
      );

      // Notify parent
      const parents = await query(
        'SELECT p.user_id FROM students s JOIN parents p ON s.parent_id = p.id WHERE s.id = ?',
        [sid]
      );
      if (parents && parents[0]) {
        await query(
          `INSERT INTO notifications (user_id, title, message, type, action_url)
           VALUES (?, 'Official Document Issued', ?, 'Document', '/parent/documents')`,
          [parents[0].user_id, `Official ${category} has been issued for your child. Available in portal.`]
        );
      }

      return res.status(201).json({
        success: true,
        message: 'Certificate registered and issued successfully.',
        document: {
          id: insertResult.insertId,
          student_id: sid,
          title: certTitle,
          category,
          file_path: filePath,
          file_size_formatted: fileSizeFormatted
        }
      });
    }

    const store = getFallbackStore();
    store.student_documents = store.student_documents || [];
    store.notifications = store.notifications || [];
    const stu = (store.students || []).find(s => String(s.id) === String(sid));
    const parentUserId = stu?.parent_user_id || 2;
    const studentName = metadata.student_name || stu?.full_name || 'Student';

    const newDoc = {
      id: Date.now(),
      student_id: sid,
      student_name: studentName,
      roll_number: metadata.roll_number || stu?.roll_number || '',
      class_name: metadata.class_name || stu?.class_name || 'Grade 1',
      title: certTitle,
      category,
      file_path: filePath,
      file_size_formatted: fileSizeFormatted,
      file_type: 'text/html',
      uploaded_by: uploadedBy,
      uploaded_at: new Date().toISOString().slice(0, 10)
    };
    store.student_documents.unshift(newDoc);

    // Notify Parent / Student App
    store.notifications.unshift({
      id: Date.now() + 1,
      user_id: parentUserId,
      title: 'Official Document Issued',
      message: `Official ${category} has been issued for ${studentName}. It is now available in your portal and mobile app.`,
      type: 'Document',
      is_read: 0,
      action_url: '/parent/documents',
      created_at: new Date().toISOString()
    });

    saveStore();

    return res.status(201).json({
      success: true,
      message: `Certificate issued successfully to ${studentName}!`,
      document: newDoc
    });
  } catch (err) {
    console.error('saveGeneratedCertificate error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getDocuments,
  uploadDocument,
  downloadDocument,
  getDocumentPreview,
  getFilePreviewByPath,
  deleteDocument,
  saveGeneratedCertificate
};
