export type NotchState = 'resting' | 'hover' | 'pulled' | 'drawer' | 'shelf' | 'dev' | 'media';

export type AmbientLightingState = 'nominal' | 'thermal' | 'microphone' | 'download';

export type ActiveWindowContext = 'vscode' | 'chrome' | 'blender' | 'terminal' | 'fullscreen_game';

export interface FileItem {
  id: string;
  name: string;
  path: string;
  sizeFormatted: string;
  type: string;
  extension: string;
  addedAt: number;
}

export interface ClipboardItem {
  id: string;
  content: string;
  type: 'text' | 'hex' | 'json';
  timestamp: string;
}

export interface LocalPortProbe {
  port: number;
  label: string;
  status: 'active' | 'inactive' | 'probing';
  latencyMs: number;
}

export interface QuickScript {
  id: string;
  name: string;
  type: 'powershell' | 'bash' | 'batch';
  command: string;
  lastRun?: string;
  status: 'idle' | 'running' | 'success';
}

export interface LyricLine {
  timeMs: number;
  text: string;
}

export interface TrackMetadata {
  title: string;
  artist: string;
  albumArtUrl?: string;
  dominantColor: string; // e.g. #2dd4bf (teal fallback) or dynamic hex from art
  positionSeconds: number;
  durationSeconds: number;
  isPlaying: boolean;
}

export type NotchPage = 'media' | 'focus' | 'system' | 'shelf' | 'toggles';

export interface ArchitectureFile {
  path: string;
  language: string;
  title: string;
  description: string;
  code: string;
}

