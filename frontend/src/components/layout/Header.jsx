import { useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { TbFlame, TbSparkles, TbStars } from 'react-icons/tb';
import { HiOutlinePlus } from 'react-icons/hi';
import { FiLogIn, FiLogOut } from 'react-icons/fi';
import useAuth from '../../hooks/useAuth.js';

const sortTabs = [
  { label: 'Hot', value: 'hot', icon: TbFlame },
  { label: 'New', value: 'new', icon: TbSparkles },
  { label: 'Top', value: 'top', icon: TbStars },
];

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '');

  const activeSort = useMemo(() => searchParams.get('sort') || 'hot', [searchParams]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams(location.search);

    if (searchValue) {
      params.set('q', searchValue);
    } else {
      params.delete('q');
    }

    navigate({ pathname: '/', search: params.toString() });
  };

  const handleSortChange = (value) => {
    const params = new URLSearchParams(location.search);
    params.set('sort', value);
    navigate({ pathname: '/', search: params.toString() });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-4 px-4 py-4 md:flex-nowrap">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-card">
            <span className="text-xl font-semibold">R</span>
          </div>
          <div className="flex flex-col leading-tight text-slate-900">
            <span className="text-lg font-semibold">Ripple</span>
            <span className="text-xs text-slate-500">A Reddit-inspired community</span>
          </div>
        </Link>

        <form onSubmit={handleSearchSubmit} className="relative flex w-full items-center md:max-w-md">
          <input
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search posts or discussions..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-400 focus:bg-white focus:shadow-input"
          />
          <button
            type="submit"
            className="absolute right-2 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            Search
          </button>
        </form>

        <div className="flex w-full flex-1 items-center justify-between gap-4 md:w-auto">
          <div className="flex items-center gap-2 rounded-full bg-slate-100 p-1">
            {sortTabs.map(({ label, value, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleSortChange(value)}
                className={clsx(
                  'flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition',
                  activeSort === value
                    ? 'bg-white text-brand-600 shadow-sm'
                    : 'text-slate-500 hover:text-brand-600',
                )}
              >
                <Icon className="text-base" />
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const composer = document.getElementById('post-composer');
                    if (composer) {
                      composer.scrollIntoView({ behavior: 'smooth' });
                      const input = composer.querySelector('input, textarea');
                      input?.focus();
                    }
                  }}
                  className="flex items-center gap-1 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <HiOutlinePlus className="text-lg" />
                  New Post
                </button>
                <div className="flex items-center gap-3 rounded-full bg-slate-100 px-3 py-1.5">
                  <div
                    className="grid h-8 w-8 place-items-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: user?.avatarColor || '#3f5fff' }}
                  >
                    {user?.displayName?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="leading-tight">
                    <p className="text-sm font-semibold text-slate-700">{user?.displayName}</p>
                    <p className="text-xs text-slate-500">@{user?.username}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-1 rounded-xl border border-transparent px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-slate-200 hover:text-slate-900"
                >
                  <FiLogOut className="text-base" />
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="flex items-center gap-1 rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
                >
                  <FiLogIn className="text-base" />
                  Log in
                </NavLink>
                <NavLink
                  to="/register"
                  className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  Join now
                </NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
