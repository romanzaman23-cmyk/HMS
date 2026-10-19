import React, { useState, useEffect, useRef } from 'react';
import {
  Award,
  Printer,
  Download,
  X,
  CheckCircle2,
  Calendar,
  User,
  School,
  FileCheck,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import api from '../services/api';

// Convert day number to ordinal English word
const ORDINAL_DAYS = [
  '',
  'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth',
  'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth', 'Sixteenth', 'Seventeenth', 'Eighteenth', 'Nineteenth', 'Twentieth',
  'Twenty-First', 'Twenty-Second', 'Twenty-Third', 'Twenty-Fourth', 'Twenty-Fifth', 'Twenty-Sixth', 'Twenty-Seventh', 'Twenty-Eighth', 'Twenty-Ninth', 'Thirtieth',
  'Thirty-First'
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const TEENS = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertYearToWords(year) {
  const y = parseInt(year, 10);
  if (isNaN(y)) return '';
  if (y >= 2000 && y < 2100) {
    const remainder = y - 2000;
    if (remainder === 0) return 'Two Thousand';
    if (remainder < 10) return `Two Thousand ${ONES[remainder]}`;
    if (remainder < 20) return `Two Thousand ${TEENS[remainder - 10]}`;
    const tenPart = TENS[Math.floor(remainder / 10)];
    const onePart = ONES[remainder % 10];
    return `Two Thousand ${tenPart}${onePart ? ' ' + onePart : ''}`;
  }
  if (y >= 1900 && y < 2000) {
    const remainder = y - 1900;
    if (remainder === 0) return 'Nineteen Hundred';
    if (remainder < 10) return `Nineteen Hundred ${ONES[remainder]}`;
    if (remainder < 20) return `Nineteen ${TEENS[remainder - 10]}`;
    const tenPart = TENS[Math.floor(remainder / 10)];
    const onePart = ONES[remainder % 10];
    return `Nineteen ${tenPart}${onePart ? ' ' + onePart : ''}`;
  }
  return String(year);
}

function convertDateToWords(dateString) {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length !== 3) return '';
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const dayWord = ORDINAL_DAYS[day] || `${day}th`;
  const monthWord = MONTH_NAMES[month] || '';
  const yearWord = convertYearToWords(year);

  return `${dayWord} of ${monthWord}, ${yearWord}`;
}

export default function BirthCertificateModal({ isOpen, onClose, preselectedStudent, students = [], onCertificateSaved }) {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState('');
  const [gender, setGender] = useState('Male'); // 'Male' | 'Female'
  const [rollNumber, setRollNumber] = useState('');
  const [className, setClassName] = useState('Grade 5');
  const [dob, setDob] = useState('2014-04-12');
  const [dobWords, setDobWords] = useState('Twelfth of April, Two Thousand Fourteen');
  const [placeOfBirth, setPlaceOfBirth] = useState('Khyber Pakhtunkhwa, Pakistan');
  const [conduct, setConduct] = useState('Exemplary & Good');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [refNo, setRefNo] = useState(`HMS/BC/${new Date().getFullYear()}/025`);
  const [principalName, setPrincipalName] = useState('Principal Farman Ullah');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const certPrintRef = useRef(null);

  // Auto-fill student data when selection changes or modal opens
  useEffect(() => {
    const targetStudent = preselectedStudent || (students.length > 0 ? (selectedStudentId ? students.find(s => String(s.id) === String(selectedStudentId)) : students[0]) : null);
    if (targetStudent) {
      setSelectedStudentId(String(targetStudent.id));
      setStudentName(targetStudent.full_name || '');
      setParentName(targetStudent.parent_name || 'Guardian');
      setGender(targetStudent.gender || 'Male');
      const rNo = targetStudent.roll_number || '025';
      setRollNumber(rNo);
      setClassName(targetStudent.class_name || 'Grade 5');
      setRefNo(`HMS/BC/${new Date().getFullYear()}/${rNo}`);

      const defaultDob = targetStudent.dob || '2014-04-12';
      setDob(defaultDob);
      setDobWords(convertDateToWords(defaultDob));
    }
  }, [preselectedStudent, isOpen, students]);

  const handleStudentSelect = (stuId) => {
    setSelectedStudentId(stuId);
    const stu = students.find(s => String(s.id) === String(stuId));
    if (stu) {
      setStudentName(stu.full_name || '');
      setParentName(stu.parent_name || 'Guardian');
      setGender(stu.gender || 'Male');
      const rNo = stu.roll_number || '025';
      setRollNumber(rNo);
      setClassName(stu.class_name || 'Grade 5');
      setRefNo(`HMS/BC/${new Date().getFullYear()}/${rNo}`);
      if (stu.dob) {
        setDob(stu.dob);
        setDobWords(convertDateToWords(stu.dob));
      }
    }
  };

  const handleDobChange = (e) => {
    const val = e.target.value;
    setDob(val);
    const words = convertDateToWords(val);
    if (words) setDobWords(words);
  };

  // Direct Print
  const handlePrint = () => {
    window.print();
  };

  // Save to Student Academic Documents Registry
  const handleSaveToDocuments = async () => {
    setSaving(true);
    setFeedback('');
    try {
      // Build certificate HTML bundle
      const certData = {
        student_id: selectedStudentId || (students[0]?.id ? String(students[0].id) : '1'),
        title: `Date of Birth Certificate - ${studentName} (Roll ${rollNumber})`,
        category: 'Birth Certificate',
        metadata: {
          student_name: studentName,
          parent_name: parentName,
          dob,
          dob_words: dobWords,
          roll_number: rollNumber,
          class_name: className,
          ref_no: refNo,
          issue_date: issueDate,
          principal_name: principalName
        }
      };

      const res = await api.post('/documents/certificate', certData);
      if (res.data?.success) {
        setFeedback('Certificate officially registered and saved to student records!');
        if (onCertificateSaved) onCertificateSaved(res.data.document);
        setTimeout(() => setFeedback(''), 4000);
      } else {
        alert(res.data?.message || 'Failed to save certificate.');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error saving certificate');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const isBoy = gender === 'Male';
  const relationTitle = isBoy ? 'son of Mr.' : 'daughter of Mr.';
  const pronounHeShe = isBoy ? 'He' : 'She';
  const pronounHisHer = isBoy ? 'his' : 'her';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #official-birth-certificate, #official-birth-certificate * {
            visibility: visible !important;
          }
          #official-birth-certificate {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>

      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-amber-50/40 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Official Date of Birth Certificate Generator</span>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Principal Portal
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Instantly populate, customize, and print verified school certificates with official seals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
              title="Print certificate on printer or save as PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content: Split Screen (Left: Controls, Right: Live Certificate Preview) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* LEFT COLUMN: Controls & Field Settings (5 Cols) */}
          <div className="lg:col-span-4 p-5 bg-slate-50/70 border-r border-slate-200/80 space-y-4 overflow-y-auto max-h-[78vh]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Certificate Details
              </span>
              <span className="text-[11px] text-slate-500">Auto-formatted</span>
            </div>

            {/* Student Dropdown Selector */}
            {students.length > 0 && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Select Registered Student:
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="w-full py-2 px-3 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.full_name} • Roll: {st.roll_number} ({st.class_name})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Student Full Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Student Full Name:
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Roman Zamam"
                className="w-full py-2 px-3 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-800"
              />
            </div>

            {/* Father / Guardian Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Father / Guardian Name:
              </label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="e.g. Khalid Zaman"
                className="w-full py-2 px-3 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-800"
              />
            </div>

            {/* Gender, Roll No & Class */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full py-2 px-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl"
                >
                  <option value="Male">Boy (Son)</option>
                  <option value="Female">Girl (Daughter)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Roll No</label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="w-full py-2 px-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl font-mono text-center"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Class</label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full py-2 px-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-center"
                />
              </div>
            </div>

            {/* Date of Birth Picker */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Date of Birth (Calendar Pick):
              </label>
              <input
                type="date"
                value={dob}
                onChange={handleDobChange}
                className="w-full py-2 px-3 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-800 font-mono"
              />
            </div>

            {/* Date of Birth In Words */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Date of Birth in Words (Auto-generated):
              </label>
              <textarea
                rows={2}
                value={dobWords}
                onChange={(e) => setDobWords(e.target.value)}
                className="w-full py-2 px-3 text-xs font-medium bg-white border border-slate-200 rounded-xl text-slate-800"
              />
            </div>

            {/* Place of Birth */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Place of Birth / Nationality:
              </label>
              <input
                type="text"
                value={placeOfBirth}
                onChange={(e) => setPlaceOfBirth(e.target.value)}
                className="w-full py-2 px-3 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-800"
              />
            </div>

            {/* Certificate Ref & Issue Date */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Serial / Ref No</label>
                <input
                  type="text"
                  value={refNo}
                  onChange={(e) => setRefNo(e.target.value)}
                  className="w-full py-2 px-2 text-xs font-mono font-semibold bg-white border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Issue Date</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full py-2 px-2 text-xs font-mono font-semibold bg-white border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            {/* Principal Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Signatory Principal Name:
              </label>
              <input
                type="text"
                value={principalName}
                onChange={(e) => setPrincipalName(e.target.value)}
                className="w-full py-2 px-3 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-800"
              />
            </div>

            {/* Action Button: Save to Permanent Documents */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveToDocuments}
                disabled={saving}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to Documents...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Save to Student Records</span>
                  </>
                )}
              </button>

              {feedback && (
                <p className="mt-2 text-xs text-emerald-700 font-bold text-center animate-in fade-in">
                  ✓ {feedback}
                </p>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Live Authentic Printable Certificate Sheet (8 Cols) */}
          <div className="lg:col-span-8 p-6 sm:p-8 bg-slate-100 flex items-center justify-center overflow-y-auto">
            {/* The Print Sheet */}
            <div
              id="official-birth-certificate"
              ref={certPrintRef}
              className="bg-white w-full max-w-[760px] p-8 sm:p-12 shadow-xl border-8 border-double border-amber-900/30 rounded-xl relative text-slate-900 font-serif leading-relaxed"
              style={{ minHeight: '940px' }}
            >
              {/* Inner Ornamental Border */}
              <div className="border border-amber-800/20 p-6 sm:p-8 h-full flex flex-col justify-between relative bg-gradient-to-b from-amber-50/20 via-white to-amber-50/20">
                {/* Corner Accents */}
                <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-amber-800/60" />
                <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-amber-800/60" />
                <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-amber-800/60" />
                <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-amber-800/60" />

                {/* Top Header */}
                <div className="text-center space-y-2 border-b-2 border-amber-900/20 pb-6">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#0e2238] text-white flex items-center justify-center font-bold text-xl shadow-md border-2 border-amber-400">
                      HMS
                    </div>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-slate-900 font-serif pt-1">
                    Highlight Model School
                  </h1>
                  <p className="text-xs uppercase tracking-widest font-sans font-bold text-amber-900/80">
                    Better Learning | Brighter Future
                  </p>
                  <p className="text-[11px] font-sans text-slate-500">
                    Government Registered & Recognized Secondary Education Institution
                  </p>
                </div>

                {/* Certificate Title Banner */}
                <div className="my-6 text-center">
                  <span className="inline-block px-6 py-2 bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 border border-amber-300 rounded-full text-base sm:text-lg font-bold uppercase tracking-wider text-amber-950 font-serif shadow-xs">
                    Date of Birth & Character Certificate
                  </span>
                </div>

                {/* Reference Number and Date */}
                <div className="flex items-center justify-between text-xs font-sans font-semibold text-slate-700 px-2 mb-6">
                  <div>
                    <span className="text-slate-400">Ref No: </span>
                    <span className="font-mono font-bold text-slate-900">{refNo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Date of Issue: </span>
                    <span className="font-mono font-bold text-slate-900">{new Date(issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Certificate Body Paragraph */}
                <div className="text-sm sm:text-base space-y-5 text-justify text-slate-800 px-2 sm:px-4 leading-relaxed font-serif">
                  <p>
                    This is to solemnly certify that <strong className="underline decoration-amber-600/60 decoration-2 font-bold text-slate-950 px-1 text-lg">{studentName || '______________________'}</strong>, {relationTitle} <strong className="underline decoration-amber-600/60 decoration-2 font-bold text-slate-950 px-1">{parentName || '______________________'}</strong>, having Roll Number <strong className="font-mono font-bold text-slate-950">[{rollNumber || '____'}]</strong>, is a bona fide regular student of this school currently enrolled in <strong className="font-bold text-slate-950">Class {className}</strong>.
                  </p>

                  <p>
                    According to the official admission and withdrawal register of Highlight Model School, {pronounHisHer} officially recorded Date of Birth is:
                  </p>

                  {/* Highlighting Date of Birth Box */}
                  <div className="my-4 p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-center font-sans">
                    <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-wider font-mono">
                      {dob ? new Date(dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '________________'}
                    </p>
                    <p className="text-xs sm:text-sm italic font-serif text-amber-900 font-semibold mt-1">
                      (In Words: "{dobWords || '______________________________________'}")
                    </p>
                  </div>

                  <p>
                    {pronounHisHer.charAt(0).toUpperCase() + pronounHisHer.slice(1)} recorded place of birth and nationality is <strong className="font-semibold text-slate-950">{placeOfBirth}</strong>.
                  </p>

                  <p>
                    To the best of our knowledge, official school records, and teacher observations, {pronounHisHer} moral character, academic discipline, and general conduct during {pronounHisHer} period of stay at this institution have been <strong className="font-bold text-emerald-800">[{conduct}]</strong>.
                  </p>

                  <p className="text-xs italic text-slate-500 pt-1">
                    This certificate is issued under the official seal and authority of Highlight Model School upon the request of the student's legal guardian for official verification purposes. We wish {isBoy ? 'him' : 'her'} success in all future academic pursuits.
                  </p>
                </div>

                {/* Signature and Seal Blocks */}
                <div className="pt-12 sm:pt-16 mt-8 border-t border-slate-200 font-sans">
                  <div className="grid grid-cols-3 items-end text-center gap-4">
                    {/* Prepared by */}
                    <div>
                      <div className="w-28 mx-auto border-b border-slate-400 mb-1" />
                      <p className="text-xs font-bold text-slate-800">Prepared By</p>
                      <p className="text-[10px] text-slate-400">Class Incharge</p>
                    </div>

                    {/* School Seal Stamp */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-20 h-20 rounded-full border-2 border-dashed border-amber-700/60 flex flex-col items-center justify-center text-amber-900/80 p-1 transform rotate-[-8deg] bg-amber-50/30">
                        <ShieldCheck className="w-5 h-5 text-amber-700 mb-0.5" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-center leading-tight">
                          HIGHLIGHT MODEL SCHOOL<br />OFFICIAL SEAL
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold">Institutional Seal</p>
                    </div>

                    {/* Principal Signature */}
                    <div>
                      <div className="w-32 mx-auto border-b-2 border-slate-900 mb-1" />
                      <p className="text-xs font-bold text-slate-900">{principalName}</p>
                      <p className="text-[10px] uppercase font-extrabold tracking-wider text-amber-800">
                        Head Principal
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
