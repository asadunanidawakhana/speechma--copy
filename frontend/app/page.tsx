"use client";
import React, { useState, useEffect } from 'react';

export default function Home() {
  const [text, setText] = useState('');
  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('en-US-AriaNeural');
  const [rate, setRate] = useState('+0%');
  const [pitch, setPitch] = useState('+0Hz');
  const [removeSilence, setRemoveSilence] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [userCaptcha, setUserCaptcha] = useState('');
  const [captchaError, setCaptchaError] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchingVoices, setFetchingVoices] = useState(true);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

  const generateCaptcha = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptcha(code);
    setUserCaptcha('');
    setCaptchaError(false);
  };

  useEffect(() => {
    generateCaptcha();
    setFetchingVoices(true);
    fetch(`${API_BASE_URL}/api/voices`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setVoices(data);
        setFetchError(null);
      })
      .catch(err => {
        console.error('Error fetching voices:', err);
        setFetchError(err.message || 'Could not connect to the voice API');
      })
      .finally(() => setFetchingVoices(false));
  }, []);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    if (userCaptcha !== captcha) {
      setCaptchaError(true);
      return;
    }
    setLoading(true);
    setAudioUrl(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: selectedVoice, rate, pitch, remove_silence: removeSilence })
      });
      if (res.ok) {
        const blob = await res.blob();
        setAudioUrl(URL.createObjectURL(blob));
        generateCaptcha(); // Refresh captcha on success
      } else {
        alert("Failed to generate audio.");
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const filteredVoices = voices.filter(v => 
    v.FriendlyName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.Locale.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen container mx-auto px-4 py-8 max-w-5xl">
      <header className="mb-12 text-center mt-6">
        <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-400 mb-4 tracking-tight">Speechas</h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto font-light">Convert any text into high-quality realistic speech. Choose from hundreds of voices and tweak pitch, rate, and silence dynamically.</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 transition-all duration-200 hover:shadow-md hover:border-blue-100">
            <label className="block text-sm font-semibold text-slate-800 mb-3">Your Text</label>
            <textarea 
              className="w-full h-48 p-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none text-slate-800 text-lg leading-relaxed shadow-inner"
              placeholder="Start typing your script here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Speed Rate ({rate})</label>
                <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer font-medium" value={rate} onChange={e => setRate(e.target.value)}>
                  <option value="-50%">0.5x Slower</option>
                  <option value="-25%">0.75x Slower</option>
                  <option value="+0%">1.0x Normal</option>
                  <option value="+25%">1.25x Faster</option>
                  <option value="+50%">1.5x Faster</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Pitch Tone ({pitch})</label>
                <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer font-medium" value={pitch} onChange={e => setPitch(e.target.value)}>
                  <option value="-50Hz">Much Deeper</option>
                  <option value="-20Hz">Deeper</option>
                  <option value="+0Hz">Default</option>
                  <option value="+20Hz">Higher</option>
                  <option value="+50Hz">Much Higher</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <button 
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${removeSilence ? 'bg-blue-500' : 'bg-slate-300'}`}
                onClick={() => setRemoveSilence(!removeSilence)}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${removeSilence ? 'translate-x-6' : 'translate-x-1'} shadow-sm`} />
              </button>
              <div className="flex flex-col" onClick={() => setRemoveSilence(!removeSilence)}>
                <label className="text-sm font-semibold text-slate-800 cursor-pointer">
                  Remove Silences (Real-time Trim)
                </label>
                <span className="text-xs text-slate-500 cursor-pointer">Cuts out quiet gaps between words (requires FFmpeg)</span>
              </div>
            </div>

            <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="block text-sm font-semibold text-slate-800 mb-3">Security Verification</label>
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white px-6 py-3 rounded-xl border-2 border-dashed border-blue-200 select-none">
                    <span className="text-2xl font-black tracking-[0.5em] text-blue-600 line-through decoration-slate-300 italic">{captcha}</span>
                  </div>
                  <button 
                    onClick={generateCaptcha}
                    className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                    title="Refresh Captcha"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  </button>
                </div>
                <div className="flex-1 w-full">
                  <input 
                    type="text" 
                    placeholder="Enter digits above" 
                    className={`w-full p-3.5 bg-white border ${captchaError ? 'border-red-500 ring-4 ring-red-500/10' : 'border-slate-200'} rounded-xl text-center text-lg font-bold tracking-widest outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all`}
                    value={userCaptcha}
                    onChange={(e) => {
                      setUserCaptcha(e.target.value.replace(/\D/g, ''));
                      setCaptchaError(false);
                    }}
                    maxLength={4}
                  />
                  {captchaError && <p className="text-red-500 text-xs mt-2 font-medium">Please enter the correct numbers to continue.</p>}
                </div>
              </div>
            </div>

            <button 
              className="w-full mt-8 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/25 transition-all outline-none focus:ring-4 focus:ring-orange-500/30 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center gap-2 text-lg"
              onClick={handleGenerate}
              disabled={loading || !text.trim()}
            >
              {loading ? (
                <><span className="animate-spin inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></span> Generating Speech...</>
              ) : (
                <>Generate Audio</>
              )}
            </button>
          </div>

          {audioUrl && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 transform transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800">Your Audio is Ready! 🎉</h3>
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">Success</span>
              </div>
              <audio controls className="w-full mb-6 outline-none" src={audioUrl} />
              <a 
                href={audioUrl}
                download={`speechas_${Date.now()}.mp3`}
                className="inline-flex w-full justify-center items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold py-4 px-6 rounded-2xl transition-colors shadow-md hover:shadow-lg focus:ring-4 focus:ring-slate-800/20 active:scale-[0.98]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Download Voice .mp3
              </a>
            </div>
          )}
        </section>

        <aside className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col h-[900px]">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Voice Catalog</h2>
            <p className="text-slate-500 text-sm">Select a voice for your speech</p>
          </div>
          <div className="relative mb-6">
            <input 
              type="text" 
              placeholder="Search by language, country, or name..." 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-colors text-slate-800"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <svg className="w-5 h-5 text-slate-400 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-3 space-y-4 custom-scrollbar">
            {fetchingVoices ? (
              <div className="text-center py-10">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full mb-3"></div>
                <p className="text-slate-500 text-sm font-medium">Loading voice catalog...</p>
              </div>
            ) : fetchError ? (
              <div className="text-center py-10 bg-red-50 rounded-2xl border border-red-100 p-4">
                <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <p className="text-red-700 text-sm font-bold mb-1">API Connection Failed</p>
                <p className="text-red-500 text-xs mb-4">{fetchError}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="text-xs font-bold text-white bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Retry Connection
                </button>
                <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
                  Tip: If deployed on Netlify, ensure <code className="bg-slate-100 px-1 rounded text-red-600">NEXT_PUBLIC_API_URL</code> is set to your live backend URL.
                </p>
              </div>
            ) : filteredVoices.length === 0 ? (
              <div className="text-center py-10">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <p className="text-slate-500 text-sm font-medium">No voices found matching "{searchQuery}"</p>
              </div>
            ) : (
              filteredVoices.map(v => {
                const isSelected = selectedVoice === v.ShortName;
                const voiceName = v.FriendlyName.split('-')[0].replace('Microsoft', '').trim();
                return (
                  <div 
                    key={v.ShortName} 
                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 group ${isSelected ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-500' : 'border-slate-100 hover:border-slate-300 hover:shadow-sm bg-white'}`}
                    onClick={() => setSelectedVoice(v.ShortName)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {isSelected && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                        <h4 className={`font-bold text-base truncate pr-2 ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>{voiceName}</h4>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-medium tracking-wide ${v.Gender === 'Female' ? 'bg-pink-100/80 text-pink-700' : 'bg-blue-100/80 text-blue-700'}`}>
                        {v.Gender}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-4 flex items-center gap-1.5 font-medium">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      {v.Locale}
                    </p>
                    
                    <div className="flex gap-2">
                      <button 
                        className={`text-sm font-semibold flex-1 px-4 py-2.5 rounded-xl transition-all flex justify-center items-center gap-2 ${isSelected ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md shadow-blue-500/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 group-hover:bg-blue-100/50 group-hover:text-blue-600'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const btn = e.currentTarget;
                          const originalText = btn.innerHTML;
                          btn.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-currentColor border-t-transparent rounded-full"></span>';
                          
                          const text = `Hi, I am an AI voice from ${v.Locale}.`;
                          fetch(`${API_BASE_URL}/api/generate`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text, voice: v.ShortName })
                          }).then(r => r.blob()).then(b => {
                            const url = URL.createObjectURL(b);
                            const a = new Audio(url);
                            a.play();
                            a.onended = () => { btn.innerHTML = originalText; };
                          }).catch(() => {
                            btn.innerHTML = originalText;
                          });
                        }}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        Listen
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
