import { NextRequest, NextResponse } from 'next/server';
import { configured, db, privateHeaders, sameOrigin, tokenHash } from '@/app/wedge-hire/server';
import type { Profile, Turn } from '@/app/wedge-hire/talent';
import { nextScript, startScript, type InterviewState } from '@/app/wedge-hire/scripted';
export const runtime='nodejs';
export async function POST(req:NextRequest) {
  if(!sameOrigin(req))return NextResponse.json({error:'Request not allowed.'},{status:403});
  if(!configured())return NextResponse.json({error:'Candidate storage is not connected. Use the practice interview instead.'},{status:503});
  const key=tokenHash(req);if(!key)return NextResponse.json({error:'Register first.'},{status:401});
  let input;
  try{input=await req.json();if(!['start','answer','finish'].includes(input.action)||typeof input.answer!=='string'||input.answer.length>3000)throw new Error();}
  catch{return NextResponse.json({error:'Invalid interview answer.'},{status:400});}
  const client=await db().connect().catch(()=>null);
  if(!client)return NextResponse.json({error:'Storage unavailable. Please retry.'},{status:503});
  try{
    await client.query('BEGIN');
    const {rows}=await client.query('SELECT * FROM hire_candidates WHERE token_hash=$1 AND expires_at>now() FOR UPDATE',[key]);
    const row=rows[0];if(!row){await client.query('ROLLBACK');return NextResponse.json({error:'Your session has expired.'},{status:401});}
    const profile=row.profile as Profile;
    let state:InterviewState;
    if(!row.interview_started_at){if(input.action!=='start')throw new Error('Start your interview first.');state=startScript(profile.role,profile.language);}
    else {
      state={status:row.interview_status,started:new Date(row.interview_started_at).toISOString(),transcript:row.transcript as Turn[]};
      if(input.action!=='start')state=nextScript(state,profile.role,profile.language,input.answer,input.action==='finish');
      else if(Date.now()-new Date(state.started).getTime()>=300000&&state.status==='active')state={...state,status:'timed_out'};
    }
    await client.query('UPDATE hire_candidates SET interview_status=$2,interview_started_at=$3,transcript=$4,turn_count=$5 WHERE id=$1',[row.id,state.status,state.started,JSON.stringify(state.transcript),state.transcript.filter(t=>t.speaker==='candidate').length]);
    await client.query('COMMIT');return NextResponse.json(state,{headers:privateHeaders});
  }catch{await client.query('ROLLBACK');return NextResponse.json({error:'The answer could not be saved. Check your answer and retry.'},{status:503});}
  finally{client.release();}
}
