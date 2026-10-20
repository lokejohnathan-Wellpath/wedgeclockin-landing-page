import test from 'node:test';
import assert from 'node:assert/strict';
import { malayVoice } from './voice';
test('prefers Malaysian Malay even if Indonesian and other Malay voices appear first',()=>{const my={lang:'ms_MY'};assert.equal(malayVoice([{lang:'id-ID'},{lang:'ms-SG'},my]),my);});
test('never reads Malay with an English or Indonesian voice',()=>{assert.equal(malayVoice([{lang:'en-US'},{lang:'id-ID'}]),undefined);});
