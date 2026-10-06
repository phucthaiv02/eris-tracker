import { test } from 'node:test';
import assert from 'node:assert/strict';
import { best, challengeStatus, challengeValues, dateInput, dateTimestamp, fmtDate, oldestFirst, dateTimeInput, dateTimeTimestamp, fmtDateTime, compareChallenges } from '../src/lib/domain.js';
const challenge=(statuses,extra={})=>({submissions:statuses.map(status=>({status,score:.5})),...extra});
test('Pending or Approved passes; all Rejected fails; no submissions has no status',()=>{assert.equal(challengeStatus(challenge(['Rejected','Pending review'])),'Pass');assert.equal(challengeStatus(challenge(['Approved'])),'Pass');assert.equal(challengeStatus(challenge(['Rejected','Rejected'])),'Fail');assert.equal(challengeStatus(challenge([])),null)});
test('Top leaderboard has priority and invalid/legacy overrides cannot mask review results',()=>{assert.equal(challengeStatus(challenge(['Rejected'],{private_rank:3})),'Top leaderboard');assert.equal(challengeStatus(challenge([],{status_override:'Top leaderboard'})),'Top leaderboard');assert.equal(challengeStatus(challenge(['Rejected'],{private_rank:4,status_override:'Pass'})),'Fail')});
test('Best Score respects direction and includes zero',()=>{const c={submissions:[{score:.7},{score:0},{score:.4}]};assert.equal(best({...c,direction:'asc'}),0);assert.equal(best({...c,direction:'desc'}),.7);assert.equal(best({submissions:[]}),null)});
test('Form conversion preserves null vs zero, cleans tags and validates ranks',()=>{const v={name:' Test ',tags:'a, b,a',type:'NLP',metric:'F1',direction:'desc',baseline:'0',est_earn:'',actual_earn:'0',public_rank:'',private_rank:'2',status_override:''};const c=challengeValues(v);assert.equal(c.baseline,0);assert.equal(c.est_earn,null);assert.equal(c.actual_earn,0);assert.deepEqual(c.tags,['a','b']);assert.throws(()=>challengeValues({...v,private_rank:'1.2'}));assert.throws(()=>challengeValues({...v,est_earn:'-1'}))});

test('Vietnam dates round-trip, retain calendar boundaries and sort oldest first',()=>{
 assert.equal(dateInput('2026-10-05T17:00:00Z'),'2026-10-06');
 assert.equal(fmtDate('2026-10-05T17:00:00Z'),'06/10/2026');
 assert.equal(dateInput(dateTimestamp('2026-09-29')),'2026-09-29');
 assert.equal(fmtDate(null),'—');
 assert.throws(()=>dateTimestamp('2026-02-30'));
 const sorted=[{name:'Later',created_at:'2026-10-06T00:00:00+07:00'},{name:'Earlier',created_at:'2026-09-29T00:00:00+07:00'}].sort(oldestFirst);
 assert.equal(sorted[0].name,'Earlier');
});

test('Vietnam datetime preserves hours and validates input',()=>{
 assert.equal(dateTimeInput('2026-10-05T17:30:15Z'),'2026-10-06T00:30');
 assert.equal(fmtDateTime('2026-10-05T17:30:15Z'),'06/10/2026 00:30');
 assert.equal(dateTimeInput(dateTimeTimestamp('2026-10-05T14:30')),'2026-10-05T14:30');
 assert.throws(()=>dateTimeTimestamp('2026-02-30T12:30'));
 assert.throws(()=>dateTimeTimestamp('2026-10-06T25:00'));
});
test('Sorts by name, timestamp, type and both earnings; missing values stay last',()=>{
 const rows=[{name:'Beta',type:'Tabular',created_at:'2026-10-06T10:00:00+07:00',est_earn:'100',actual_earn:0},{name:'Alpha',type:'NLP',created_at:'2026-10-06T09:30:00+07:00',est_earn:20,actual_earn:40},{name:'Gamma',type:'',created_at:'2026-10-05T00:00:00+07:00',est_earn:null,actual_earn:null}];
 const names=(key,direction)=>[...rows].sort((a,b)=>compareChallenges(a,b,key,direction)).map(c=>c.name);
 assert.deepEqual(names('name','asc'),['Alpha','Beta','Gamma']);
 assert.deepEqual(names('name','desc'),['Gamma','Beta','Alpha']);
 assert.deepEqual(names('created_at','asc'),['Gamma','Alpha','Beta']);
 assert.deepEqual(names('created_at','desc'),['Beta','Alpha','Gamma']);
 assert.deepEqual(names('type','asc'),['Alpha','Beta','Gamma']);
 assert.deepEqual(names('est_earn','asc'),['Alpha','Beta','Gamma']);
 assert.deepEqual(names('est_earn','desc'),['Beta','Alpha','Gamma']);
 assert.deepEqual(names('actual_earn','asc'),['Beta','Alpha','Gamma']);
 assert.deepEqual(names('actual_earn','desc'),['Alpha','Beta','Gamma']);
});

test('Rank sorting uses numeric values and keeps unknown ranks last',()=>{
 const rows=[{name:'A',public_rank:10,private_rank:'2'},{name:'B',public_rank:2,private_rank:10},{name:'C',public_rank:null,private_rank:null}];
 const names=(key,direction)=>[...rows].sort((a,b)=>compareChallenges(a,b,key,direction)).map(c=>c.name);
 assert.deepEqual(names('public_rank','asc'),['B','A','C']);
 assert.deepEqual(names('public_rank','desc'),['A','B','C']);
 assert.deepEqual(names('private_rank','asc'),['A','B','C']);
 assert.deepEqual(names('private_rank','desc'),['B','A','C']);
});
