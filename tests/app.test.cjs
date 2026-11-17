const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname,'..');
function harness({saved={},failStart=false,deferStart=false,deferStop=false}={}) {
  class Element {
    constructor(value='') { this._value=value; this.children=[]; this.disabled=false; this.textContent=''; }
    get options() { return this.children; }
    get value() { return this._value; }
    set value(value) { this._value=value; }
    replaceChildren() { this.children=[]; this._value=''; }
    appendChild(el) { this.children.push(el); if (!this._value && el.value) this._value=el.value; }
    click() { this.clicked=true; }
  }
  const ids=['speechKey','speechRegion','sourceLang','targetLang','voiceSelect','status','startBtn','stopBtn','clearBtn','exportBtn','themeToggle','historyList','originalTranscript','translatedTranscript'];
  const elements=Object.fromEntries(ids.map(id=>[id,new Element()]));
  elements.speechKey.value='test-key-never-store';
  elements.speechRegion.value='eastus'; elements.sourceLang.value='es-MX'; elements.targetLang.value='en';
  for (const [id,values] of Object.entries({sourceLang:['auto','en-US','es-MX','es-ES','fr-FR','pt-BR','zh-CN'],targetLang:['en','es','fr','pt','zh-Hans']})) {
    elements[id].children=values.map(value=>({value}));
  }
  const data=new Map(Object.entries(saved)), recs=[], synths=[], players=[], configs=[];
  const classes=new Set();
  const document={
    getElementById:id=>elements[id],
    createElement:()=>new Element(),
    documentElement:{classList:{contains:c=>classes.has(c),add:c=>classes.add(c),toggle:c=>classes.has(c)?classes.delete(c):classes.add(c)}}
  };
  class Recognizer {
    constructor(config,audio) { this.config=config; this.audio=audio; recs.push(this); }
    static FromConfig(config,auto,audio) { const r=new Recognizer(config,audio); r.auto=auto; return r; }
    startContinuousRecognitionAsync(ok,fail) { this.started=ok; if(failStart) fail('do not leak key'); else if(!deferStart) ok(); }
    stopContinuousRecognitionAsync(ok) { this.stopped=ok; if(!deferStop) ok(); }
    close() { this.closed=true; }
  }
  class Synth {
    constructor(config,audio) { this.config=config; this.audio=audio; this.spoken=[]; synths.push(this); }
    speakTextAsync(text,ok,fail) { this.spoken.push(text); this.ok=ok; this.fail=fail; }
    close() { this.closed=true; }
  }
  class Player { constructor(){players.push(this);} close(){this.closed=true;} pause(){this.paused=true;} }
  const sdk={
    SpeechTranslationConfig:{fromSubscription:(key,region)=>{const c={key,region,addTargetLanguage(t){this.target=t;}}; configs.push(c); return c;}},
    SpeechConfig:{fromSubscription:(key,region)=>({key,region})},
    AudioConfig:{fromDefaultMicrophoneInput:()=>({close(){this.closed=true;}}),fromSpeakerOutput:p=>p},
    TranslationRecognizer:Recognizer,SpeechSynthesizer:Synth,SpeakerAudioDestination:Player,
    AutoDetectSourceLanguageConfig:{fromLanguages:languages=>languages},
    ResultReason:{TranslatedSpeech:1,NoMatch:2,SynthesizingAudioCompleted:3}
  };
  const events={},urls=[];
  const context=vm.createContext({document,localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)},SpeechSDK:sdk,
    window:{SpeechSDK:sdk,isSecureContext:true,addEventListener:(n,fn)=>events[n]=fn},
    navigator:{mediaDevices:{getUserMedia(){}}},Date,Blob,URL:{createObjectURL:()=>{urls.push('created');return 'blob:test';},revokeObjectURL:()=>urls.push('revoked')},setTimeout:fn=>fn()});
  vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),context);
  return {elements,data,recs,synths,players,configs,events,urls,context,
    start:()=>elements.startBtn.onclick(),stop:()=>elements.stopBtn.onclick(),
    emit:(r,text='Hola',translation='Hello')=>r.recognized(null,{result:{reason:1,text,translations:{get:()=>translation}}})};
}
test('legacy key purged; target-compatible default voice',()=>{
  const h=harness({saved:{speechKey:'legacy',voiceSelect:'es-MX-DaliaNeural'}});
  assert.equal(h.data.has('speechKey'),false);
  assert.equal(h.elements.voiceSelect.value,'en-US-AriaNeural');
});
test('all target languages select compatible voices and persist',()=>{
  const h=harness();
  for(const target of ['en','es','fr','pt','zh-Hans']) {
    h.elements.targetLang.value=target; h.elements.targetLang.onchange();
    assert.ok(h.elements.voiceSelect.value.startsWith(target==='zh-Hans'?'zh':target));
    assert.equal(h.data.get('targetLang'),target);
  }
});
test('recognized translation displayed safely, synthesized, history deduplicated',async()=>{
  const h=harness(); await h.start();
  h.emit(h.recs[0],'<img src=x onerror=alert(1)>','Hello');
  h.emit(h.recs[0],'Otra','Another');
  assert.match(h.elements.originalTranscript.children[0].textContent,/<img/);
  assert.equal(h.synths[0].spoken.length,1);
  h.synths[0].ok({reason:3}); assert.equal(h.synths[0].spoken.length,1);
  h.players[0].onAudioEnd(); assert.deepEqual(h.synths[0].spoken,['Hello','Another']);
  assert.equal(JSON.parse(h.data.get('conversations')).length,1);
  assert.equal(JSON.parse(h.data.get('conversations'))[0].orig.length,2);
  assert.equal(h.data.has('speechKey'),false);
});
test('start waits for SDK callback; duplicate start ignored',async()=>{
  const h=harness({deferStart:true});
  const p=h.start(); await h.start();
  assert.equal(h.recs.length,1); assert.match(h.elements.status.textContent,/Starting/);
  h.recs[0].started(); await p; assert.match(h.elements.status.textContent,/Listening/);
});
test('stop captures old recognizer and ignores stale events after restart',async()=>{
  const h=harness({deferStop:true}); await h.start(); const old=h.recs[0];
  h.stop(); await h.start(); const current=h.recs[1];
  old.stopped(); h.emit(old); old.canceled();
  assert.equal(old.closed,true); assert.equal(current.closed,undefined);
  assert.equal(h.elements.originalTranscript.children.length,0);
  assert.equal(h.elements.startBtn.disabled,true);
});
test('cancel preserves actionable error and cleans resources',async()=>{
  const h=harness(); await h.start(); h.recs[0].canceled();
  assert.match(h.elements.status.textContent,/Azure canceled/);
  assert.equal(h.elements.startBtn.disabled,false); assert.equal(h.players[0].closed,true);
});
test('startup failure restores controls without revealing error details',async()=>{
  const h=harness({failStart:true}); await h.start();
  assert.match(h.elements.status.textContent,/Could not start/);
  assert.equal(h.elements.startBtn.disabled,false); assert.equal(h.recs[0].closed,true);
});
test('stop while startup pending cannot restore listening state',async()=>{
  const h=harness({deferStart:true}); const p=h.start(); h.stop();
  h.recs[0].started(); await p; assert.equal(h.elements.status.textContent,'Stopped');
});
test('auto mode has distinct English/Spanish candidates',async()=>{
  const h=harness(); h.elements.sourceLang.value='auto'; await h.start();
  assert.deepEqual(Array.from(h.recs[0].auto),['en-US','es-MX']);
  assert.match(h.elements.status.textContent,/at start/);
});
test('same-language and missing configuration rejected',async()=>{
  const h=harness(); h.elements.sourceLang.value='en-US'; await h.start();
  assert.equal(h.recs.length,0); assert.match(h.elements.status.textContent,/different/);
  h.elements.speechKey.value=''; await h.start(); assert.match(h.elements.status.textContent,/Enter/);
});
test('SDK and secure-context failures handled',async()=>{
  const h=harness(); h.context.window.SpeechSDK=null; await h.start();
  assert.match(h.elements.status.textContent,/did not load/);
  h.context.window.isSecureContext=false; await h.start(); assert.match(h.elements.status.textContent,/HTTPS/);
});
test('corrupt and hostile saved history handled as data',()=>{
  for(const conversations of ['{broken','null','[{"ts":"<img>","orig":[],"trans":[]}]','{"x":1}']) {
    const h=harness({saved:{conversations}}); assert.equal(h.elements.historyList.children.length,0);
  }
});
test('clear removes saved transcripts and key, export revokes URL',async()=>{
  const h=harness(); await h.start(); h.emit(h.recs[0]); h.elements.exportBtn.onclick();
  assert.deepEqual(h.urls,['created','revoked']);
  h.elements.clearBtn.onclick();
  assert.equal(h.data.has('conversations'),false);
  assert.equal(h.elements.speechKey.value,''); assert.equal(h.elements.originalTranscript.children.length,0);
});
test('playback failures visible, no-match and session-end handled',async()=>{
  const h=harness(); await h.start(); h.emit(h.recs[0]); h.synths[0].fail('secret');
  assert.match(h.elements.status.textContent,/Voice playback failed/);
  h.recs[0].recognized(null,{result:{reason:2}});
  assert.match(h.elements.status.textContent,/No speech/);
  h.recs[0].sessionStopped(); assert.equal(h.elements.startBtn.disabled,false);
});
test('backend fails closed and does not read or return Azure credentials',()=>{
  const source=fs.readFileSync(path.join(root,'backend/main.py'),'utf8');
  assert.match(source,/status_code=410/); assert.match(source,/websocket.close\(code=1008\)/);
  assert.doesNotMatch(source,/getenv|environ|websocket.accept|allow_origins|receive_text/);
});

test('saved compatible voice restored on reload',()=>{
  const h=harness({saved:{targetLang:'es',voiceSelect:'es-ES-ElviraNeural'}});
  assert.equal(h.elements.voiceSelect.value,'es-ES-ElviraNeural');
});
