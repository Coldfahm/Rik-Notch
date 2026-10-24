import React, { useState } from 'react';
import { Volume2, VolumeX, Sun, Wifi, Bluetooth, Network, ArrowRightLeft, ShieldCheck } from 'lucide-react';

interface ControlCenterDrawerProps {
  volume: number;
  setVolume: (val: number) => void;
  brightness: number;
  setBrightness: (val: number) => void;
  wifiEnabled: boolean;
  setWifiEnabled: (val: boolean | ((prev: boolean) => boolean)) => void;
  bluetoothEnabled: boolean;
  setBluetoothEnabled: (val: boolean | ((prev: boolean) => boolean)) => void;
  onAction?: (msg: string) => void;
}

export const ControlCenterDrawer: React.FC<ControlCenterDrawerProps> = ({
  volume,
  setVolume,
  brightness,
  setBrightness,
  wifiEnabled,
  setWifiEnabled,
  bluetoothEnabled,
  setBluetoothEnabled,
  onAction,
}) => {
  const [dedicatedAdapter, setDedicatedAdapter] = useState<'eth0' | 'wlan0' | 'dual'>('eth0');
  const [tiktokStudioBound, setTiktokStudioBound] = useState(true);
  const [showNetworkRouting, setShowNetworkRouting] = useState(false);

  return (
    <div className="w-full flex flex-col gap-3.5 py-1 px-2 text-slate-200">
      {/* Primary Single-Row Mechanical Command Bar */}
      <div className="flex items-center justify-between gap-4 flex-nowrap">
        {/* Master Volume Slim Horizontal Slider */}
        <div className="flex items-center gap-2.5 min-w-[170px] bg-white/[0.04] hover:bg-white/[0.07] px-3 py-1.5 rounded-lg border border-white/[0.06] transition-colors">
          <button
            onClick={() => {
              setVolume(volume > 0 ? 0 : 75);
              onAction?.(volume > 0 ? 'Muted audio' : 'Unmuted audio (75%)');
            }}
            className="text-slate-400 hover:text-white transition-colors"
            title="Toggle Mute"
          >
            {volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <div className="flex-1 flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-700/60 rounded-full appearance-none cursor-pointer accent-sky-400"
            />
            <span className="font-mono text-xs tabular-nums text-slate-400 w-7 text-right">
              {volume}%
            </span>
          </div>
        </div>

        {/* Master Brightness Slim Slider */}
        <div className="flex items-center gap-2.5 min-w-[170px] bg-white/[0.04] hover:bg-white/[0.07] px-3 py-1.5 rounded-lg border border-white/[0.06] transition-colors">
          <Sun className="w-4 h-4 text-amber-300/80 shrink-0" />
          <div className="flex-1 flex items-center gap-2">
            <input
              type="range"
              min="10"
              max="100"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-700/60 rounded-full appearance-none cursor-pointer accent-amber-400"
            />
            <span className="font-mono text-xs tabular-nums text-slate-400 w-7 text-right">
              {brightness}%
            </span>
          </div>
        </div>

        {/* Quick Toggles: Wi-Fi & Bluetooth */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setWifiEnabled((prev: boolean) => !prev);
              onAction?.(`Wi-Fi ${!wifiEnabled ? 'Connected (5GHz 1200Mbps)' : 'Disabled'}`);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              wifiEnabled
                ? 'bg-sky-500/15 border-sky-400/30 text-sky-300'
                : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>{wifiEnabled ? 'Wi-Fi 6E' : 'Off'}</span>
          </button>

          <button
            onClick={() => {
              setBluetoothEnabled((prev: boolean) => !prev);
              onAction?.(`Bluetooth ${!bluetoothEnabled ? 'Ready (AptX Low Latency)' : 'Disabled'}`);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              bluetoothEnabled
                ? 'bg-indigo-500/15 border-indigo-400/30 text-indigo-300'
                : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bluetooth className="w-3.5 h-3.5" />
            <span>{bluetoothEnabled ? 'BT 5.3' : 'Off'}</span>
          </button>

          {/* Network Adapter Routing Accordion Button */}
          <button
            onClick={() => setShowNetworkRouting(!showNetworkRouting)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              showNetworkRouting
                ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
                : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-slate-200'
            }`}
            title="Hardware Network Routing & Streamer QoS"
          >
            <Network className="w-3.5 h-3.5" />
            <span>NIC Throttling</span>
          </button>
        </div>
      </div>

      {/* Network Hardware Routing & Software Traffic Throttling Sub-Drawer */}
      {showNetworkRouting && (
        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-300 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono">Adapter Route:</span>
            <div className="flex items-center bg-black/40 p-0.5 rounded border border-white/[0.08]">
              <button
                onClick={() => setDedicatedAdapter('eth0')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  dedicatedAdapter === 'eth0'
                    ? 'bg-sky-500/20 text-sky-300 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                NIC 1 (10GbE Primary)
              </button>
              <button
                onClick={() => setDedicatedAdapter('wlan0')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  dedicatedAdapter === 'wlan0'
                    ? 'bg-sky-500/20 text-sky-300 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                NIC 2 (Dedicated Stream)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300">TikTok LIVE Studio:</span>
              <button
                onClick={() => {
                  setTiktokStudioBound(!tiktokStudioBound);
                  onAction?.(
                    !tiktokStudioBound
                      ? 'TikTok LIVE Studio traffic isolated to NIC 2 (Zero game jitter)'
                      : 'TikTok LIVE Studio unbound'
                  );
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                  tiktokStudioBound
                    ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300'
                    : 'bg-white/[0.04] border-white/[0.08] text-slate-400'
                }`}
              >
                {tiktokStudioBound ? 'Bound to NIC 2 (120 Mbps)' : 'Unrestricted'}
              </button>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Gaming Ping: 9ms</span>
          </div>
        </div>
      )}
    </div>
  );
};
