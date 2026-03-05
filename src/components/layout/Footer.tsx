import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-6 px-4 border-t border-black/5 bg-white/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-emerald-600">SyncSenta</span>
          <span className="text-xs text-slate-500">AI-Powered Education OS</span>
        </div>
        <div className="text-xs text-slate-400">
          © 2025 3D. All rights reserved. Strictly aligned with Kenya CBC.
        </div>
      </div>
    </footer>
  );
};
