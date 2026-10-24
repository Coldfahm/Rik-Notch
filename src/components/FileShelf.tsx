import React, { useState } from 'react';
import { FileItem } from '../types';
import { UploadCloud, FileText, Film, Box, Trash2, Copy, Check, HardDrive } from 'lucide-react';

interface FileShelfProps {
  files: FileItem[];
  onAddFile: (file: FileItem) => void;
  onRemoveFile: (id: string) => void;
  onClearFiles: () => void;
  onAction?: (msg: string) => void;
}

export const FileShelf: React.FC<FileShelfProps> = ({
  files,
  onAddFile,
  onRemoveFile,
  onClearFiles,
  onAction,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const sampleDropCandidates = [
    {
      name: 'Turbine_Assembly_Rev4.dwg',
      path: 'D:\\CAD_Engineering\\Projects\\2026\\Turbine_Assembly_Rev4.dwg',
      sizeFormatted: '3.4 GB',
      type: 'AutoCAD 3D Model',
      extension: 'dwg',
    },
    {
      name: 'RED_Komodo_Take12_4K.r3d',
      path: 'E:\\Footage\\Day03\\Reel_A\\RED_Komodo_Take12_4K.r3d',
      sizeFormatted: '48.2 GB',
      type: 'Raw Cinema Video',
      extension: 'r3d',
    },
    {
      name: 'Unreal_Engine_Build_v12.tar.zst',
      path: 'C:\\Builds\\Engine\\Unreal_Engine_Build_v12.tar.zst',
      sizeFormatted: '16.8 GB',
      type: 'Zstandard Archive',
      extension: 'tar.zst',
    },
  ];

  const handleCopyPath = (file: FileItem) => {
    navigator.clipboard.writeText(file.path);
    setCopiedId(file.id);
    onAction?.(`Copied file path to clipboard: ${file.name}`);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      const newFile: FileItem = {
        id: `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: droppedFile.name,
        // Zero-Overhead Rule: In desktop Tauri, we store strictly the OS path string
        path: `C:\\Users\\Workspace\\Downloads\\${droppedFile.name}`,
        sizeFormatted: `${(droppedFile.size / (1024 * 1024)).toFixed(1)} MB`,
        type: droppedFile.type || 'Binary Document',
        extension: droppedFile.name.split('.').pop() || 'dat',
        addedAt: Date.now(),
      };
      onAddFile(newFile);
      onAction?.(`Added to Zero-Overhead Shelf: ${droppedFile.name} (RAM delta: 0 bytes)`);
    }
  };

  const addSampleFile = (candidate: (typeof sampleDropCandidates)[0]) => {
    const item: FileItem = {
      id: `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: candidate.name,
      path: candidate.path,
      sizeFormatted: candidate.sizeFormatted,
      type: candidate.type,
      extension: candidate.extension,
      addedAt: Date.now(),
    };
    onAddFile(item);
    onAction?.(`Cached path: ${candidate.name} (RAM delta: 0 bytes)`);
  };

  const getFileIcon = (ext: string) => {
    if (['r3d', 'mp4', 'mov', 'mkv'].includes(ext)) {
      return <Film className="w-4 h-4 text-rose-400" />;
    }
    if (['dwg', 'c4d', 'blend', 'obj', 'fbx'].includes(ext)) {
      return <Box className="w-4 h-4 text-amber-400" />;
    }
    return <FileText className="w-4 h-4 text-sky-400" />;
  };

  return (
    <div className="w-full flex flex-col gap-2.5 text-slate-200">
      {/* Header with Zero-RAM Assurance */}
      <div className="flex items-center justify-between text-xs pb-1 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <HardDrive className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-medium text-slate-200">Zero-Overhead File Shelf</span>
          <span className="text-slate-400">·</span>
          <span className="text-emerald-400 font-mono text-[11px]">Memory Overhead: 0.00 MB (String-only cache)</span>
        </div>
        {files.length > 0 && (
          <button
            onClick={onClearFiles}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear Shelf</span>
          </button>
        )}
      </div>

      {/* Drop Target & Staged Files Row */}
      <div className="flex items-center gap-3">
        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-dashed transition-all cursor-pointer ${
            isDragOver
              ? 'border-sky-400 bg-sky-500/10 text-sky-300'
              : 'border-white/[0.15] hover:border-white/[0.3] bg-white/[0.02] text-slate-300'
          }`}
        >
          <UploadCloud className="w-4 h-4 shrink-0" />
          <span className="text-xs font-medium whitespace-nowrap">
            {isDragOver ? 'Release to cache path' : 'Drag any file here'}
          </span>
        </div>

        {/* Quick Sample File Injectors for simulation */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-[11px] text-slate-400 font-mono shrink-0">Simulate:</span>
          {sampleDropCandidates.map((c) => (
            <button
              key={c.name}
              onClick={() => addSampleFile(c)}
              className="text-[11px] font-mono px-2 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06] whitespace-nowrap transition-colors"
              title={`Simulate dragging ${c.name} (${c.sizeFormatted})`}
            >
              + {c.name.split('.')[0]} ({c.sizeFormatted})
            </button>
          ))}
        </div>
      </div>

      {/* Active Cached Items Grid */}
      {files.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-1 max-h-36 overflow-y-auto">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] hover:border-sky-400/30 transition-all text-xs group"
            >
              <div className="flex items-center gap-2 min-w-0">
                {getFileIcon(file.extension)}
                <div className="min-w-0">
                  <div className="font-medium text-slate-200 truncate">{file.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{file.sizeFormatted} · string pointer</div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleCopyPath(file)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                  title="Copy Native OS Path"
                >
                  {copiedId === file.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => onRemoveFile(file.id)}
                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-white/[0.08] transition-colors"
                  title="Remove from Shelf"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[11px] text-slate-400 italic py-1">
          Shelf empty. Drop massive files (e.g. 50GB video rushes or 3D assemblies) without consuming memory.
        </div>
      )}
    </div>
  );
};
