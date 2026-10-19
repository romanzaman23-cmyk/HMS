import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Loader2,
  AlertCircle,
  FileText
} from 'lucide-react';

export default function PdfCanvasViewer({ url, docId, filePath, title, onDownload }) {
  const [numPages, setNumPages] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(1.15);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfBytes, setPdfBytes] = useState(null);
  const [htmlContent, setHtmlContent] = useState(null);

  const canvasRef = useRef(null);
  const pdfDocRef = useRef(null);
  const renderTaskRef = useRef(null);

  // Load PDF data via JSON API (completely immune to IDM download hijacking)
  useEffect(() => {
    let isCancelled = false;

    async function loadPdf() {
      try {
        setLoading(true);
        setError(null);

        // Ensure PDF.js engine is ready
        let attempts = 0;
        while (!window.pdfjsLib && attempts < 25) {
          await new Promise((r) => setTimeout(r, 80));
          attempts++;
        }
        if (!window.pdfjsLib) {
          throw new Error('PDF viewing engine failed to initialize.');
        }

        if (!window.pdfjsLib.GlobalWorkerOptions?.workerSrc) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';
        }

        // Determine preview endpoint
        let previewEndpoint = '';
        if (docId) {
          previewEndpoint = `/api/documents/${docId}/preview`;
        } else if (filePath) {
          previewEndpoint = `/api/documents/preview-file?path=${encodeURIComponent(filePath)}`;
        } else if (url) {
          // If a download or upload url is passed, map to preview API
          const downloadMatch = url.match(/\/api\/documents\/(\d+)\/download/);
          if (downloadMatch) {
            previewEndpoint = `/api/documents/${downloadMatch[1]}/preview`;
          } else {
            previewEndpoint = `/api/documents/preview-file?path=${encodeURIComponent(url)}`;
          }
        }

        if (!previewEndpoint) {
          throw new Error('No document source provided.');
        }

        // Fetch JSON base64 payload (IDM never intercepts JSON responses)
        const res = await fetch(previewEndpoint);
        if (!res.ok) {
          throw new Error(`Failed to load document preview (HTTP ${res.status})`);
        }
        const data = await res.json();
        if (isCancelled) return;

        if (!data.success || !data.base64) {
          throw new Error(data.message || 'No preview document data available.');
        }

        // Convert base64 to in-memory Uint8Array
        const binaryStr = atob(data.base64);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        if (isCancelled) return;
        setPdfBytes(bytes);

        // Check if document is HTML or Certificate
        const trimmedStr = binaryStr.trim();
        const isHtml = (data.contentType && data.contentType.includes('html')) ||
                       (data.fileName && /\.(html|htm)$/i.test(data.fileName)) ||
                       (filePath && /\.(html|htm)$/i.test(filePath)) ||
                       trimmedStr.startsWith('<!DOCTYPE') ||
                       trimmedStr.startsWith('<html') ||
                       trimmedStr.startsWith('<div');

        if (isHtml) {
          let htmlText = '';
          try {
            htmlText = new TextDecoder('utf-8').decode(bytes);
          } catch (e) {
            htmlText = binaryStr;
          }
          if (isCancelled) return;
          setHtmlContent(htmlText);
          setNumPages(1);
          setPageNum(1);
          setLoading(false);
          return;
        }

        // Parse document with PDF.js
        const loadingTask = window.pdfjsLib.getDocument({
          data: bytes,
          isEvalSupported: false
        });
        const pdf = await loadingTask.promise;

        if (isCancelled) return;
        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        setPageNum(1);
        setLoading(false);
      } catch (err) {
        if (isCancelled) return;
        console.error('PDF Load Error:', err);
        setError(err.message || 'Failed to load PDF preview.');
        setLoading(false);
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch (_) {}
      }
    };
  }, [url, docId, filePath]);

  // Render current page onto canvas
  useEffect(() => {
    if (!pdfDocRef.current || loading || error) return;

    let isRenderCancelled = false;

    async function renderPage() {
      try {
        if (renderTaskRef.current) {
          try { renderTaskRef.current.cancel(); } catch (_) {}
        }

        const page = await pdfDocRef.current.getPage(pageNum);
        if (isRenderCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        const viewport = page.getViewport({ scale });

        // High-DPI support for razor-sharp vector text rendering
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

        const renderContext = {
          canvasContext: context,
          transform,
          viewport
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Canvas render error:', err);
        }
      }
    }

    renderPage();

    return () => {
      isRenderCancelled = true;
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch (_) {}
      }
    };
  }, [pageNum, scale, loading, error]);

  const handlePrevPage = () => {
    if (pageNum > 1) setPageNum(pageNum - 1);
  };

  const handleNextPage = () => {
    if (pageNum < numPages) setPageNum(pageNum + 1);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.6));
  };

  const handleResetZoom = () => {
    setScale(1.0);
  };

  const handleFullView = () => {
    if (docId) {
      window.open(`/viewer.html?id=${docId}&title=${encodeURIComponent(title || 'Document')}`, '_blank');
    } else if (filePath) {
      window.open(`/viewer.html?path=${encodeURIComponent(filePath)}&title=${encodeURIComponent(title || 'Document')}`, '_blank');
    } else if (url) {
      const match = url.match(/\/api\/documents\/(\d+)\/download/);
      if (match) {
        window.open(`/viewer.html?id=${match[1]}&title=${encodeURIComponent(title || 'Document')}`, '_blank');
      } else {
        window.open(`/viewer.html?path=${encodeURIComponent(url)}&title=${encodeURIComponent(title || 'Document')}`, '_blank');
      }
    }
  };

  if (error) {
    return (
      <div className="w-full min-h-[360px] flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800 mb-1">Unable to Render PDF Preview</h4>
        <p className="text-xs text-rose-500 font-mono mb-2 max-w-md break-all">
          {error}
        </p>
        <p className="text-xs text-slate-500 max-w-sm mb-4">
          The document could not be previewed directly. You can download the file to inspect its content.
        </p>
        {onDownload && (
          <button
            type="button"
            onClick={onDownload}
            className="px-4 py-2 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Document</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col bg-slate-100/70 rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Viewer Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-slate-200 text-xs">
        {/* Page navigation */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={pageNum <= 1 || loading}
            className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent text-slate-700"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-medium text-slate-700 px-1 select-none">
            {loading ? '...' : `${pageNum} / ${numPages}`}
          </span>
          <button
            type="button"
            onClick={handleNextPage}
            disabled={pageNum >= numPages || loading}
            className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent text-slate-700"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom & Fit Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={loading}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-700 disabled:opacity-40"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            disabled={loading}
            className="px-2 py-0.5 rounded-lg hover:bg-slate-100 text-[11px] font-mono font-medium text-slate-700 disabled:opacity-40 select-none"
            title="Reset Zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={loading}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-700 disabled:opacity-40"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleFullView}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 disabled:opacity-40"
            title="Open in new window"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1a73e8] text-xs font-semibold inline-flex items-center gap-1"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          )}
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="w-full overflow-auto max-h-[520px] p-4 flex items-center justify-center min-h-[380px] bg-slate-200/50">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-[#1a73e8]" />
            <span className="text-xs font-medium">Loading document pages...</span>
          </div>
        ) : htmlContent ? (
          <div className="w-full h-[500px] shadow-lg border border-slate-300 rounded-xl overflow-hidden bg-white">
            <iframe
              srcDoc={htmlContent}
              title={title || 'Official Document'}
              className="w-full h-full border-none"
            />
          </div>
        ) : (
          <div className="shadow-lg border border-slate-300 rounded overflow-hidden bg-white inline-block">
            <canvas ref={canvasRef} className="block" />
          </div>
        )}
      </div>
    </div>
  );
}
