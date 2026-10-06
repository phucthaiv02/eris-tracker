import { test } from 'node:test';
import assert from 'node:assert/strict';
import { challengeStatus, challengeValues, dateInput, dateTimestamp, fmtDate, oldestFirst, dateTimeInput, dateTimeTimestamp, fmtDateTime, compareChallenges, paginateChallenges, fmt, DIFFICULTIES, DIFFICULTY_COLORS } from '../src/lib/domain.js';
test('Challenge status is manual and no longer recalculated from scores or ranks',()=>{
 assert.equal(challengeStatus({status_override:'Pass',private_score:0,private_baseline:1,direction:'desc'}),'Pass');
 assert.equal(challengeStatus({status_override:'Fail',private_rank:1}),'Fail');
 assert.equal(challengeStatus({status_override:'Top leaderboard'}),'Top leaderboard');
 assert.equal(challengeStatus({private_rank:1,public_score:.8,public_baseline:.7,direction:'desc'}),null);
});
test('Form conversion preserves null vs zero, cleans tags and validates ranks',()=>{const v={name:' Test ',tags:'a, b,a',type:'NLP',metric:'F1',direction:'desc',public_baseline:'0',private_baseline:'',public_score:'0',private_score:'',difficulty:' Medium ',est_earn:'',actual_earn:'0',public_rank:'',private_rank:'2',status_override:''};const c=challengeValues(v);assert.equal(c.public_baseline,0);assert.equal(c.public_score,0);assert.equal(c.private_baseline,null);assert.equal(c.private_score,null);assert.equal(c.difficulty,'Medium');assert.equal(c.est_earn,null);assert.equal(c.actual_earn,0);assert.deepEqual(c.tags,['a','b']);assert.throws(()=>challengeValues({...v,private_rank:'1.2'}));assert.throws(()=>challengeValues({...v,est_earn:'-1'}))});

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

test('Pagination shows latest ten first, supports page sizes, clamps deleted pages and handles empty results',()=>{
 const rows=Array.from({length:38},(_,i)=>({name:`Challenge ${i}`,created_at:new Date(Date.UTC(2026,9,1,0,i)).toISOString()})).sort((a,b)=>compareChallenges(a,b,'created_at','desc'));
 const first=paginateChallenges(rows);assert.equal(first.rows.length,10);assert.equal(first.rows[0].name,'Challenge 37');assert.equal(first.totalPages,4);
 const second=paginateChallenges(rows,2,10);assert.equal(second.rows[0].name,'Challenge 27');assert.equal(second.start,11);assert.equal(second.end,20);
 const last=paginateChallenges(rows,4,10);assert.equal(last.rows.length,8);assert.equal(last.end,38);
 for(const size of [10,20,50,100])assert.equal(paginateChallenges(rows,1,size).rows.length,Math.min(38,size));
 const clamped=paginateChallenges(rows.slice(0,20),4,10);assert.equal(clamped.currentPage,2);assert.equal(clamped.rows.length,10);
 const empty=paginateChallenges([],4,10);assert.equal(empty.currentPage,1);assert.equal(empty.totalPages,1);assert.equal(empty.start,0);assert.equal(empty.end,0);
});

test('Public/private scores sort numerically and missing values stay last',()=>{
 const rows=[{name:'A',public_score:10,private_score:0},{name:'B',public_score:2,private_score:1},{name:'C',public_score:null,private_score:null}];
 assert.deepEqual([...rows].sort((a,b)=>compareChallenges(a,b,'public_score','asc')).map(c=>c.name),['B','A','C']);
 assert.deepEqual([...rows].sort((a,b)=>compareChallenges(a,b,'private_score','desc')).map(c=>c.name),['B','A','C']);
});

test('Difficulty has three choices/colors and displayed scores round without changing stored precision',()=>{
 assert.deepEqual(DIFFICULTIES,['Easy','Medium','Hard']);
 assert.equal(DIFFICULTY_COLORS.Easy[1],'#227141');assert.equal(DIFFICULTY_COLORS.Medium[1],'#906000');assert.equal(DIFFICULTY_COLORS.Hard[1],'#b32e32');
 assert.equal(fmt(.735897435897436),'0.736');assert.equal(fmt(0),'0');assert.equal(fmt(null),'—');
 const value={name:'Test',type:'',tags:'',metric:'',direction:'',difficulty:'Extreme',status_override:''};
 assert.throws(()=>challengeValues(value));
 assert.equal(challengeValues({...value,difficulty:'Easy',public_score:'0.735897435897436'}).public_score,.735897435897436);
});
