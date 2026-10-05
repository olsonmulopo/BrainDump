import React from 'react';
import {
  Laptop,
  CheckCircle2,
  HardDrive,
  Cloud,
  Download,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Zap,
  X
} from 'lucide-react';

interface WindowsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WindowsGuideModal: React.FC<WindowsGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-neutral-200 max-w-2xl w-full p-6 my-8 text-neutral-800 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 leading-tight">
                Run on Windows 10 Pro with Free Google Drive Sync
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Zero subscriptions • 100% data ownership • Access across all computers
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-5 text-xs text-neutral-600 max-h-[70vh] overflow-y-auto pr-1">
          {/* Answer directly */}
          <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-900 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-xs text-emerald-950">
                Yes! You can rebuild and run this without paying any monthly subscription.
              </div>
              <div className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                This tool runs smoothly in your web browser (Chrome, Edge, Firefox, Brave) on Windows 10 Pro.
                By connecting your Google Drive, your boards sync automatically to your personal cloud drive so you can edit from any computer and never lose data.
              </div>
            </div>
          </div>

          {/* 3 Step Guide */}
          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-400">
              How to install and run on Windows 10 Pro
            </h3>

            {/* Step 1 */}
            <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 flex gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                1
              </div>
              <div className="space-y-1 flex-1">
                <div className="font-semibold text-neutral-800 text-xs flex items-center gap-1.5">
                  <span>Install as a Desktop App via Edge or Chrome (Fastest)</span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-semibold">Recommended</span>
                </div>
                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  In Microsoft Edge or Google Chrome on Windows 10:
                </p>
                <ol className="list-disc list-inside text-[11px] text-neutral-600 space-y-0.5 pl-1">
                  <li>Click the three dots menu <strong>(⋯)</strong> in the top-right corner of your browser.</li>
                  <li>Select <strong>Apps</strong> &gt; <strong>Install this site as an app</strong>.</li>
                  <li>Check "Pin to Taskbar" or "Create Desktop Shortcut".</li>
                </ol>
                <p className="text-[11px] text-neutral-500">
                  It will launch in its own clean window without browser tabs, identical to a native desktop program!
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 flex gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                2
              </div>
              <div className="space-y-1 flex-1">
                <div className="font-semibold text-neutral-800 text-xs">
                  Connect Google Drive for Multi-Computer Sync
                </div>
                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  Click <strong>Connect Drive</strong> in the top bar. Sign in with your Google account.
                  The tool creates a dedicated folder called <code className="bg-neutral-200 px-1 py-0.5 rounded font-mono text-[10px]">VisualBoard Workspace</code> in your Drive.
                  Whenever you add or change cards, it saves straight to your Google Drive! When opening on your laptop or work PC, your work is always there.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 flex gap-3">
              <div className="w-6 h-6 rounded-full bg-neutral-700 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                3
              </div>
              <div className="space-y-1 flex-1">
                <div className="font-semibold text-neutral-800 text-xs">
                  Double Protection: Local Storage &amp; Offline Backups
                </div>
                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  Even if your internet disconnects, the app continuously persists everything to your browser's local database.
                  You can also click the <strong>Download icon</strong> in the top bar anytime to export a standalone <code className="bg-neutral-200 px-1 py-0.5 rounded font-mono text-[10px]">.json</code> backup to your Windows 10 Documents folder.
                </p>
              </div>
            </div>
          </div>

          {/* Standalone Local Developer Run (Optional) */}
          <div className="p-3 rounded-xl border border-dashed border-neutral-300 bg-white">
            <div className="flex items-center gap-2 font-semibold text-xs text-neutral-800 mb-1">
              <Terminal className="w-4 h-4 text-neutral-600" />
              <span>Want to run your own local Node server on Windows?</span>
            </div>
            <p className="text-[11px] text-neutral-500 mb-2">
              You can download this codebase via the AI Studio menu (<strong>Settings &gt; Export project</strong>), install free Node.js on Windows 10, and run:
            </p>
            <pre className="bg-neutral-900 text-neutral-100 p-2 rounded-md font-mono text-[10px] overflow-x-auto">
              cd visual-board-workspace{'\n'}npm install{'\n'}npm run dev
            </pre>
            <p className="text-[10px] text-neutral-400 mt-1">
              Then navigate to <code className="text-neutral-700 font-mono">http://localhost:3000</code> in Edge or Chrome!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>No monthly fees • Unlimited boards &amp; cards</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Got it, Let's build!
          </button>
        </div>
      </div>
    </div>
  );
};
