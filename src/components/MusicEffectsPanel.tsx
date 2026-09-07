import React from 'react';
import {
  Wand2,
  Waves,
  Sparkles,
  Volume2,
  RotateCcw,
  Check,
  Disc,
  Sliders,
  Radio,
  Music,
} from 'lucide-react';
import { AudioEngineSettings, RhythmPattern } from '../types';

interface MusicEffectsPanelProps {
  settings: AudioEngineSettings;
  onUpdateSettings: (newSettings: Partial<AudioEngineSettings>) => void;
  onApplyPreset: (preset: 'cathedral' | 'temple' | 'joyful' | 'meditative') => void;
  onClose?: () => void;
  onTriggerAiVocal?: () => void;
  isGeneratingAiAudio?: boolean;
  hasAiAudio?: boolean;
}

export const MusicEffectsPanel: React.FC<MusicEffectsPanelProps> = ({
  settings,
  onUpdateSettings,
  onApplyPreset,
  onClose,
  onTriggerAiVocal,
  isGeneratingAiAudio,
  hasAiAudio,
}) => {
  return (
    <div className="bg-stone-900/95 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl text-stone-100 max-w-4xl mx-auto space-y-5 animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Wand2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-amber-200 flex items-center gap-2">
              సంగీత ఎఫెక్టులు & ధ్వని శైలి
              <span className="text-[11px] font-sans font-normal px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                DSP Audio Studio
              </span>
            </h3>
            <p className="text-xs text-stone-400">
              దేవాలయ ప్రతిధ్వని (Reverb), సంగీత ఎకో (Delay), మృదంగ తాళం & AI గాత్ర ప్రభావాలు
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 text-xs px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 transition-colors"
          >
            మూసివేయి ✕
          </button>
        )}
      </div>

      {/* 1-Touch Ambience Soundscape Presets */}
      <div>
        <label className="text-xs font-semibold text-stone-300 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          తక్షణ సంగీత వాతావరణం (One-Touch Ambience Presets):
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => onApplyPreset('cathedral')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              settings.reverbType === 'cathedral' && settings.reverbEnabled
                ? 'bg-amber-600/20 border-amber-500 text-amber-200 shadow-sm'
                : 'bg-stone-800/60 hover:bg-stone-800 border-stone-700/60 text-stone-300'
            }`}
          >
            <div className="font-semibold text-xs flex items-center gap-1.5">
              <span>🏛️</span> గాన మందిరం
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">చర్చి ప్రతిధ్వని & ఎకో</div>
          </button>

          <button
            onClick={() => onApplyPreset('temple')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              settings.reverbType === 'temple' && settings.rhythmPattern === 'adi_tala'
                ? 'bg-amber-600/20 border-amber-500 text-amber-200 shadow-sm'
                : 'bg-stone-800/60 hover:bg-stone-800 border-stone-700/60 text-stone-300'
            }`}
          >
            <div className="font-semibold text-xs flex items-center gap-1.5">
              <span>🛕</span> దేవాలయ శాంతి
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">మృదంగ తాళం & తంబుర</div>
          </button>

          <button
            onClick={() => onApplyPreset('joyful')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              settings.rhythmPattern === 'bhajana_tala'
                ? 'bg-amber-600/20 border-amber-500 text-amber-200 shadow-sm'
                : 'bg-stone-800/60 hover:bg-stone-800 border-stone-700/60 text-stone-300'
            }`}
          >
            <div className="font-semibold text-xs flex items-center gap-1.5">
              <span>🥁</span> ఉల్లాస సంకీర్తన
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">భజన తాళం & వేగం</div>
          </button>

          <button
            onClick={() => onApplyPreset('meditative')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              settings.reverbType === 'cathedral' && !settings.rhythmEnabled
                ? 'bg-amber-600/20 border-amber-500 text-amber-200 shadow-sm'
                : 'bg-stone-800/60 hover:bg-stone-800 border-stone-700/60 text-stone-300'
            }`}
          >
            <div className="font-semibold text-xs flex items-center gap-1.5">
              <span>🪷</span> ధ్యాన ప్రార్థన
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">ప్రశాంత శ్రుతి & వేణువు</div>
          </button>
        </div>
      </div>

      {/* AI Vocalist Enhancement Section */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/40 via-stone-800/80 to-stone-900 border border-amber-500/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                AI గాత్ర విధానం (AI Vocal Sound Engine):
              </span>
              {hasAiAudio && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" /> స్టూడియో ఆడియో సిద్ధంగా ఉంది
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Gemini Studio AI తో పాడే స్వచ్ఛమైన తెలుగు కీర్తన ఆడియో, లేదా ప్రత్యక్ష శాస్త్రీయ సింథసైజర్.
            </p>
          </div>

          {onTriggerAiVocal && (
            <button
              onClick={onTriggerAiVocal}
              disabled={isGeneratingAiAudio}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-md shadow-amber-600/30 transition-all active:scale-95 disabled:opacity-50 shrink-0 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isGeneratingAiAudio ? 'AI స్వరగానం తయారవుతోంది...' : 'కొత్త AI గాత్రం పాడించండి'}
            </button>
          )}
        </div>
      </div>

      {/* Grid of Sound Effects: Reverb, Echo, Rhythm, EQ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Effect 1: Cathedral Reverb */}
        <div className="p-3.5 rounded-xl bg-stone-800/60 border border-stone-700/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Waves className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-xs text-stone-200">
                దేవాలయ ప్రతిధ్వని (Sacred Reverb)
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.reverbEnabled}
                onChange={(e) => onUpdateSettings({ reverbEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <div className="grid grid-cols-4 gap-1 pt-1">
            {[
              { id: 'cathedral', label: 'చర్చి' },
              { id: 'temple', label: 'దేవాలయం' },
              { id: 'sanctuary', label: 'ప్రార్థన' },
              { id: 'intimate', label: 'సన్నిహిత' },
            ].map((room) => (
              <button
                key={room.id}
                onClick={() =>
                  onUpdateSettings({
                    reverbType: room.id as any,
                    reverbEnabled: true,
                  })
                }
                className={`py-1 rounded text-[10px] font-semibold transition-all ${
                  settings.reverbType === room.id
                    ? 'bg-amber-500 text-stone-950'
                    : 'bg-stone-700/60 text-stone-300 hover:bg-stone-700'
                }`}
              >
                {room.label}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-stone-400">
              <span>ప్రతిధ్వని తీవ్రత (Wet Level)</span>
              <span className="text-amber-400 font-mono">
                {Math.round(settings.reverbLevel * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.reverbLevel}
              disabled={!settings.reverbEnabled}
              onChange={(e) => onUpdateSettings({ reverbLevel: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 h-1.5 bg-stone-700 rounded-lg cursor-pointer disabled:opacity-40"
            />
          </div>
        </div>

        {/* Effect 2: Echo & Tape Delay */}
        <div className="p-3.5 rounded-xl bg-stone-800/60 border border-stone-700/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Disc className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-xs text-stone-200">
                సంగీత ఎకో (Stereo Echo & Delay)
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.echoEnabled}
                onChange={(e) => onUpdateSettings({ echoEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-stone-400">
                <span>ఎకో సమయం (Time)</span>
                <span className="text-amber-400 font-mono">
                  {Math.round(settings.echoTime * 1000)}ms
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={settings.echoTime}
                disabled={!settings.echoEnabled}
                onChange={(e) => onUpdateSettings({ echoTime: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 h-1.5 bg-stone-700 rounded-lg cursor-pointer disabled:opacity-40"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-stone-400">
                <span>పునరావృతం (Feedback)</span>
                <span className="text-amber-400 font-mono">
                  {Math.round(settings.echoFeedback * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="0.75"
                step="0.05"
                value={settings.echoFeedback}
                disabled={!settings.echoEnabled}
                onChange={(e) => onUpdateSettings({ echoFeedback: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 h-1.5 bg-stone-700 rounded-lg cursor-pointer disabled:opacity-40"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-stone-400">
              <span>ఎకో మిక్స్ (Echo Volume)</span>
              <span className="text-amber-400 font-mono">
                {Math.round(settings.echoLevel * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.echoLevel}
              disabled={!settings.echoEnabled}
              onChange={(e) => onUpdateSettings({ echoLevel: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 h-1.5 bg-stone-700 rounded-lg cursor-pointer disabled:opacity-40"
            />
          </div>
        </div>

        {/* Effect 3: Mridangam & Tabla Rhythm */}
        <div className="p-3.5 rounded-xl bg-stone-800/60 border border-stone-700/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-xs text-stone-200">
                మృదంగం & భజన తాళం (Percussion Beats)
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.rhythmEnabled}
                onChange={(e) => onUpdateSettings({ rhythmEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <select
            value={settings.rhythmPattern}
            disabled={!settings.rhythmEnabled}
            onChange={(e) => onUpdateSettings({ rhythmPattern: e.target.value as RhythmPattern })}
            className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 disabled:opacity-40"
          >
            <option value="adi_tala">ఆది తాళం (Adi Taalam - 8 Beats Traditional)</option>
            <option value="roopaka_tala">రూపక తాళం (Roopaka Taalam - 6 Beats Waltz)</option>
            <option value="bhajana_tala">భజన తాళం (Bhajana Keerthana - 4 Beats Joyful)</option>
            <option value="chimes_only">ఘంటానాదం & కంచు తాళాలు (Sacred Chimes Only)</option>
            <option value="none">తాళం వద్దు (No Percussion)</option>
          </select>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-stone-400">
              <span>తాళం శబ్దం (Beats Volume)</span>
              <span className="text-amber-400 font-mono">
                {Math.round(settings.rhythmVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.rhythmVolume}
              disabled={!settings.rhythmEnabled}
              onChange={(e) => onUpdateSettings({ rhythmVolume: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 h-1.5 bg-stone-700 rounded-lg cursor-pointer disabled:opacity-40"
            />
          </div>
        </div>

        {/* Effect 4: Chorus & Equalizer Tone */}
        <div className="p-3.5 rounded-xl bg-stone-800/60 border border-stone-700/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-xs text-stone-200">
                స్వర మాధుర్యం & ఈక్వలైజర్ (Chorus & Tone)
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.chorusEnabled}
                onChange={(e) => onUpdateSettings({ chorusEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-stone-400">
                <span>బాస్ / గంభీరం</span>
                <span className="text-amber-400 font-mono">{settings.eqBass} dB</span>
              </div>
              <input
                type="range"
                min="-6"
                max="8"
                step="1"
                value={settings.eqBass}
                onChange={(e) => onUpdateSettings({ eqBass: parseInt(e.target.value) })}
                className="w-full accent-amber-500 h-1.5 bg-stone-700 rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-stone-400">
                <span>ట్రెబుల్ / తేటదనం</span>
                <span className="text-amber-400 font-mono">{settings.eqTreble} dB</span>
              </div>
              <input
                type="range"
                min="-6"
                max="8"
                step="1"
                value={settings.eqTreble}
                onChange={(e) => onUpdateSettings({ eqTreble: parseInt(e.target.value) })}
                className="w-full accent-amber-500 h-1.5 bg-stone-700 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-stone-400">
              <span>కోరస్ వెడల్పు (Chorus Width)</span>
              <span className="text-amber-400 font-mono">
                {Math.round(settings.chorusLevel * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.chorusLevel}
              disabled={!settings.chorusEnabled}
              onChange={(e) => onUpdateSettings({ chorusLevel: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 h-1.5 bg-stone-700 rounded-lg cursor-pointer disabled:opacity-40"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
