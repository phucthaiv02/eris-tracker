import { useState } from 'react';
import Modal from './Modal.jsx';
import { TYPES, METRICS, CHALLENGE_STATUSES, DIFFICULTIES, DIFFICULTY_COLORS, TYPE_COLORS, STATUS_COLORS, colorStyle, challengeValues, dateTimeInput, dateTimeTimestamp } from '../lib/domain.js';
export default function Editor({item,onClose,onSave,onDelete}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const [v,setV]=useState(()=>({created_date:dateTimeInput(item?.created_at||new Date()),name:item?.name||'',type:item?.type??'',difficulty:DIFFICULTIES.includes(item?.difficulty)?item.difficulty:'',tags:(item?.tags||[]).join(', '),metric:item?.metric??'',direction:item?.direction??'',public_baseline:item?.public_baseline??'',private_baseline:item?.private_baseline??'',public_score:item?.public_score??'',private_score:item?.private_score??'',est_earn:item?.est_earn??'',actual_earn:item?.actual_earn??'',public_rank:item?.public_rank??'',private_rank:item?.private_rank??'',status_override:item?.status_override||''}));
 const set=(key,value)=>setV(old=>({...old,[key]:value,...(key==='metric'&&['RMSE','MAE'].includes(value)?{direction:'asc'}:{})}));
 const field=(key,label,type='text',extras={})=><label className="flex flex-col gap-2 text-xs text-slate-600" key={key}>{label}<input value={v[key]} onChange={e=>set(key,e.target.value)} type={type} {...extras}/></label>;
 const select=(key,label,values,colors)=><label className="flex flex-col gap-2 text-xs text-slate-600" key={key}>{label}<select value={v[key]} onChange={e=>set(key,e.target.value)} style={colors?colorStyle(colors[v[key]]):undefined}>{values.map(option=>{const [value,text]=Array.isArray(option)?option:[option,option];return <option key={value} value={value} style={colors?colorStyle(colors[value]):undefined}>{text}</option>})}</select></label>;
 async function save(e){e.preventDefault();setError('');setBusy(true);try{const values=challengeValues(v);values.direction=values.direction||null;values.created_at=item?.created_at&&v.created_date===dateTimeInput(item.created_at)?item.created_at:dateTimeTimestamp(v.created_date);await onSave(values);onClose()}catch(err){setError(err.message)}finally{setBusy(false)}}
 async function remove(){if(!window.confirm('Xóa challenge này?'))return;setBusy(true);setError('');try{await onDelete();onClose()}catch(err){setError(err.message)}finally{setBusy(false)}}
 return <Modal title={`${item?'Chỉnh sửa':'Thêm'} challenge`} onClose={onClose} busy={busy}><form onSubmit={save}><fieldset disabled={busy} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <div className="sm:col-span-2">{field('name','Challenge','text',{required:true,maxLength:160})}</div>
 {field('created_date','Ngày giờ (giờ Việt Nam)','datetime-local',{required:true})}
 {select('type','Type',[['','Chưa chọn'],...new Set([...TYPES,v.type].filter(Boolean))],TYPE_COLORS)}
 {select('difficulty','Difficulty',[['','Chưa chọn'],...DIFFICULTIES],DIFFICULTY_COLORS)}
 {field('tags','Tag (phân cách bằng dấu phẩy)')}
 {select('metric','Metric',[['','Chưa chọn'],...new Set([...METRICS,v.metric].filter(Boolean))])}
 {select('direction','Chiều điểm',[['','Chưa chọn'],['desc','Điểm cao hơn tốt hơn'],['asc','Điểm thấp hơn tốt hơn']])}
 {field('public_baseline','Public baseline','number',{step:'any'})}
 {field('private_baseline','Private baseline','number',{step:'any'})}
 {field('public_score','Public score','number',{step:'any'})}
 {field('private_score','Private score','number',{step:'any'})}
 {field('est_earn','Est Earn (USD)','number',{min:0,step:'any'})}
 {field('actual_earn','Actual Earn (USD)','number',{min:0,step:'any'})}
 {field('public_rank','Public Rank','number',{min:1,step:1})}
 {field('private_rank','Private Rank','number',{min:1,step:1})}
 {select('status_override','Trạng thái',[['','Chưa chọn'],...CHALLENGE_STATUSES],STATUS_COLORS)}
 </fieldset>{error&&<p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
 <div className="mt-6 flex items-center justify-between gap-2">{item?<button disabled={busy} type="button" className="btn text-red-600" onClick={remove}>Xóa challenge</button>:<span/>}<div className="flex gap-2"><button type="button" className="btn" disabled={busy} onClick={onClose}>Hủy</button><button className="btn btn-primary" disabled={busy}>{busy?'Đang lưu…':'Lưu'}</button></div></div></form></Modal>
}
