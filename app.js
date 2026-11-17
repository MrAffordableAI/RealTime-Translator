'use strict';
const $ = id => document.getElementById(id);
const voices = {
  en: [['en-US-AriaNeural', 'Aria (English)']],
  es: [['es-MX-DaliaNeural', 'Dalia (Mexico)'], ['es-ES-ElviraNeural', 'Elvira (Spain)']],
  fr: [['fr-FR-DeniseNeural', 'Denise (French)']],
  pt: [['pt-BR-FranciscaNeural', 'Francisca (Portuguese)']],
  'zh-Hans': [['zh-CN-XiaoxiaoNeural', 'Xiaoxiao (Chinese)']]
};
let session = null, historyId = Date.now();
const storage = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* Session works without storage. */ } },
  remove(k) { try { localStorage.removeItem(k); } catch { /* Storage unavailable. */ } }
};
storage.remove('speechKey'); // Purge credentials saved by older versions.
function status(text, error = false) {
  $('status').textContent = text;
  $('status').className = 'text-center text-sm mb-4 ' + (error ? 'text-red-600' : '');
}
function controls(busy) {
  $('startBtn').disabled = busy;
  $('stopBtn').disabled = !busy;
  for (const id of ['speechKey','speechRegion','sourceLang','targetLang','voiceSelect']) $(id).disabled = busy;
}
function syncVoices(preferred) {
  const el = $('voiceSelect'), previous = preferred || el.value;
  el.replaceChildren();
  for (const [value, label] of voices[$('targetLang').value]) {
    const option = document.createElement('option');
    option.value = value; option.textContent = label; el.appendChild(option);
  }
  if ([...el.options].some(o => o.value === previous)) el.value = previous;
  storage.set('voiceSelect', el.value);
}
for (const id of ['speechRegion','sourceLang','targetLang']) {
  const saved = storage.get(id);
  if (saved && (id === 'speechRegion' || [...$(id).options].some(o => o.value === saved))) $(id).value = saved;
  $(id).onchange = () => { storage.set(id, $(id).value); if (id === 'targetLang') syncVoices(); };
}
syncVoices(storage.get('voiceSelect'));
$('voiceSelect').onchange = () => storage.set('voiceSelect', $('voiceSelect').value);
function theme() { $('themeToggle').textContent = document.documentElement.classList.contains('dark') ? 'Light' : 'Dark'; }
if (storage.get('theme') === 'dark') document.documentElement.classList.add('dark');
theme();
$('themeToggle').onclick = () => {
  document.documentElement.classList.toggle('dark');
  storage.set('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  theme();
};
function addMsg(container, text) {
  const el = document.createElement('div');
  el.textContent = '[' + new Date().toLocaleTimeString() + '] ' + text;
  container.appendChild(el); container.scrollTop = container.scrollHeight;
}
function readHistory() {
  try {
    const data = JSON.parse(storage.get('conversations') || '[]');
    return Array.isArray(data) ? data.filter(h => h && Number.isFinite(h.ts) && Array.isArray(h.orig) && Array.isArray(h.trans)).slice(0,20) : [];
  } catch { return []; }
}
function renderHistory() {
  $('historyList').replaceChildren();
  for (const h of readHistory()) {
    const el = document.createElement('div');
    el.textContent = new Date(h.ts).toLocaleString() + ' — ' + h.orig.length + ' turns';
    $('historyList').appendChild(el);
  }
}
function saveHistory() {
  const orig = [...$('originalTranscript').children].map(e => e.textContent);
  if (!orig.length) return;
  const trans = [...$('translatedTranscript').children].map(e => e.textContent);
  storage.set('conversations', JSON.stringify([{id:historyId,ts:Date.now(),orig,trans}, ...readHistory().filter(h => h.id !== historyId)].slice(0,20)));
  renderHistory();
}
function dispose(s) {
  if (s.closed) return;
  s.closed = true;
  for (const resource of [s.recognizer,s.synthesizer,s.player,s.audio]) {
    try { resource?.close(); } catch { /* Continue cleanup. */ }
  }
}
function stop(message = 'Stopped', error = false) {
  const s = session; session = null;
  if (s) {
    s.queue.length = 0;
    // Capture this instance; a delayed callback must not close a newer session.
    try {
      if (s.recognizer) s.recognizer.stopContinuousRecognitionAsync(() => dispose(s), () => dispose(s));
      else dispose(s);
    } catch { dispose(s); }
    try { s.player?.pause(); s.synthesizer?.close(); } catch { /* Already closed. */ }
  }
  controls(false); saveHistory(); status(message, error);
}
function speakNext(s) {
  if (session !== s || s.speaking || !s.queue.length) return;
  s.speaking = true;
  s.synthesizer.speakTextAsync(s.queue.shift(), result => {
    if (session !== s) return;
    if (result.reason !== SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
      s.queue.length = 0; s.speaking = false;
      status('Voice playback failed. Check Azure Speech access and restart.', true);
    }
    // Advance only after actual playback ends, not synthesis completion.
  }, () => {
    if (session !== s) return;
    s.queue.length = 0; s.speaking = false;
    status('Voice playback failed. Check audio permission and restart.', true);
  });
}
async function start() {
  if (session) return;
  const key = $('speechKey').value.trim(), region = $('speechRegion').value.trim();
  const source = $('sourceLang').value, target = $('targetLang').value;
  if (!key || !/^[a-z0-9]+$/.test(region)) return status('Enter an Azure Speech key and its region (for example eastus).', true);
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) return status('Use HTTPS or localhost and allow microphone access.', true);
  if (!window.SpeechSDK) return status('Azure Speech SDK did not load. Check your connection and reload.', true);
  if ((source === 'zh-CN' ? 'zh-Hans' : source.split('-')[0]) === target) return status('Choose different source and target languages.', true);
  const s = {queue:[],speaking:false,closed:false}; session = s;
  controls(true); status('Starting microphone…');
  try {
    const config = SpeechSDK.SpeechTranslationConfig.fromSubscription(key,region);
    config.speechRecognitionLanguage = source === 'auto' ? 'es-MX' : source;
    config.addTargetLanguage(target);
    s.audio = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    s.recognizer = source === 'auto'
      ? SpeechSDK.TranslationRecognizer.FromConfig(config,SpeechSDK.AutoDetectSourceLanguageConfig.fromLanguages(['en-US','es-MX']),s.audio)
      : new SpeechSDK.TranslationRecognizer(config,s.audio);
    const speech = SpeechSDK.SpeechConfig.fromSubscription(key,region);
    speech.speechSynthesisVoiceName = $('voiceSelect').value;
    s.player = new SpeechSDK.SpeakerAudioDestination();
    s.player.onAudioEnd = () => { if (session === s) { s.speaking = false; speakNext(s); } };
    s.synthesizer = new SpeechSDK.SpeechSynthesizer(speech,SpeechSDK.AudioConfig.fromSpeakerOutput(s.player));
    s.recognizer.recognized = (_, e) => {
      if (session !== s) return;
      if (e.result.reason === SpeechSDK.ResultReason.TranslatedSpeech) {
        const translated = e.result.translations.get(target);
        addMsg($('originalTranscript'),e.result.text);
        addMsg($('translatedTranscript'),translated || '(No translation returned)');
        saveHistory();
        if (translated) {
          if (s.queue.length >= 20) return stop('Playback fell behind. Restart after the speaker finishes.',true);
          s.queue.push(translated); speakNext(s);
        }
      } else if (e.result.reason === SpeechSDK.ResultReason.NoMatch) status('No speech recognized. Check the source language.');
    };
    s.recognizer.canceled = () => { if (session === s) stop('Azure canceled the session. Check key, region, quota, microphone permission, and network.',true); };
    s.recognizer.sessionStopped = () => { if (session === s) stop('Session ended. Press Start to reconnect.'); };
    await new Promise((resolve,reject) => s.recognizer.startContinuousRecognitionAsync(resolve,reject));
    if (session === s) status(source === 'auto' ? 'Listening — English/Spanish detected at start. Stop before changing speaker language.' : 'Listening — speak now. Use headphones.');
  } catch {
    if (session === s) stop('Could not start. Check Azure key/region, microphone permission, and network.',true);
  }
}
$('startBtn').onclick = start;
$('stopBtn').onclick = () => stop();
$('clearBtn').onclick = () => {
  stop('Cleared');
  $('originalTranscript').replaceChildren(); $('translatedTranscript').replaceChildren();
  $('speechKey').value = ''; storage.remove('conversations');
  historyId = Math.max(Date.now(),historyId + 1); renderHistory();
};
$('exportBtn').onclick = () => {
  const orig = [...$('originalTranscript').children].map(e => e.textContent);
  const trans = [...$('translatedTranscript').children].map(e => e.textContent);
  const text = 'FluentTalk Export\n' + new Date().toISOString() + '\n\n' + orig.map((line,i) => line + '\n' + (trans[i] || '')).join('\n\n');
  const url = URL.createObjectURL(new Blob([text],{type:'text/plain'})), link = document.createElement('a');
  link.href = url; link.download = 'fluenttalk-' + Date.now() + '.txt'; link.click();
  setTimeout(() => URL.revokeObjectURL(url),1000);
};
window.addEventListener('pagehide',() => { if (session) stop(); $('speechKey').value = ''; });
renderHistory();
