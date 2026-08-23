import { useEffect, useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { getTeamMembers, inviteTeamMember } from '../../tenantAuthApi';
import TiltCard3D from '../3d/TiltCard3D';
import { Users, UserPlus, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function TeamManagement({ addLog, onTriggerToast, onBack }) {
  const { tenantUserSession } = usePortal();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('DEVELOPER');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const userRole = tenantUserSession?.role;
  const canInvite = userRole === 'OWNER' || userRole === 'ADMIN';

  async function loadTeam() {
    setLoading(true);
    const res = await getTeamMembers();
    addLog({
      method: res.meta.method,
      url: res.meta.url,
      status: res.status,
      elapsed: res.meta.elapsed,
      body: res.data,
    });

    if (res.ok) {
      setMembers(res.data);
    } else {
      onTriggerToast('error', 'Error', 'Failed to retrieve team members.');
    }
    setLoading(false);
  }

  useEffect(() => {
    loadTeam();
  }, [addLog]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;
    setSubmitting(true);
    setError('');

    const finalRole = userRole === 'ADMIN' ? 'DEVELOPER' : role;

    const res = await inviteTeamMember(name.trim(), email.trim(), password, finalRole);
    addLog({
      method: res.meta.method,
      url: res.meta.url,
      status: res.status,
      elapsed: res.meta.elapsed,
      body: res.data,
    });

    if (res.ok) {
      onTriggerToast('success', 'Invitation Success', `User ${name} has been added as ${finalRole}.`);
      setName('');
      setEmail('');
      setPassword('');
      loadTeam();
    } else {
      setError(res.data?.error || 'Invitation failed.');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all text-white flex items-center justify-center cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users size={20} className="text-blue-400" />
            Team Management
          </h1>
          <p className="text-xs text-gray-500">View and manage team workspace credentials and privileges</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Workspace Members ({members.length})</h3>

          {loading ? (
            <div className="text-center py-10 text-xs text-gray-500">Loading team members...</div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="glass-panel p-4 rounded-xl border border-white/[0.05] hover:border-white/[0.08] transition-all flex items-center justify-between bg-slate-950/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs uppercase">
                      {member.name.substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{member.name}</h4>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[9px] font-bold font-mono border ${
                        member.role === 'OWNER'
                          ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                          : member.role === 'ADMIN'
                          ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {member.role}
                    </span>
                    <span className="text-[9px] text-gray-600 font-mono">
                      Joined: {new Date(member.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {canInvite ? (
            <TiltCard3D glowColor="rgba(59, 130, 246, 0.1)" depth={4}>
              <div className="p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white border-b border-white/[0.06] pb-2 flex items-center gap-2">
                  <UserPlus size={16} className="text-blue-400" />
                  Invite Team Member
                </h3>

                <form onSubmit={handleInvite} className="space-y-4 text-xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400">Full Name</label>
                    <input
                      className="input-field"
                      type="text"
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400">Email Address</label>
                    <input
                      className="input-field"
                      type="email"
                      placeholder="colleague@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400">Initial Password</label>
                    <input
                      className="input-field"
                      type="password"
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400">Role</label>
                    {userRole === 'ADMIN' ? (
                      <div className="bg-slate-900/60 p-2.5 rounded border border-white/[0.05] text-emerald-400 font-bold font-mono">
                        DEVELOPER (Fixed for Admins)
                      </div>
                    ) : (
                      <select
                        className="input-field bg-slate-900 text-white cursor-pointer"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                      >
                        <option value="DEVELOPER">DEVELOPER (API and integrations)</option>
                        <option value="ADMIN">ADMIN (Workspace settings & team)</option>
                      </select>
                    )}
                  </div>

                  {error && <p className="login-error text-[11px] p-2">{error}</p>}

                  <button className="btn btn-primary w-full py-2.5" type="submit" disabled={submitting}>
                    {submitting ? 'Creating Member…' : 'Create Team Member'}
                  </button>
                </form>
              </div>
            </TiltCard3D>
          ) : (
            <div className="glass-panel p-5 rounded-xl border border-white/[0.05] flex flex-col gap-3 items-center text-center bg-slate-950/20">
              <ShieldAlert size={28} className="text-amber-500" />
              <h4 className="text-xs font-bold text-white">Privileged Access Required</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                As a <span className="font-mono text-emerald-400">DEVELOPER</span>, you do not have permission to invite users or edit workspace access settings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
