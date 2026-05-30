import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { SectionCard } from '../components/SectionCard';
import { TopBar } from '../components/TopBar';

const PAGE_SIZE = 10;

type UserRow = {
  id: number;
  name: string;
  username: string;
  roles: string[];
};

type UsersResponse = {
  data: UserRow[];
  meta: { page: number; limit: number; total: number };
};

export function AdminDashboard() {
  const { authedRequest } = useAuth();

  const [vendorName, setVendorName] = useState('');
  const [vendorCampus, setVendorCampus] = useState('');
  const [vendorStatus, setVendorStatus] = useState('');

  const [vendorId, setVendorId] = useState('');
  const [userId, setUserId] = useState('');
  const [vendorRole, setVendorRole] = useState('staff');
  const [linkStatus, setLinkStatus] = useState('');

  const [users, setUsers] = useState<UserRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total],
  );

  const fetchUsers = async (nextPage = page) => {
    setLoadingUsers(true);
    setLinkStatus('');
    try {
      const result = await authedRequest<UsersResponse>(
        `/v1/user?page=${nextPage}&limit=${PAGE_SIZE}`,
      );
      setUsers(result.data);
      setTotal(result.meta.total);
      setPage(result.meta.page);
    } catch (err) {
      setLinkStatus(
        (err as { message?: string }).message ?? 'Failed to load users',
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    void fetchUsers(1);
  }, []);

  const createVendor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setVendorStatus('');
    try {
      const payload = {
        name: vendorName.trim(),
        campus: vendorCampus.trim() || undefined,
      };
      await authedRequest('/v1/vendors', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setVendorStatus('Vendor created. Use the vendor id from the response.');
      setVendorName('');
      setVendorCampus('');
    } catch (err) {
      setVendorStatus(
        (err as { message?: string }).message ?? 'Failed to create vendor',
      );
    }
  };

  const linkVendorUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLinkStatus('');
    try {
      await authedRequest(`/v1/vendors/${vendorId}/users`, {
        method: 'POST',
        body: JSON.stringify({
          userId: Number(userId),
          role: vendorRole,
        }),
      });
      setLinkStatus('User linked to vendor.');
      setUserId('');
    } catch (err) {
      setLinkStatus(
        (err as { message?: string }).message ?? 'Failed to link user',
      );
    }
  };

  return (
    <div className="shell">
      <TopBar />
      <div className="grid">
        <SectionCard
          title="Create Vendor"
          description="Register a campus vendor to enable settlement tracking."
        >
          <form onSubmit={createVendor} className="stack">
            <label className="field">
              <span>Vendor name</span>
              <input
                value={vendorName}
                onChange={(event) => setVendorName(event.target.value)}
                placeholder="Campus Cafe"
                required
              />
            </label>
            <label className="field">
              <span>Campus (optional)</span>
              <input
                value={vendorCampus}
                onChange={(event) => setVendorCampus(event.target.value)}
                placeholder="Main"
              />
            </label>
            {vendorStatus ? <p className="alert">{vendorStatus}</p> : null}
            <button className="button" type="submit">
              Create vendor
            </button>
          </form>
        </SectionCard>

        <SectionCard
          title="Assign Vendor Users"
          description="Map an existing user to a vendor and grant access."
        >
          <form onSubmit={linkVendorUser} className="stack">
            <label className="field">
              <span>Vendor ID</span>
              <input
                value={vendorId}
                onChange={(event) => setVendorId(event.target.value)}
                placeholder="1"
                required
              />
            </label>
            <label className="field">
              <span>User ID</span>
              <input
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                placeholder="12"
                required
              />
            </label>
            <label className="field">
              <span>Role</span>
              <select
                value={vendorRole}
                onChange={(event) => setVendorRole(event.target.value)}
              >
                <option value="owner">Owner</option>
                <option value="staff">Staff</option>
              </select>
            </label>
            {linkStatus ? <p className="alert">{linkStatus}</p> : null}
            <button className="button" type="submit">
              Link user
            </button>
          </form>
        </SectionCard>

        <SectionCard
          title="Users"
          description="Admin-only user list with roles."
        >
          <div className="table">
            <div className="table-row head">
              <span>ID</span>
              <span>Name</span>
              <span>Username</span>
              <span>Roles</span>
            </div>
            {users.map((user) => (
              <div className="table-row" key={user.id}>
                <span>#{user.id}</span>
                <span>{user.name}</span>
                <span>{user.username}</span>
                <span className="pill-row">
                  {user.roles?.map((role) => (
                    <span key={role} className="pill">
                      {role}
                    </span>
                  ))}
                </span>
              </div>
            ))}
            {users.length === 0 && !loadingUsers ? (
              <p className="muted">No users found.</p>
            ) : null}
          </div>

          <div className="pager">
            <button
              className="button ghost"
              onClick={() => fetchUsers(Math.max(1, page - 1))}
              disabled={page <= 1 || loadingUsers}
            >
              Prev
            </button>
            <span className="muted">
              Page {page} of {pageCount}
            </span>
            <button
              className="button ghost"
              onClick={() => fetchUsers(Math.min(pageCount, page + 1))}
              disabled={page >= pageCount || loadingUsers}
            >
              Next
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
