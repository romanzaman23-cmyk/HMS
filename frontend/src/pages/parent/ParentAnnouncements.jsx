import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, Calendar, BookOpen, Clock, AlertCircle, ArrowLeft, Volume2 } from 'lucide-react';
import api from '../../services/api';

export default function ParentAnnouncements() {
  const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      title: 'School Closure Notice',
      announcement_date: '10 Oct 2025',
      description: 'School will remain closed on 5th Oct 2025 due to scheduled national public holiday observances and administrative maintenance.',
      icon: Megaphone,
      tag: 'Public Holiday'
    },
    {
      id: 2,
      title: 'Parent Teacher Meeting',
      announcement_date: '30 Sep 2025',
      description: 'PTM will be held on 10th Oct 2025 at 9:00 AM in the school main auditorium. Please arrive punctually to review student quarterly evaluations.',
      icon: Calendar,
      tag: 'PTM Meeting'
    },
    {
      id: 3,
      title: 'New Library Books',
      announcement_date: '26 Sep 2025',
      description: 'We are pleased to inform you that new books including encyclopedia volumes and science journals have arrived in the school library.',
      icon: BookOpen,
      tag: 'Library'
    }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadAnnouncements() {
      try {
        const res = await api.get('/announcements');
        if (res.data && res.data.success && res.data.announcements.length > 0) {
          setAnnouncements(res.data.announcements.map((a, idx) => ({
            ...a,
            icon: idx === 0 ? Megaphone : idx === 1 ? Calendar : BookOpen,
            tag: idx === 0 ? 'Holiday' : idx === 1 ? 'Meeting' : 'Library'
          })));
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadAnnouncements();
  }, []);

  return (
    <div className="space-y-4 max-w-full">
      {/* App Header Banner (English Only) */}
      <div className="bg-white rounded-3xl p-4 border border-purple-100 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/parent/dashboard"
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex-shrink-0"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20 flex-shrink-0">
            <Megaphone className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                School Notices
              </h2>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                {announcements.length} Circulars
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              Official circulars and announcements
            </p>
          </div>
        </div>
      </div>

      {/* Cards list */}
      <div className="space-y-3">
        {announcements.map((ann) => {
          const Icon = ann.icon || Megaphone;
          return (
            <div
              key={ann.id}
              className="bg-white rounded-3xl p-4 border border-slate-100 hover:border-purple-200 shadow-sm transition-all flex items-start gap-3.5"
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {ann.title}
                  </h3>
                  <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap">
                    {ann.announcement_date}
                  </span>
                </div>

                {ann.tag && (
                  <span className="inline-block text-[9px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 mb-1.5">
                    {ann.tag}
                  </span>
                )}

                <p className="text-xs text-slate-600 leading-relaxed">
                  {ann.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
