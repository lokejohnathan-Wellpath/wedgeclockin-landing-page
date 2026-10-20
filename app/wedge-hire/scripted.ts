import { roles, INTERVIEW_HARD_STOP_SECONDS } from './roles';
import type { Turn } from './talent';
export type InterviewState = { status: 'active'|'completed'|'timed_out'; transcript: Turn[]; started: string };
export function questions(roleId: string, language: string) {
  const role=roles.find(r=>r.id===roleId);if(!role)throw new Error('Choose a supported role.');
  const ms:Record<string,[string,string]>={
    retail:['Kalau pelanggan tak jumpa barang yang dia cari dan dah mula marah, macam mana awak nak bantu?','Pelanggan beli barang harga lapan belas ringgit lima puluh sen dan dua belas ringgit sembilan puluh sen. Dia bayar lima puluh ringgit. Berapa baki yang perlu dipulangkan?'],
    sales:['Kalau pelanggan kata harga kita mahal, macam mana awak nak jawab? Boleh bagi satu contoh?','Pelanggan minta sebut harga semalam tapi belum balas. Apa mesej susulan yang awak akan hantar?'],
    supervisor:['Kalau dua orang staf tak datang masa kedai tengah sibuk, macam mana awak nak susun pasukan?','Kalau kiraan stok tak sama dengan rekod sistem, apa tiga perkara pertama yang awak akan buat?'],
    service:['Kalau makanan yang sampai bukan pesanan pelanggan, apa yang awak akan buat?','Pelanggan cakap dia ada alahan makanan. Sebelum ambil pesanan, apa yang awak perlu buat?'],
    cashier:['Masa tutup kaunter, awak dapati duit tunai tak cukup. Macam mana awak nak semak dan laporkan?','Jumlah bil tiga puluh tujuh ringgit enam puluh sen. Pelanggan bayar lima puluh ringgit. Berapa baki yang perlu dipulangkan?'],
    storekeeper:['Barang yang sampai ada yang rosak, dan jumlah pun kurang daripada nota penghantaran. Apa awak akan buat?','Stok mula-mula seratus dua puluh unit. Lepas itu terima empat puluh lima unit dan keluarkan tiga puluh lapan unit. Berapa baki stok?'],
    driver:['Sebelum jalan, awak nampak tayar lori rosak. Tapi barang kena hantar cepat. Apa yang awak akan buat dulu?','Kalau penghantaran dah lewat, macam mana awak nak urus keadaan itu sambil jaga keselamatan?']
  };
  return language==='ms' ? [
    'Hai, selamat datang. Kita borak sekejap, ya. Boleh cerita sikit tentang pengalaman kerja awak? Kalau belum pernah bekerja, cerita tentang tugas yang awak pernah buat.',
    ms[roleId][0], ms[roleId][1],
    roleId==='driver'?'Awak pernah bawa lori jenis apa, dan ada lesen kelas apa? Sebelum jalan, biasanya awak periksa apa dulu? Tak perlu sebut nombor kad pengenalan atau nombor lesen, ya.':'Boleh bagi satu contoh macam mana awak pastikan kerja dibuat dengan betul, selamat, atau bekerjasama dengan pasukan?',
    'Akhir sekali, awak nak kerja dekat kawasan mana? Syif macam mana yang sesuai, berapa gaji yang awak harapkan, dan bila boleh mula kerja?'
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
