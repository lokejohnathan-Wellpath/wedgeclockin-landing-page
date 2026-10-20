"use client";
import { useEffect, useRef, useState } from 'react';
import RobotInterviewer from './RobotInterviewer';
import { malayVoice } from './voice';
import { nextScript,startScript,type InterviewState } from './scripted';
type Recognition = {lang:string;continuous:boolean;interimResults:boolean;onresult:((e:{results:ArrayLike<{isFinal:boolean;0:{transcript:string}}>;resultIndex:number})=>void)|null;onerror:((e:{error:string})=>void)|null;onend:(()=>void)|null;start:()=>void;stop:()=>void;abort:()=>void};
type RecognitionWindow=Window & {SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};
export default function ScriptedInterview({role,language,practice=true,initial=null,onSaved}:{role:string;language:string;practice?:boolean;initial?:InterviewState|null;onSaved?:(state:InterviewState)=>void}) {
  const [state,setState]=useState<InterviewState|null>(initial),[answer,setAnswer]=useState(''),[error,setError]=useState('');
  const [busy,setBusy]=useState(false),[listening,setListening]=useState(false),[speaking,setSpeaking]=useState(false),[remaining,setRemaining]=useState(300),[camera,setCamera]=useState(false);
  const [voiceConsent,setVoiceConsent]=useState(false),[recognitionSupported,setRecognitionSupported]=useState(false);
  const [voiceName,setVoiceName]=useState('');
  const recognition=useRef<Recognition|null>(null),cameraStream=useRef<MediaStream|null>(null),video=useRef<HTMLVideoElement|null>(null),mounted=useRef(true),finishing=useRef(false);
  const speechVersion=useRef(0);
  const current=useRef(state);current.current=state;
  const stop=()=>{speechVersion.current++;recognition.current?.abort();window.speechSynthesis?.cancel();cameraStream.current?.getTracks().forEach(t=>t.stop());};
  useEffect(()=>{mounted.current=true;const w=window as RecognitionWindow;setRecognitionSupported(Boolean(w.SpeechRecognition||w.webkitSpeechRecognition));return()=>{mounted.current=false;stop();};},[]);
  async function speak(text:string){
    const version=++speechVersion.current;
    if(!('speechSynthesis'in window)){setError(language==='ms'?'Suara tak tersedia pada peranti ini. Awak boleh baca soalan di skrin.':'Spoken questions are unavailable. Please read the question on screen.');return;}
    const synth=window.speechSynthesis;synth.cancel();setSpeaking(false);
    if(!synth.getVoices().length)await new Promise<void>(resolve=>{
      let timer:ReturnType<typeof setTimeout>;
      const finish=()=>{clearTimeout(timer);synth.removeEventListener('voiceschanged',finish);resolve();};
      timer=setTimeout(finish,1000);synth.addEventListener('voiceschanged',finish);
      if(synth.getVoices().length)finish();
    });
    if(!mounted.current||version!==speechVersion.current)return;
    const speech=new SpeechSynthesisUtterance(text);speech.lang=language==='ms'?'ms-MY':'en-MY';
    if(language==='ms'){
      const voice=malayVoice(synth.getVoices());
      if(!voice){setVoiceName('');setError('Suara Bahasa Malaysia (Malaysia) belum tersedia pada peranti ini. Pilih atau pasang suara Bahasa Melayu (Malaysia) dalam tetapan suara peranti, kemudian cuba semula. Kami tidak akan gunakan suara Indonesia atau bahasa lain sebagai ganti. Soalan masih boleh dibaca dan dijawab di skrin.');return;}
      speech.voice=voice;speech.lang='ms-MY';speech.rate=0.9;speech.pitch=1;setVoiceName(voice.name);
    }
    speech.onstart=()=>{if(mounted.current&&version===speechVersion.current)setSpeaking(true);};
    const ended=()=>{if(mounted.current&&version===speechVersion.current)setSpeaking(false);};speech.onend=ended;speech.onerror=ended;synth.speak(speech);
  }
  async function act(action:'start'|'answer'|'finish',text=''){
    speechVersion.current++;setBusy(true);setError('');recognition.current?.abort();setListening(false);window.speechSynthesis?.cancel();setSpeaking(false);
    try{
      let next:InterviewState;
      if(practice)next=action==='start'?startScript(role,language):nextScript(current.current!,role,language,text,action==='finish');
      else {const r=await fetch('/api/wedge-hire/interview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,answer:text})});const d=await r.json();if(!r.ok)throw new Error(d.error);next=d;}
      if(!mounted.current)return;setState(next);onSaved?.(next);setAnswer('');
      if(next.status==='active')speak(next.transcript.at(-1)!.text);else {cameraStream.current?.getTracks().forEach(t=>t.stop());setCamera(false);}
    }catch(e){if(mounted.current)setError(e instanceof Error?e.message:'Please retry.');}finally{if(mounted.current)setBusy(false);}
  }
  useEffect(()=>{
    if(state?.status!=='active')return;
    const tick=()=>{const left=Math.max(0,300-Math.floor((Date.now()-new Date(state.started).getTime())/1000));setRemaining(left);if(!left&&!finishing.current){finishing.current=true;stop();setListening(false);setSpeaking(false);void act('finish').finally(()=>{finishing.current=false;});}};
    tick();const id=setInterval(tick,1000);return()=>clearInterval(id);
    // The deadline is tied to the server/start timestamp, not changing answer state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[state?.status,state?.started]);
  function listen(){
    setError('');const w=window as RecognitionWindow;const Engine=w.SpeechRecognition||w.webkitSpeechRecognition;
    if(!Engine){setError('Speech recognition is unavailable. Type your answer below.');return;}
    speechVersion.current++;window.speechSynthesis?.cancel();setSpeaking(false);const r=new Engine();recognition.current=r;r.lang=language==='ms'?'ms-MY':'en-MY';r.continuous=true;r.interimResults=false;
    r.onresult=e=>{let text='';for(let i=e.resultIndex;i<e.results.length;i++)if(e.results[i].isFinal)text+=e.results[i][0].transcript+' ';if(mounted.current)setAnswer(old=>(old+' '+text).trim().slice(0,3000));};
    r.onerror=e=>{if(mounted.current){setListening(false);setError(`Listening stopped (${e.error}). You can type your answer or try again.`);}};r.onend=()=>{if(mounted.current)setListening(false);};
    try{r.start();setListening(true);}catch{setError('Microphone could not start. Please type your answer.');}
  }
  async function toggleCamera(){if(camera){cameraStream.current?.getTracks().forEach(t=>t.stop());setCamera(false);return;}try{const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});if(!mounted.current){stream.getTracks().forEach(t=>t.stop());return;}cameraStream.current=stream;if(video.current)video.current.srcObject=stream;setCamera(true);}catch{setError('Camera unavailable. You can continue without it.');}}
  function download(){if(!state)return;const text=`Wedge Hire — ${practice?'practice only; not submitted':'candidate copy'}\nRole: ${role}\nStatus: ${state.status}\n\n`+state.transcript.map(t=>`${t.speaker}: ${t.text}`).join('\n\n');const url=URL.createObjectURL(new Blob([text],{type:'text/plain'}));const a=document.createElement('a');a.href=url;a.download='wedge-hire-interview.txt';a.click();URL.revokeObjectURL(url);}
  const done=state&&state.status!=='active';const last=state?.transcript.at(-1);
  return <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-semibold">{done?'Interview record':state?'Your interview':'Ready to begin?'}</h2><span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-900">No paid AI calls</span></div>
    <p className="mt-3 text-sm leading-6 text-stone-600">Five prepared questions · maximum five minutes. This is an automated scripted interview, with no generative follow-ups or automatic hiring score. You can finish sooner.</p>
    {practice&&<p className="mt-3 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950">Practice mode: answers stay in this page’s memory and are not submitted to Wedge or an employer. Refreshing clears them. Use sample answers; download a copy before leaving.</p>}
    <RobotInterviewer speaking={speaking} listening={listening} busy={busy} done={Boolean(done)} language={language}/>
    {language==='ms'&&<p className="mt-3 text-xs text-stone-500">{voiceName?`Suara: ${voiceName} · Bahasa Malaysia (Malaysia)`:'Bahasa Malaysia (Malaysia) · suara bergantung pada peranti'}</p>}
    {!state&&<div className="mt-5"><p className="text-sm leading-6 text-stone-600">Your browser can speak questions and, where supported, convert speech to text. Its speech service may send audio to the browser provider. You may use typed answers instead. Wedge does not record audio or video in this version.</p><label className="mt-4 flex gap-3 text-sm leading-6"><input type="checkbox" checked={voiceConsent} onChange={e=>setVoiceConsent(e.target.checked)}/>Enable browser speech recognition for my answers (optional).</label><button disabled={busy} onClick={()=>void act('start')} className="mt-5 rounded-xl bg-[#946a2c] px-6 py-3 font-bold text-white disabled:opacity-50">Start five-minute interview</button></div>}
    {state?.status==='active'&&<><p role="timer" className="mt-5 font-mono text-2xl">{Math.floor(remaining/60)}:{String(remaining%60).padStart(2,'0')} remaining</p><p className="mt-1 text-xs text-stone-500">Question {Math.min(5,state.transcript.filter(t=>t.speaker==='candidate').length+1)} of 5</p><div className="mt-5 rounded-xl bg-[#f4f0e8] p-5"><p className="text-xs font-bold uppercase tracking-wider">Wedge interviewer</p><p className="mt-2 text-lg leading-8">{last?.text}</p><button disabled={busy||listening} onClick={()=>speak(last?.text||'')} className="mt-3 text-sm font-semibold underline">{speaking?'Repeat question':'Hear question'}</button></div>
    <label className="mt-5 block text-sm font-medium">Your answer<textarea value={answer} onChange={e=>setAnswer(e.target.value)} disabled={busy||remaining===0} maxLength={3000} rows={5} placeholder="Speak or type, review the words, then submit." className="mt-2 w-full rounded-xl border border-stone-300 p-3 leading-7 disabled:opacity-50"/></label>
    {!voiceConsent&&<label className="mt-3 flex gap-3 text-sm"><input type="checkbox" checked={voiceConsent} onChange={e=>setVoiceConsent(e.target.checked)}/>Allow browser speech recognition; audio may be processed by the browser provider.</label>}
    <div className="mt-4 flex flex-wrap gap-3">{listening?<button onClick={()=>recognition.current?.stop()} className="rounded-xl bg-red-800 px-4 py-3 text-sm font-semibold text-white">Stop listening</button>:<button disabled={!voiceConsent||!recognitionSupported||busy||remaining===0} onClick={listen} className="rounded-xl border border-stone-300 px-4 py-3 text-sm font-semibold disabled:opacity-50">Speak answer</button>}<button disabled={busy||listening||!answer.trim()||remaining===0} onClick={()=>void act('answer',answer)} className="rounded-xl bg-[#20282c] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy?'Saving…':'Submit answer & continue'}</button><button disabled={busy} onClick={()=>void act('finish')} className="rounded-xl border border-stone-300 px-4 py-3 text-sm">Finish early</button></div>
    {!recognitionSupported&&<p className="mt-3 text-sm text-stone-600">Speech recognition is not supported in this browser. Typed answers still work.</p>}
    <video ref={video} autoPlay muted playsInline className={`mt-5 w-full max-w-sm rounded-xl bg-stone-900 ${camera?'':'hidden'}`}/><button disabled={busy} onClick={toggleCamera} className="mt-4 text-sm underline">{camera?'Turn camera off':'Optional camera preview'}</button><p className="mt-2 text-xs text-stone-500">Camera preview stays on your device. No face analysis or video recording.</p><p role="status" className="mt-3 text-sm text-stone-500">{listening?'Listening…':speaking?'Speaking question…':''}</p></>}
    {error&&<p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {done&&<><p role="status" className="mt-5 rounded-xl bg-green-50 p-4 text-sm leading-6">{state.status==='timed_out'?'The five-minute limit was reached.':'Interview ended.'} {state.transcript.filter(t=>t.speaker==='candidate').length} of 5 questions answered. {practice?'This practice was not submitted.':'Your submitted answers are saved.'} No hiring assessment has been generated.</p><button onClick={download} className="mt-4 rounded-xl bg-[#20282c] px-5 py-3 text-sm font-bold text-white">Download transcript</button><div className="mt-5 space-y-3">{state.transcript.map((t,i)=><article key={i} className="rounded-xl bg-stone-50 p-4"><h3 className="text-xs font-bold uppercase">{t.speaker}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-7">{t.text}</p></article>)}</div></>}
  </section>;
}
