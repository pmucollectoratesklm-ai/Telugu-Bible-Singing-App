import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, Music2, ArrowRight } from 'lucide-react';
import { BibleVerse } from '../types';

interface PdfUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPdfExtracted: (extractedData: {
    bookId: string;
    chapterNumber: number;
    title: string;
    theme: string;
    verses: BibleVerse[];
  }) => void;
}

export const PdfUploadModal: React.FC<PdfUploadModalProps> = ({
  isOpen,
  onClose,
  onPdfExtracted,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [extractedPreview, setExtractedPreview] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    setError(null);
    setIsProcessing(true);
    setProcessingStep('ఫైల్ చదువుతున్నాము (Reading file data)...');

    try {
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          setProcessingStep('AI ద్వారా తెలుగు బైబిల్ వచనములను సేకరిస్తున్నాము (Gemini AI extracting scriptures)...');

          const response = await fetch('/api/bible/parse-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pdfBase64: base64Data,
              mimeType: file.type || 'application/pdf',
              filename: file.name,
            }),
          });

          const resData = await response.json();
          if (!response.ok || !resData.success) {
            throw new Error(resData?.error || resData?.details || 'PDF parsing failed');
          }

          setProcessingStep('సంగీత స్వరకల్పనను సిద్ధం చేస్తున్నాము (Preparing musical composition)...');
          setExtractedPreview(resData.data);
          setIsProcessing(false);
        } catch (err: any) {
          console.error(err);
          setError(err?.message || 'తెలుగు బైబిల్ డాక్యుమెంట్ ప్రాసెస్ చేయడంలో విఫలమైంది.');
          setIsProcessing(false);
        }
      };

      reader.onerror = () => {
        setError('ఫైల్ చదవడంలో లోపం ఏర్పడింది.');
        setIsProcessing(false);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err?.message || 'PDF అప్‌లోడ్ విఫలమైంది.');
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Demo sample loader for testing extraction without having a PDF ready
  const loadDemoSample = async () => {
    setError(null);
    setIsProcessing(true);
    setProcessingStep('డెమో తెలుగు బైబిల్ భాగమును విశ్లేషిస్తున్నాము (Analyzing sample scriptures)...');

    try {
      const sampleText = `
కీర్తనలు 91 (Psalms 91)
1. మహోన్నతుని చాటున నివసించువాడే సర్వశక్తిమంతుని నీడను విశ్రమించువాడు.
2. ఆయన నా ఆశ్రయము నా కోట నేను నమ్ముకొను నా దేవుడని నేను యెహోవానుగూర్చి పలుకుచున్నాను.
3. వేటకాని ఉరిలోనుండి ఆయన నిన్ను విడిపించును, నాశనకరమైన తెగులు రాకుండా నిన్ను రక్షించును.
4. ఆయన తన రెక్కలతో నిన్ను కప్పును ఆయన రెక్కలక్రింద నీకు ఆశ్రయము కలుగును; ఆయన సత్యము కేడెమును పరిఘయునై యున్నది.
5. రాత్రివేళ కలుగు భయమునకైనను పగటివేళ ఎగురు బాణమునకైనను చీకటిలో సంచరించు తెగులునకైనను మధ్యాహ్నమందు పాడుచేయు రోగమునకైనను నీవు భయపడవు.
      `;

      const response = await fetch('/api/bible/parse-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: sampleText,
          filename: 'Sample_Psalms_91_Telugu.txt',
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData?.error || 'Sample loading failed');
      }

      setExtractedPreview(resData.data);
      setIsProcessing(false);
    } catch (err: any) {
      setError(err?.message || 'డెమో శాంపిల్ లోడ్ చేయడంలో విఫలమైంది.');
      setIsProcessing(false);
    }
  };

  const handleApplyExtracted = () => {
    if (!extractedPreview) return;

    const bookId = extractedPreview.bookNameEnglish?.toLowerCase().replace(/\s+/g, '') || 'psalms';
    const verses: BibleVerse[] = (extractedPreview.verses || []).map((v: any, index: number) => ({
      bookId,
      bookNameTelugu: extractedPreview.bookNameTelugu || 'కీర్తనలు',
      bookNameEnglish: extractedPreview.bookNameEnglish || 'Psalms',
      chapterNumber: extractedPreview.chapterNumber || 1,
      verseNumber: v.verseNumber || index + 1,
      teluguText: v.teluguText || '',
      transliteration: v.transliteration || '',
      meaning: v.meaning || '',
      swaras: 'స . గ . ప . ద . స\' . . . | స\' ద ప గ రి స',
    }));

    onPdfExtracted({
      bookId,
      chapterNumber: extractedPreview.chapterNumber || 1,
      title: extractedPreview.title || `${extractedPreview.bookNameTelugu} ${extractedPreview.chapterNumber}`,
      theme: extractedPreview.theme || 'దైవిక గాన కీర్తన',
      verses,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-stone-50 border border-amber-900/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-amber-900/10 bg-amber-100/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-700 text-white flex items-center justify-center shadow-xs">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-950 font-serif">
                తెలుగు బైబిల్ PDF అప్‌లోడ్
              </h2>
              <p className="text-xs text-amber-800">
                మీ తెలుగు బైబిల్ PDF లేదా టెక్స్ట్ ఫైల్‌ను అప్‌లోడ్ చేసి పాటలుగా మార్చండి
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-amber-800 hover:text-amber-950 hover:bg-amber-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Dropzone */}
          {!extractedPreview && !isProcessing && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-amber-600 bg-amber-100/50 scale-[1.01]'
                  : 'border-amber-300 bg-white hover:bg-amber-50/50 hover:border-amber-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-amber-950 mb-1">
                తెలుగు బైబిల్ PDF ఫైల్‌ను ఇక్కడ డ్రాగ్ చేయండి లేదా క్లిక్ చేసి ఎంచుకోండి
              </h3>
              <p className="text-xs text-stone-500 mb-3">
                PDF లేదా TXT ఫార్మాట్లకు మద్దతు ఉంది (గరిష్టంగా 50MB)
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold shadow-xs hover:bg-amber-700">
                <Upload className="w-3.5 h-3.5" />
                ఫైల్ ఎంచుకోండి (Select File)
              </div>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="py-12 px-6 text-center bg-white rounded-xl border border-amber-200 shadow-xs space-y-4">
              <Loader2 className="w-10 h-10 mx-auto text-amber-600 animate-spin" />
              <div>
                <h4 className="text-base font-bold text-amber-950 font-serif">
                  బైబిల్ గ్రంథమును ప్రాసెస్ చేస్తున్నాము...
                </h4>
                <p className="text-xs text-amber-800 mt-1">{processingStep}</p>
              </div>
              <div className="w-48 h-1.5 bg-amber-100 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-amber-600 rounded-full animate-pulse" />
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">లోపం:</span> {error}
              </div>
            </div>
          )}

          {/* Extracted Preview */}
          {extractedPreview && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h4 className="text-sm font-bold">
                      {extractedPreview.bookNameTelugu} - అధ్యాయం {extractedPreview.chapterNumber}
                    </h4>
                    <p className="text-xs text-emerald-700">
                      {extractedPreview.verses?.length || 0} వచనములు విజయవంతంగా సేకరించబడ్డాయి!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setExtractedPreview(null)}
                  className="text-xs font-medium text-stone-500 hover:text-stone-800 underline"
                >
                  మరొక ఫైల్ ఎంచుకోండి
                </button>
              </div>

              {/* Verses Preview List */}
              <div className="border border-stone-200 rounded-xl bg-white p-3 max-h-56 overflow-y-auto space-y-2">
                {extractedPreview.verses?.map((v: any, i: number) => (
                  <div key={i} className="p-2 rounded-lg bg-stone-50 text-xs border border-stone-100">
                    <span className="font-bold text-amber-900 mr-2">వ. {v.verseNumber}:</span>
                    <span className="text-stone-800 font-serif">{v.teluguText}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Demo Sample Excerpt Action */}
          {!extractedPreview && !isProcessing && (
            <div className="pt-2 border-t border-amber-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-stone-500">
                <span className="font-medium text-amber-900">మీ వద్ద PDF సిద్ధంగా లేదా?</span>
                <p>మా వద్ద ఉన్న తెలుగు బైబిల్ నమూనాతో తక్షణమే పరీక్షించండి.</p>
              </div>
              <button
                type="button"
                onClick={loadDemoSample}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-100/80 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                నమూనా బైబిల్ పరీక్షించండి (Try Sample)
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-amber-900/10 bg-stone-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white border border-stone-200 rounded-lg transition-colors"
          >
            మూసివేయి (Close)
          </button>

          {extractedPreview && (
            <button
              onClick={handleApplyExtracted}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-800 hover:to-amber-700 rounded-lg transition-all shadow-md shadow-amber-800/20 active:scale-95"
            >
              <Music2 className="w-3.5 h-3.5" />
              పాటగా మార్చండి & గానం వినండి
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
