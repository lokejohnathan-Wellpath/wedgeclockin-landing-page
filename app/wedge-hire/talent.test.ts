import assert from 'node:assert/strict';
import test from 'node:test';
import { expired, validateProfile } from './talent';
const profile = { name:'Sample Candidate', phone:'+60123456789', area:'Ipoh', role:'driver', experience:'Three years of deliveries', salary:'2500', availability:'Two weeks', licence:'Declared licence class', language:'en', consent:true, discoverable:false };
test('does not require an employer or vacancy; sharing remains optional',()=>{
  const result=validateProfile(profile); assert.equal(result.role,'driver');assert.equal(result.discoverable,false);
});
test('requires consent and driver licence declaration',()=>{
  assert.throws(()=>validateProfile({...profile,consent:false}));assert.throws(()=>validateProfile({...profile,licence:''}));
});
test('rejects unknown roles, unbounded experience and invalid sharing values',()=>{
  assert.throws(()=>validateProfile({...profile,role:'unknown'}));assert.throws(()=>validateProfile({...profile,experience:'x'.repeat(2001)}));assert.throws(()=>validateProfile({...profile,discoverable:'true'}));
});
test('server deadline expires precisely at 5:00',()=>{
  assert.equal(expired(new Date(0),299999),false);assert.equal(expired(new Date(0),300000),true);
});
