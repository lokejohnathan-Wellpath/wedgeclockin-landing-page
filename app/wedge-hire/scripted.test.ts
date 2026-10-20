import test from 'node:test';
import assert from 'node:assert/strict';
import { questions,startScript,nextScript } from './scripted';
import { roles } from './roles';
test('every role has five questions in both supported languages',()=>{for(const r of roles)for(const l of ['en','ms'])assert.equal(questions(r.id,l).length,5);});
test('answers advance deterministically and finish after five answers',()=>{let s=startScript('driver','en',0);for(let i=0;i<5;i++)s=nextScript(s,'driver','en','Sample answer',false,1000+i);assert.equal(s.status,'completed');assert.equal(s.transcript.filter(t=>t.speaker==='candidate').length,5);assert.equal(nextScript(s,'driver','en','extra'),s);});
test('five minute deadline rejects late answers',()=>{const s=nextScript(startScript('cashier','en',0),'cashier','en','Late answer',false,300000);assert.equal(s.status,'timed_out');assert.equal(s.transcript.length,1);});
test('blank and oversized answers cannot advance',()=>{const s=startScript('driver','en',0);assert.throws(()=>nextScript(s,'driver','en','',false,1));assert.throws(()=>nextScript(s,'driver','en','a'.repeat(3001),false,1));});
