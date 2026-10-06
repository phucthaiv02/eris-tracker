export const TYPE_COLORS={Tabular:['#e5efff','#2b69c7','#a2c1f5'],Classification:['#f0e7ff','#7945bf','#c8acf0'],Regression:['#eef0f3','#687481','#c3cad1'],NLP:['#e1f5e7','#258547','#9cdbaf'],'Computer Vision':['#def5f0','#148777','#8bd6c7'],'Object Detection':['#f2e4ff','#9143c2','#d5a6f0'],'Time Series':['#ffecd9','#be6417','#efba85'],Forecasting:['#fff2cc','#a97808','#e9cb76'],'Anomaly Detection':['#ffe5e3','#ba393c','#f0aaa6'],Recommendation:['#eef0f3','#687481','#c3cad1'],'Sequence To Sequence':['#ddf5eb','#148661','#87d7b9'],'Prompt Engineering':['#ffe4f0','#b6417c','#eda7ca'],RAG:['#def4fc','#1686a6','#89d3e8'],'Fine-Tuning':['#fff2cc','#a97808','#e9cb76'],'From Scratch':['#ffe5e3','#ba393c','#f0aaa6'],'LLM Evaluation':['#f0e7ff','#7945bf','#c8acf0'],Other:['#eef0f3','#687481','#c3cad1']};
export const TYPES=Object.keys(TYPE_COLORS);
export const METRICS=['AUC','Accuracy','F1','RMSE','MAE','Other'];
export const STATUSES=['Pending review','Approved','Rejected'];
export const STATUS_COLORS={'Top leaderboard':['#fff0bb','#906000','#efd07a'],Approved:['#fff0bb','#906000','#efd07a'],Pass:['#dcf5e3','#227141','#a3dfb5'],'Pending review':['#dfedff','#235eb5','#a9cbfa'],Rejected:['#ffe2df','#b32e32','#f5aaa6'],Fail:['#ffe2df','#b32e32','#f5aaa6']};
export function colorStyle(colors){const [backgroundColor,color,borderColor]=colors||['#f1f3f1','#68766b','#dce5dd'];return {backgroundColor,color,borderColor};}
export const fmt=n=>n==null?'—':Number(n).toLocaleString('en-US',{maximumFractionDigits:6});
export const money=n=>n==null?'—':'$'+Number(n).toLocaleString('en-US',{maximumFractionDigits:2});
export function best(c){const scores=(c.submissions||[]).map(s=>Number(s.score)).filter(Number.isFinite);return scores.length?(c.direction==='asc'?Math.min(...scores):Math.max(...scores)):null;}
export function challengeStatus(c){if(c.status_override==='Top leaderboard'||Number.isInteger(c.private_rank)&&c.private_rank>=1&&c.private_rank<=3)return 'Top leaderboard';const submissions=c.submissions||[];if(!submissions.length)return null;return submissions.every(s=>s.status==='Rejected')?'Fail':'Pass';}
export function optionalNumber(value){if(value===''||value==null)return null;const n=Number(value);if(!Number.isFinite(n))throw new Error('Điểm hoặc số tiền không hợp lệ.');return n;}
export function challengeValues(v){const name=v.name.trim();if(!name)throw new Error('Nhập tên challenge.');const result={name,type:v.type,tags:[...new Set(v.tags.split(',').map(t=>t.trim()).filter(Boolean))],metric:v.metric,direction:v.direction,status_override:v.status_override||null};for(const key of ['baseline','est_earn','actual_earn','public_rank','private_rank']){result[key]=optionalNumber(v[key]);if(['est_earn','actual_earn'].includes(key)&&result[key]!=null&&result[key]<0)throw new Error('Số tiền phải từ 0 trở lên.');if(['public_rank','private_rank'].includes(key)&&result[key]!=null&&(!Number.isInteger(result[key])||result[key]<1))throw new Error('Thứ hạng phải là số nguyên dương.');}return result;}

const dateParts = new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'});
export function dateInput(value){
 if(!value)return '';
 const date=new Date(value);if(!Number.isFinite(date.getTime()))return '';
 const parts=Object.fromEntries(dateParts.formatToParts(date).map(p=>[p.type,p.value]));
 return `${parts.year}-${parts.month}-${parts.day}`;
}
export function fmtDate(value){const date=dateInput(value);if(!date)return '—';return date.split('-').reverse().join('/');}
export function dateTimestamp(value){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value)throw new Error('Ngày challenge không hợp lệ.');
 return value+'T00:00:00+07:00';
}
export function oldestFirst(a,b){const time=value=>{const n=Date.parse(value);return Number.isFinite(n)?n:Infinity};return time(a.created_at)-time(b.created_at)||a.name.localeCompare(b.name,'vi');}

const clockParts = new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
export function dateTimeInput(value){const day=dateInput(value);if(!day)return '';return `${day}T${clockParts.format(new Date(value))}`;}
export function fmtDateTime(value){const text=dateTimeInput(value);return text?`${fmtDate(value)} ${text.slice(11)}`:'—';}
export function dateTimeTimestamp(value){
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))throw new Error('Ngày giờ challenge không hợp lệ.');
 dateTimestamp(value.slice(0,10));
 const timestamp=value+':00+07:00';
 if(dateTimeInput(timestamp)!==value)throw new Error('Ngày giờ challenge không hợp lệ.');
 return timestamp;
}
export function compareChallenges(a,b,key='created_at',direction='asc'){
 const numberKeys=['created_at','est_earn','actual_earn','public_rank','private_rank'];
 const value=c=>{const raw=c[key];if(raw==null||raw==='')return null;if(numberKeys.includes(key)){const n=key==='created_at'?Date.parse(raw):Number(raw);return Number.isFinite(n)?n:null;}return String(raw);};
 const av=value(a),bv=value(b);
 if(av===null&&bv!==null)return 1;if(bv===null&&av!==null)return -1;
 const order=av===null?0:typeof av==='number'?av-bv:av.localeCompare(bv,'vi',{numeric:true,sensitivity:'base'});
 return order*(direction==='desc'?-1:1)||oldestFirst(a,b);
}

export function paginateChallenges(rows,page=1,pageSize=10){
 const total=rows.length,totalPages=Math.max(1,Math.ceil(total/pageSize));
 const currentPage=Math.max(1,Math.min(page,totalPages)),offset=(currentPage-1)*pageSize;
 return {rows:rows.slice(offset,offset+pageSize),total,totalPages,currentPage,offset,start:total?offset+1:0,end:Math.min(offset+pageSize,total)};
}
