import { supabase } from './supabase.js';
async function result(query){const {data,error}=await query;if(error)throw new Error(error.code==='23505'?'Tên challenge hoặc version đã tồn tại.':error.message);return data;}
export const loadChallenges=()=>result(supabase.from('challenges').select('*, submissions(*)').order('created_at',{ascending:true})).then(rows=>rows.map(c=>({...c,submissions:c.submissions.sort((a,b)=>a.created_at.localeCompare(b.created_at))})));
export const saveChallenge=(id,values,userId)=>id?result(supabase.from('challenges').update(values).eq('id',id).select().single()):result(supabase.from('challenges').insert({...values,user_id:userId}).select().single());
export const deleteChallenge=id=>result(supabase.from('challenges').delete().eq('id',id).select('id').single());
export const saveSubmission=(id,values,challengeId)=>id?result(supabase.from('submissions').update(values).eq('id',id).select().single()):result(supabase.from('submissions').insert({...values,challenge_id:challengeId}).select().single());
export const deleteSubmission=id=>result(supabase.from('submissions').delete().eq('id',id).select('id').single());
export const importLegacy=payload=>result(supabase.rpc('import_legacy_tracker',{payload}));
