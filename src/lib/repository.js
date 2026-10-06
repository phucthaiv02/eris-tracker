import { supabase } from './supabase.js';
async function result(query){const {data,error}=await query;if(error)throw new Error(error.code==='23505'?'Tên challenge đã tồn tại.':error.code==='42703'||error.code==='PGRST204'?'Cần chạy SQL cập nhật schema challenge trước khi sử dụng giao diện mới.':error.message);return data;}
export const loadChallenges=()=>result(supabase.from('challenges').select('id,user_id,name,type,tags,metric,direction,difficulty,public_baseline,private_baseline,public_score,private_score,est_earn,actual_earn,public_rank,private_rank,status_override,legacy_id,created_at,updated_at').order('created_at',{ascending:false}));
export const saveChallenge=(id,values,userId)=>id?result(supabase.from('challenges').update(values).eq('id',id).select().single()):result(supabase.from('challenges').insert({...values,user_id:userId}).select().single());
export const deleteChallenge=id=>result(supabase.from('challenges').delete().eq('id',id).select('id').single());
export const importTracker=payload=>result(supabase.rpc('import_tracker',{payload}));
