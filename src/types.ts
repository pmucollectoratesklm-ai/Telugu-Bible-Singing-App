export type Testament = 'old' | 'new';

export interface BibleVerse {
  bookId: string;
  bookNameTelugu: string;
  bookNameEnglish: string;
  chapterNumber: number;
  verseNumber: number;
  teluguText: string;
  transliteration: string;
  meaning: string;
  swaras?: string;
}

export interface BibleChapter {
  chapterNumber: number;
  title?: string;
  theme?: string;
  verses: BibleVerse[];
}

export interface BibleBook {
  id: string;
  nameTelugu: string;
  nameEnglish: string;
  testament: Testament;
  totalChapters: number;
  category: 'law' | 'history' | 'poetry' | 'prophets' | 'gospels' | 'epistles' | 'revelation';
}

export interface VoiceOption {
  id: string;
  nameTelugu: string;
  nameEnglish: string;
  gender: 'female' | 'male' | 'ensemble';
  descriptionTelugu: string;
  descriptionEnglish: string;
  geminiVoice: 'Kore' | 'Fenrir' | 'Puck' | 'Charon' | 'Zephyr';
  pitchOffset: number; // semitones adjustment
  baseFrequency: number; // Hz for synthesizer
}

export interface RagaOption {
  id: string;
  nameTelugu: string;
  nameEnglish: string;
  moodTelugu: string;
  moodEnglish: string;
  notes: string[]; // ['C4', 'D4', 'E4', 'G4', 'A4', 'C5']
  swaraScale: string; // "స రి గ ప ద స'"
  description: string;
  baseTempoBpm: number;
}

export interface SongComposition {
  songTitle: string;
  raga: string;
  ragaDescription: string;
  tempoBpm: number;
  tala: string;
  mood: string;
  swaras: string;
  stanzas: Array<{
    type: string;
    telugu: string;
    transliteration: string;
    swaraLine?: string;
    chords?: string[];
    durationSeconds?: number;
  }>;
  singingTips?: string;
  recommendedInstrument?: string;
}

export type RhythmPattern = 'adi_tala' | 'roopaka_tala' | 'bhajana_tala' | 'chimes_only' | 'none';

export type BackgroundMusicStyle =
  | 'worship_piano'     // Christian Worship Piano & Silky Strings Pad (Default - gentle & holy)
  | 'acoustic_guitar'   // Gentle Acoustic Guitar & Celestial Harp Arpeggios
  | 'sacred_strings'    // Soothing Cathedral Strings & Chimes
  | 'soothing_tanpura'  // Pure Sine Devotional Tanpura (Silky, Zero harsh buzz)
  | 'vocals_only';      // Muted background - 100% pure clean singing vocals

export interface AudioEngineSettings {
  speed: number; // 0.5 to 2.0
  pitchSemi: number; // -6 to +6 semitones
  masterVolume: number; // 0 to 1
  vocalVolume: number; // 0 to 1
  accompanimentVolume: number; // 0 to 1
  tanpuraVolume: number; // 0 to 1
  voiceId: string;
  ragaId: string;

  // Background Music Style & Controls
  bgMusicStyle: BackgroundMusicStyle;
  bgMusicMuted: boolean;

  // Listening Scope: Whole Chapter vs Individual Verse
  listenMode: 'chapter' | 'verse';
  repeatMode: 'none' | 'verse' | 'chapter';
  autoAdvanceVerse: boolean;

  // Music Effects (సంగీత ఎఫెక్టులు)
  reverbEnabled: boolean;
  reverbLevel: number; // 0 to 1
  reverbType: 'cathedral' | 'temple' | 'sanctuary' | 'intimate';

  echoEnabled: boolean;
  echoTime: number; // 0.1 to 0.8s
  echoFeedback: number; // 0 to 0.8
  echoLevel: number; // 0 to 1

  chorusEnabled: boolean;
  chorusLevel: number; // 0 to 1

  rhythmEnabled: boolean;
  rhythmPattern: RhythmPattern;
  rhythmVolume: number; // 0 to 1

  fluteEnabled: boolean;
  fluteVolume: number; // 0 to 1

  eqBass: number; // -10 to +10 dB
  eqTreble: number; // -10 to +10 dB

  vocalMode: 'gemini_ai' | 'devotional_synth';
}

export interface PdfUploadData {
  filename: string;
  bookNameTelugu: string;
  bookNameEnglish: string;
  chapterNumber: number;
  title?: string;
  theme?: string;
  verses: BibleVerse[];
}

export interface DailyVerse {
  id: string;
  dayIndex: number;
  bookId: string;
  bookNameTelugu: string;
  bookNameEnglish: string;
  chapterNumber: number;
  verseNumber: number;
  teluguText: string;
  transliteration: string;
  meaning: string;
  swaras: string;
  voiceId: string;
  ragaId: string;
  tempo: number;
  pitchSemi: number;
  themeTelugu: string;
  themeEnglish: string;
  reflectionTelugu: string;
  reflectionEnglish: string;
}
