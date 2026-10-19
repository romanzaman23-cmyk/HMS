import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Save,
  RotateCcw,
  Copy,
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ChevronUp,
  ChevronDown,
  Sparkles,
  BookOpen,
  User,
  MapPin,
  Coffee,
  Layers,
  ArrowRight
} from 'lucide-react';
import api from '../../services/api';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const COMMON_SUBJECTS = [
  'Mathematics',
  'English Language',
  'English Grammar',
  'Urdu',
  'Urdu Literature',
  'General Science',
  'Islamiat',
  'Social Studies',
  'Computer Studies',
  'General Knowledge',
  'Holy Quran & Hadith',
  'Physical Education (PT)',
  'Arts & Crafts',
  'Spoken English & Debate',
  'Library & Reading',
  'Robotics & Practical Science',
  'Moral Education & Ethics'
];

const COMMON_TEACHERS = [
  'Sir Tariq',
  'Ms. Ayesha',
  'Sir Farman',
  'Ms. Fatima',
  'Qari Usman',
  'Ms. Sadia',
  'Sir Roman',
  'Coach Bilal',
  'Ms. Hina',
  'Mr. Asad'
];

export default function AdminTimetable() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedClassName, setSelectedClassName] = useState('Grade 1');
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [schedule, setSchedule] = useState({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: []
  });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [viewMode, setViewMode] = useState('editor'); // 'editor' | 'matrix'
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copyTargetDays, setCopyTargetDays] = useState([]);

  // Fetch classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/classes');
        if (res.data?.success && res.data.classes?.length > 0) {
          setClasses(res.data.classes);
          // Default to Grade 1 or first class
          const grade1 = res.data.classes.find(c => c.name.toLowerCase().includes('grade 1'));
          if (grade1) {
            setSelectedClassId(grade1.id);
            setSelectedClassName(grade1.name);
          } else {
            setSelectedClassId(res.data.classes[0].id);
            setSelectedClassName(res.data.classes[0].name);
          }
        }
      } catch (err) {
        console.error('Failed to fetch classes:', err);
      }
    };
    fetchClasses();
  }, []);

  // Fetch timetable when selected class changes
  useEffect(() => {
    if (!selectedClassName) return;

    const fetchTimetable = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/timetable?class_name=${encodeURIComponent(selectedClassName)}`);
        if (res.data?.success && res.data.data && Object.keys(res.data.data).length > 0) {
          setSchedule(res.data.data);
          setLastUpdated(res.data.record?.updated_at || null);
        } else {
          // If no timetable yet, fetch default template so admin has a head start
          const tplRes = await api.get(`/timetable/template?class_name=${encodeURIComponent(selectedClassName)}`);
          if (tplRes.data?.success && tplRes.data.template) {
            setSchedule(tplRes.data.template);
          } else {
            setSchedule({
              Monday: [],
              Tuesday: [],
              Wednesday: [],
              Thursday: [],
              Friday: [],
              Saturday: []
            });
          }
          setLastUpdated(null);
        }
      } catch (err) {
        console.error('Error fetching timetable:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [selectedClassName]);

  const handleClassChange = (e) => {
    const classId = e.target.value;
    setSelectedClassId(classId);
    const cls = classes.find(c => String(c.id) === String(classId));
    if (cls) {
      setSelectedClassName(cls.name);
    }
  };

  // Add new period to selected day
  const handleAddPeriod = (isBreak = false) => {
    const currentList = schedule[selectedDay] || [];
    const newIndex = currentList.length + 1;
    const newPeriod = {
      id: Date.now(),
      period: isBreak ? 'Break / Recess' : `Period ${newIndex}`,
      time: '08:00 - 08:45 AM',
      subject: isBreak ? 'Recess & Refreshment' : 'General Science',
      teacher: isBreak ? 'Duty Staff' : 'Sir Farman',
      room: 'Room 103',
      isBreak: isBreak
    };

    setSchedule(prev => ({
      ...prev,
      [selectedDay]: [...(prev[selectedDay] || []), newPeriod]
    }));
  };

  // Update a specific period field
  const handlePeriodFieldChange = (day, index, field, value) => {
    setSchedule(prev => {
      const dayList = [...(prev[day] || [])];
      dayList[index] = {
        ...dayList[index],
        [field]: value
      };
      return {
        ...prev,
        [day]: dayList
      };
    });
  };

  // Remove period
  const handleRemovePeriod = (day, index) => {
    setSchedule(prev => {
      const dayList = [...(prev[day] || [])];
      dayList.splice(index, 1);
      // Renumber non-break periods
      let periodCounter = 1;
      const renumbered = dayList.map(item => {
        if (!item.isBreak) {
          const updated = { ...item, period: `Period ${periodCounter}` };
          periodCounter++;
          return updated;
        }
        return item;
      });
      return {
        ...prev,
        [day]: renumbered
      };
    });
  };

  // Move period up/down
  const handleMovePeriod = (day, index, direction) => {
    setSchedule(prev => {
      const dayList = [...(prev[day] || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= dayList.length) return prev;

      const temp = dayList[index];
      dayList[index] = dayList[targetIndex];
      dayList[targetIndex] = temp;

      return {
        ...prev,
        [day]: dayList
      };
    });
  };

  // Save timetable to backend
  const handleSaveTimetable = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        class_id: selectedClassId,
        class_name: selectedClassName,
        schedule
      };

      const res = await api.post('/timetable', payload);
      if (res.data?.success) {
        setLastUpdated(res.data.record?.updated_at || new Date().toISOString());
        setFeedback({
          type: 'success',
          message: `Timetable for ${selectedClassName} has been saved and published live to mobile app!`
        });
        setTimeout(() => setFeedback(null), 5000);
      } else {
        setFeedback({
          type: 'error',
          message: res.data?.message || 'Failed to save timetable.'
        });
      }
    } catch (err) {
      console.error('Error saving timetable:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Server error occurred while saving timetable.'
      });
    } finally {
      setSaving(false);
    }
  };

  // Reset to default template
  const handleResetTemplate = async () => {
    if (!window.confirm(`Reset ${selectedClassName} timetable to standard school template? Any unsaved edits will be replaced.`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/timetable/template?class_name=${encodeURIComponent(selectedClassName)}`);
      if (res.data?.success && res.data.template) {
        setSchedule(res.data.template);
        setFeedback({
          type: 'success',
          message: 'Template loaded! Click "Save Timetable" to publish.'
        });
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to load template.' });
    } finally {
      setLoading(false);
    }
  };

  // Copy schedule from current day to target days
  const handleExecuteCopy = () => {
    if (copyTargetDays.length === 0) return;
    const sourcePeriods = schedule[selectedDay] || [];

    setSchedule(prev => {
      const updated = { ...prev };
      copyTargetDays.forEach(targetDay => {
        // Deep clone items with new IDs
        updated[targetDay] = sourcePeriods.map(p => ({
          ...p,
          id: Date.now() + Math.random()
        }));
      });
      return updated;
    });

    setCopyModalOpen(false);
    setCopyTargetDays([]);
    setFeedback({
      type: 'success',
      message: `Successfully copied ${selectedDay}'s schedule to: ${copyTargetDays.join(', ')}!`
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Print timetable
  const handlePrint = () => {
    window.print();
  };

  const currentPeriods = schedule[selectedDay] || [];
  const selectedClassObj = classes.find(c => String(c.id) === String(selectedClassId));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                Class Timetable Management
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live Mobile Sync
                </span>
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Assign and publish weekly period timetables for each class. Updates reflect instantly on student & parent mobile apps.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowMobilePreview(!showMobilePreview)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all ${
              showMobilePreview
                ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle Smartphone Preview"
          >
            <Smartphone className="w-4 h-4 text-purple-600" />
            <span>Mobile Preview</span>
          </button>

          <button
            onClick={handleResetTemplate}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
            title="Reset to default 7-period template"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Load Template</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print</span>
          </button>

          <button
            onClick={handleSaveTimetable}
            disabled={saving || loading}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-xs transition-all disabled:opacity-60"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Saving...' : 'Save & Publish'}</span>
          </button>
        </div>
      </div>

      {/* Alert Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Class Selection & Meta Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Select Class
            </label>
            <div className="relative">
              <select
                value={selectedClassId}
                onChange={handleClassChange}
                className="w-56 px-3.5 py-2 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
              >
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.section ? `(Sec ${cls.section})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedClassObj && (
            <div className="flex items-center gap-3 pt-5 text-xs text-slate-500">
              <span className="px-2.5 py-1 bg-slate-100 rounded-lg font-medium">
                Room: <strong className="text-slate-700">{selectedClassObj.room_number || 'Room 103'}</strong>
              </span>
              <span className="px-2.5 py-1 bg-slate-100 rounded-lg font-medium">
                Capacity: <strong className="text-slate-700">{selectedClassObj.capacity || 30} students</strong>
              </span>
              {lastUpdated && (
                <span className="text-slate-400">
                  Last updated: {new Date(lastUpdated).toLocaleDateString()} {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setViewMode('editor')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'editor'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Day-by-Day Editor
          </button>
          <button
            onClick={() => setViewMode('matrix')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'matrix'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly Full Grid
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`grid gap-6 ${showMobilePreview ? 'lg:grid-cols-3' : 'grid-cols-1'}`}>
        {/* Left / Main Editor Section */}
        <div className={showMobilePreview ? 'lg:col-span-2' : ''}>
          {viewMode === 'editor' ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {/* Day Navigation Tabs */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  {DAYS_OF_WEEK.map(day => {
                    const count = (schedule[day] || []).length;
                    const isActive = selectedDay === day;
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                        }`}
                      >
                        <span>{day}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Day Specific Quick Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCopyTargetDays(DAYS_OF_WEEK.filter(d => d !== selectedDay));
                      setCopyModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                    title={`Copy ${selectedDay}'s schedule to other days`}
                  >
                    <Copy className="w-3.5 h-3.5 text-blue-600" />
                    <span>Copy {selectedDay} Schedule</span>
                  </button>
                </div>
              </div>

              {/* Periods List */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <span>{selectedDay} Schedule</span>
                      <span className="text-xs font-normal text-slate-500">
                        ({currentPeriods.length} periods configured)
                      </span>
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAddPeriod(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-all"
                    >
                      <Coffee className="w-3.5 h-3.5 text-amber-600" />
                      <span>+ Add Break/Recess</span>
                    </button>
                    <button
                      onClick={() => handleAddPeriod(false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-600" />
                      <span>+ Add Period</span>
                    </button>
                  </div>
                </div>

                {/* Periods Stack */}
                {loading ? (
                  <div className="py-16 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs">Loading timetable...</p>
                  </div>
                ) : currentPeriods.length === 0 ? (
                  <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-slate-700">No Periods Scheduled for {selectedDay}</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                      Add periods manually or click "Load Template" at the top to populate standard periods.
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleAddPeriod(false)}
                        className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-xs"
                      >
                        Add First Period
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentPeriods.map((period, index) => (
                      <div
                        key={period.id || index}
                        className={`p-4 rounded-xl border transition-all ${
                          period.isBreak
                            ? 'bg-amber-50/60 border-amber-200'
                            : 'bg-white border-slate-200 hover:border-blue-300 shadow-xs'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          {/* Order & Title Controls */}
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-0.5">
                              <button
                                onClick={() => handleMovePeriod(selectedDay, index, 'up')}
                                disabled={index === 0}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20"
                                title="Move Up"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleMovePeriod(selectedDay, index, 'down')}
                                disabled={index === currentPeriods.length - 1}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20"
                                title="Move Down"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="w-32">
                              <input
                                type="text"
                                value={period.period}
                                onChange={(e) =>
                                  handlePeriodFieldChange(selectedDay, index, 'period', e.target.value)
                                }
                                className={`w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                  period.isBreak
                                    ? 'bg-amber-100/70 text-amber-900 border-amber-300'
                                    : 'bg-slate-100 text-slate-800 border-slate-200'
                                }`}
                              />
                            </div>

                            <div className="w-36">
                              <div className="relative">
                                <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                                <input
                                  type="text"
                                  placeholder="08:00 - 08:45 AM"
                                  value={period.time}
                                  onChange={(e) =>
                                    handlePeriodFieldChange(selectedDay, index, 'time', e.target.value)
                                  }
                                  className="w-full text-xs font-medium pl-8 pr-2.5 py-1.5 rounded-lg bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Subject, Teacher, Room Inputs */}
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {/* Subject */}
                            <div className="relative">
                              <BookOpen className="w-3.5 h-3.5 text-blue-500 absolute left-2.5 top-2.5 pointer-events-none" />
                              <input
                                type="text"
                                placeholder="Subject"
                                list="subjects-list"
                                value={period.subject}
                                onChange={(e) =>
                                  handlePeriodFieldChange(selectedDay, index, 'subject', e.target.value)
                                }
                                className="w-full text-xs font-semibold pl-8 pr-2.5 py-1.5 rounded-lg bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>

                            {/* Teacher */}
                            <div className="relative">
                              <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                              <input
                                type="text"
                                placeholder="Teacher"
                                list="teachers-list"
                                value={period.teacher}
                                onChange={(e) =>
                                  handlePeriodFieldChange(selectedDay, index, 'teacher', e.target.value)
                                }
                                className="w-full text-xs font-medium pl-8 pr-2.5 py-1.5 rounded-lg bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>

                            {/* Room */}
                            <div className="relative">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                              <input
                                type="text"
                                placeholder="Room"
                                value={period.room}
                                onChange={(e) =>
                                  handlePeriodFieldChange(selectedDay, index, 'room', e.target.value)
                                }
                                className="w-full text-xs font-medium pl-8 pr-2.5 py-1.5 rounded-lg bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          {/* Period Action Buttons */}
                          <div className="flex items-center gap-1 self-end md:self-auto">
                            <button
                              onClick={() => handleRemovePeriod(selectedDay, index)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Delete Period"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Weekly Matrix Overview */
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 overflow-x-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-800">
                  Weekly Timetable Matrix — {selectedClassName}
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  Showing Monday to Saturday side by side
                </span>
              </div>

              <div className="grid grid-cols-6 gap-3 min-w-[900px]">
                {DAYS_OF_WEEK.map(day => {
                  const dayPeriods = schedule[day] || [];
                  return (
                    <div key={day} className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/70">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                        <span className="text-xs font-bold text-slate-800">{day}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                          {dayPeriods.length}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {dayPeriods.map((p, pIdx) => (
                          <div
                            key={p.id || pIdx}
                            className={`p-2 rounded-lg text-[11px] border ${
                              p.isBreak
                                ? 'bg-amber-100/60 border-amber-200 text-amber-900'
                                : 'bg-white border-slate-200 text-slate-800 shadow-xs'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold text-[10px] text-slate-500 mb-1">
                              <span>{p.period}</span>
                              <span className="font-normal text-[9px]">{p.time.split('-')[0]}</span>
                            </div>
                            <div className="font-bold truncate text-blue-900">{p.subject}</div>
                            <div className="text-[10px] text-slate-500 truncate">{p.teacher}</div>
                            <div className="text-[9px] text-slate-400 mt-0.5">{p.room}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Smartphone Live Preview Drawer */}
        {showMobilePreview && (
          <div className="bg-slate-900 rounded-3xl p-4 shadow-xl border-4 border-slate-800 flex flex-col items-center">
            <div className="w-20 h-4 bg-slate-800 rounded-full mb-3" />
            <div className="w-full bg-[#f8fafc] rounded-2xl overflow-hidden shadow-inner flex flex-col h-[650px] border border-slate-700">
              {/* Mobile Status Bar */}
              <div className="bg-[#0e2238] text-white px-4 py-2 flex items-center justify-between text-[11px]">
                <span className="font-semibold">09:41 AM</span>
                <div className="flex items-center gap-1.5">
                  <span>HMS App</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>

              {/* Mobile Header */}
              <div className="bg-[#0e2238] text-white px-4 pb-3 pt-1">
                <h3 className="text-sm font-bold">Class Timetable</h3>
                <p className="text-[11px] text-slate-300">
                  Assigned Timetable • Class {selectedClassName}
                </p>
              </div>

              {/* Mobile Day Selector */}
              <div className="bg-white border-b border-slate-200 p-2 flex gap-1.5 overflow-x-auto">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
                      selectedDay === day
                        ? 'bg-[#0e2238] text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>

              {/* Mobile Periods Scroll View */}
              <div className="p-3 overflow-y-auto flex-1 space-y-2.5 bg-slate-50">
                {currentPeriods.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600">No Timetable Published</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      No periods scheduled for {selectedDay}.
                    </p>
                  </div>
                ) : (
                  currentPeriods.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className={`p-3 rounded-xl border shadow-xs ${
                        p.isBreak
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            p.isBreak
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {p.period}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {p.time}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">
                        {p.subject}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          {p.teacher}
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-3 h-3" />
                          {p.room}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Mobile Home Bar */}
              <div className="bg-white p-2 border-t border-slate-200 flex justify-center">
                <div className="w-24 h-1 bg-slate-300 rounded-full" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Datalist Auto-Complete Suggestions */}
      <datalist id="subjects-list">
        {COMMON_SUBJECTS.map(subj => (
          <option key={subj} value={subj} />
        ))}
      </datalist>

      <datalist id="teachers-list">
        {COMMON_TEACHERS.map(tch => (
          <option key={tch} value={tch} />
        ))}
      </datalist>

      {/* Copy Schedule Modal */}
      {copyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Copy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Copy {selectedDay}'s Schedule
                </h3>
                <p className="text-xs text-slate-500">
                  Select which days to overwrite with {selectedDay}'s periods.
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              {DAYS_OF_WEEK.filter(d => d !== selectedDay).map(day => {
                const isSelected = copyTargetDays.includes(day);
                return (
                  <label
                    key={day}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/60 border-blue-300 text-blue-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs font-bold">{day}</span>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCopyTargetDays(prev => [...prev, day]);
                        } else {
                          setCopyTargetDays(prev => prev.filter(d => d !== day));
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setCopyModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteCopy}
                disabled={copyTargetDays.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                <span>Apply Copy ({copyTargetDays.length} days)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
