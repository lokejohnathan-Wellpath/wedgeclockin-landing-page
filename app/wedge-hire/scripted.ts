import { roles, INTERVIEW_HARD_STOP_SECONDS } from './roles';
import type { Turn } from './talent';
export type InterviewState = { status: 'active'|'completed'|'timed_out'; transcript: Turn[]; started: string };
export function questions(roleId: string, language: string) {
  const role=roles.find(r=>r.id===roleId);if(!role)throw new Error('Choose a supported role.');
  const ms:Record<string,[string,string]>={
    retail:['Pelanggan tidak dapat mencari produk dan mula marah. Apakah tindakan anda?','Jumlah belian RM18.50 dan RM12.90, dibayar RM50. Berapakah baki?'],
    sales:['Ceritakan cara anda menangani pelanggan yang mengatakan harga terlalu mahal.','Apakah mesej susulan anda kepada pelanggan yang meminta sebut harga semalam?'],
    supervisor:['Dua pekerja tidak hadir sebelum syif sibuk. Bagaimanakah anda mengatur pasukan?','Apakah tiga tindakan pertama jika kiraan stok berbeza daripada rekod sistem?'],
    service:['Pelanggan menerima makanan yang bukan pesanannya. Apakah tindakan anda?','Pelanggan memberitahu anda tentang alahan makanan. Apakah yang anda lakukan sebelum mengambil pesanan?'],
    cashier:['Wang tunai kurang pada akhir syif. Apakah langkah anda?','Bil RM37.60, dibayar RM50. Berapakah baki?'],
    storekeeper:['Barang diterima rosak dan kurang daripada nota penghantaran. Apakah tindakan anda?','Stok awal 120 unit, terima 45 dan keluarkan 38. Berapakah baki stok?'],
    driver:['Anda mendapati tayar rosak sebelum perjalanan tetapi penghantaran segera. Apakah tindakan anda?','Bagaimanakah anda mengurus kelewatan penghantaran tanpa menjejaskan keselamatan?']
  };
  return language==='ms' ? [
    'Sila ceritakan pengalaman kerja atau tugas yang berkaitan dengan jawatan pilihan anda.',
    ms[roleId][0], ms[roleId][1],
    roleId==='driver'?'Apakah jenis lori yang pernah anda pandu, lesen yang anda miliki, dan pemeriksaan sebelum perjalanan yang anda lakukan? Jangan sebut nombor kad pengenalan atau lesen.':'Ceritakan satu contoh anda menjaga ketepatan, keselamatan atau kerjasama dalam kerja.',
    'Di kawasan manakah anda ingin bekerja, apakah syif yang sesuai, jangkaan gaji dan bila anda boleh mula bekerja?'
  ] : [
    `Tell me about your experience or tasks relevant to working as a ${role.name}.`,role.question,role.task,
    roleId==='driver'?'What lorry types have you driven, which licence classes do you hold, and what pre-trip checks do you make? Do not give identity or licence numbers.':'Give one example of how you maintained accuracy, safety or teamwork at work.',
    'Where would you like to work, which shifts can you do, what salary do you expect, and when can you start?'
  ];
}
export function startScript(role:string,language:string,now=Date.now()):InterviewState {
  return {status:'active',started:new Date(now).toISOString(),transcript:[{speaker:'interviewer',text:questions(role,language)[0]}]};
}
export function nextScript(state:InterviewState,role:string,language:string,answer:string,finish=false,now=Date.now()):InterviewState {
  if(state.status!=='active')return state;
  if(now-new Date(state.started).getTime()>=INTERVIEW_HARD_STOP_SECONDS*1000)return {...state,status:'timed_out'};
  if(finish)return {...state,status:'completed'};
  const text=answer.trim();if(!text||text.length>3000)throw new Error('Enter an answer of 1–3,000 characters.');
  const transcript:Turn[]=[...state.transcript,{speaker:'candidate',text}];
  const count=transcript.filter(t=>t.speaker==='candidate').length;
  const list=questions(role,language);
  if(count>=list.length)return {...state,transcript,status:'completed'};
  return {...state,transcript:[...transcript,{speaker:'interviewer',text:list[count]}]};
}
