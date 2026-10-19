import React, { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle, Download, FileText } from 'lucide-react';

export default function DocxViewer({ url, title, onDownload }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    async function renderDocx() {
      try {
        setLoading(true);
        setError(null);

        // Fetch docx file as arrayBuffer
        const cacheBustUrl = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
        const res = await fetch(cacheBustUrl, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load Word document`);
        const buffer = await res.arrayBuffer();

        if (isCancelled) return;
        if (!buffer || buffer.byteLength === 0) {
          throw new Error('Word document file is empty (0 bytes)');
        }

        if (window.docx && containerRef.current) {
          containerRef.current.innerHTML = '';
          await window.docx.renderAsync(buffer, containerRef.current);
        } else {
          throw new Error('Word preview engine not available');
        }

        if (isCancelled) return;
        setLoading(false);
      } catch (err) {
        if (isCancelled) return;
        console.error('Word render error:', err);
        setError(err.message || 'Failed to render Word document');
        setLoading(false);
      }
    }

    renderDocx();

    return () => { isCancelled = true; };
  }, [url]);

  if (error) {
    return (
      <div className="w-full min-h-[320px] flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800 mb-1">Microsoft Word Document</h4>
        <p className="text-xs text-slate-500 max-w-sm mb-4">
          This Word file ({title}) can be downloaded to view and edit in Microsoft Word or Office.
        </p>
        {onDownload && (
          <button
            type="button"
            onClick={onDownload}
            className="px-4 py-2 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Word File</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
      {loading && (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-500 min-h-[320px]">
          <Loader2 className="w-6 h-6 animate-spin text-[#1a73e8]" />
          <span className="text-xs font-medium">Loading Word document...</span>
        </div>
      )}
      <div
        ref={containerRef}
        className={`w-full overflow-auto max-h-[520px] p-6 bg-white ${loading ? 'hidden' : 'block'}`}
      />
    </div>
  );
}
