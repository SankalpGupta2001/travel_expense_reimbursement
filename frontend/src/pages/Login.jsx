import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUsers, login } from '../services/auth.api.js';

export default function Login() {
  const [users, setUsers] = useState([]); const [code, setCode] = useState('NX-4471'); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); const location = useLocation();
  useEffect(() => { getUsers().then(setUsers).catch(e => setError(e.message)); }, []);
  const submit = async e => { e.preventDefault(); setLoading(true); setError(''); try { await login(code); navigate(location.state?.from || '/dashboard', { replace:true }); } catch(e){setError(e.message)} finally{setLoading(false)} };
  return <div className="login-page"><div className="card login-card"><span className="eyebrow">NORTEX INDUSTRIES</span><h1>Travel Expense Reimbursement</h1><p>Select a demo employee to continue.</p><form onSubmit={submit}><label><span>Employee</span><select value={code} onChange={e=>setCode(e.target.value)}>{users.map(u=><option key={u.employeeCode} value={u.employeeCode}>{u.name} · {u.employeeCode} · {u.role}</option>)}</select></label>{error&&<div className="alert error-alert">{error}</div>}<button className="button primary" disabled={loading}>{loading?'Signing in...':'Login'}</button></form></div></div>;
}
