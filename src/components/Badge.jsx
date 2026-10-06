import { colorStyle, TYPE_COLORS, STATUS_COLORS } from '../lib/domain.js';
export default function Badge({value,type=false}){return <span className="badge" style={colorStyle(type?TYPE_COLORS[value]:STATUS_COLORS[value])}>{value||'—'}</span>}
