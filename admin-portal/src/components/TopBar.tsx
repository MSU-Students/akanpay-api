import { useAuth } from '../auth/AuthContext';

export function TopBar() {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Admin Console</p>
        <h1>AkanPay Vendor Ops</h1>
      </div>
      <div className="topbar-meta">
        <div>
          <p className="label">Signed in</p>
          <p className="value">{user?.username}</p>
        </div>
        <button className="button ghost" onClick={() => logout()}>
          Sign out
        </button>
      </div>
    </header>
  );
}
