type Props={speaking:boolean;listening:boolean;busy:boolean;done:boolean;language:string};
export default function RobotInterviewer({speaking,listening,busy,done,language}:Props){
  const ms=language==='ms';
  const label=done?(ms?'Terima kasih, sesi dah selesai.':'Thank you. Your interview has ended.'):listening?(ms?'Saya sedang dengar.':'Listening to your answer.'):speaking?(ms?'Saya sedang bercakap.':'Speaking your question.'):busy?(ms?'Sekejap ya, sedang simpan jawapan.':'Saving your answer.'):ms?'Sedia bila awak sedia.':'Ready when you are.';
  return <div className="mt-5 flex flex-col items-center gap-5 rounded-2xl border border-[#e8dfd0] bg-[#fcfaf6] p-6 sm:flex-row">
    <div className={`relative grid h-32 w-32 shrink-0 place-items-center rounded-full border bg-[#f2eadb] ${listening?'border-emerald-500':'border-[#d7bd8c]'}`}>
      {(speaking||listening)&&<span className={`absolute inset-0 rounded-full border-2 motion-safe:animate-pulse ${listening?'border-emerald-500':'border-[#b38a43]'}`} />}
      <svg viewBox="0 0 140 140" className="h-28 w-28" aria-hidden="true">
        <path d="M70 25V14" stroke="#946a2c" strokeWidth="5" strokeLinecap="round"/><circle cx="70" cy="12" r="6" fill={listening?'#23846c':'#b38a43'}/>
        <rect x="14" y="57" width="14" height="28" rx="7" fill="#b38a43"/><rect x="112" y="57" width="14" height="28" rx="7" fill="#b38a43"/>
        <rect x="25" y="30" width="90" height="78" rx="29" fill="#fffdfa" stroke="#c8ae7d" strokeWidth="3"/>
        <rect x="35" y="44" width="70" height="46" rx="19" fill="#263336"/>
        <path d="M47 63q7-9 14 0M79 63q7-9 14 0" fill="none" stroke="#f0d49c" strokeWidth="5" strokeLinecap="round"/>
        {speaking?<ellipse cx="70" cy="78" rx="9" ry="5" fill="#f0d49c" className="motion-safe:animate-pulse"/>:<path d="M60 76q10 9 20 0" fill="none" stroke="#f0d49c" strokeWidth="3" strokeLinecap="round"/>}
        <path d="M52 117h36" stroke="#b38a43" strokeWidth="8" strokeLinecap="round"/>
        <path d="m62 99 4 5 4-5 4 5 4-5" stroke="#946a2c" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
    </div><div className="text-center sm:text-left"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#946a2c]">Wedge · {ms?'Penemuduga maya':'Virtual interviewer'}</p><p role="status" className="mt-2 text-lg font-semibold">{label}</p><p className="mt-2 text-xs leading-5 text-stone-500">{ms?'Watak animasi untuk sesi automatik. Awak boleh baca soalan dan jawab ikut keselesaan awak.':'An animated guide for this automated interview. Read the question and answer at your own pace.'}</p></div>
  </div>;
}
