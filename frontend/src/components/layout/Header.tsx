import { useMemo, useState, type ComponentType, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { TbFlame, TbSparkles, TbStars } from 'react-icons/tb';
import { HiOutlinePlus } from 'react-icons/hi';
import { FiLogIn, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';

type SortValue = 'hot' | 'new' | 'top';

const sortTabs: Array<{ label: string; value: SortValue; icon: ComponentType<{ className?: string }> }> = [
  { label: 'Hot', value: 'hot', icon: TbFlame },
  { label: 'New', value: 'new', icon: TbSparkles },
  { label: 'Top', value: 'top', icon: TbStars },
];

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState<string>(searchParams.get('q') || '');
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeSort = useMemo(() => searchParams.get('sort') || 'hot', [searchParams]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams(location.search);

    if (searchValue) {
      params.set('q', searchValue);
    } else {
      params.delete('q');
    }

    navigate({ pathname: '/', search: params.toString() });
  };

  const handleSortChange = (value: SortValue) => {
    const params = new URLSearchParams(location.search);
    params.set('sort', value);
    navigate({ pathname: '/', search: params.toString() });
  };

  const openComposer = () => {
    if (!isAuthenticated) {
      toast.error('Sign in to create a post');
      navigate('/login');
      setMobileMenuOpen(false);
      return;
    }
    window.dispatchEvent(new CustomEvent('open-post-composer'));
    setMobileMenuOpen(false);
  };

  const desktopActions = isAuthenticated ? (
    <>
      <button
        type="button"
        onClick={() => {
          setMobileMenuOpen(false);
          navigate('/store');
        }}
        className="inline-flex items-center gap-1 rounded-xl border border-brand-200 px-3 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
      >
        <TbSparkles className="text-base" />
        {(user?.starsBalance ?? 0).toLocaleString()} Stars
      </button>
      <button
        type="button"
        onClick={openComposer}
        className="inline-flex items-center gap-1 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
        <div className="hidden leading-tight lg:block">
          <p className="text-sm font-semibold text-slate-700">{user?.displayName}</p>
          <p className="text-xs text-slate-500">@{user?.username}</p>
          <p className="text-xs capitalize text-brand-500">{(user?.membershipTier ?? 'free').replace('-', ' ')}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          setMobileMenuOpen(false);
          void logout();
        }}
        className="inline-flex items-center gap-1 rounded-xl border border-transparent px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-slate-200 hover:text-slate-900"
      >
        <FiLogOut className="text-base" />
        Log out
      </button>
    </>
  ) : (
    <>
      <NavLink
        to="/store"
        className="inline-flex items-center gap-1 rounded-xl border border-brand-200 px-3 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
      >
        <TbSparkles className="text-base" />
        Buy Stars
      </NavLink>
      <NavLink
        to="/login"
        className="inline-flex items-center gap-1 rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
      >
        <FiLogIn className="text-base" />
        Log in
      </NavLink>
      <NavLink
        to="/register"
        className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        Join now
      </NavLink>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="grid gap-3 lg:grid-cols-[auto,1fr,auto] lg:items-center">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-card">
                <span className="text-xl font-semibold">R</span>
              </div>
              <div className="flex flex-col leading-tight text-slate-900">
                <span className="text-lg font-semibold">Ripple</span>
                <span className="hidden text-xs text-slate-500 sm:block">A Reddit-inspired community</span>
              </div>
            </Link>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="order-3 w-full lg:order-2"
          >
            <div className="relative flex items-center">
              <input
                type="search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search posts or discussions..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-400 focus:bg-white focus:shadow-input"
              />
              <button
                type="submit"
                className="ml-2 inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                Search
              </button>
            </div>
          </form>

          <div className="hidden items-center justify-end gap-3 whitespace-nowrap lg:flex">
            {desktopActions}
          </div>

          <div className="flex items-center justify-end gap-2 lg:hidden">
            <button
              type="button"
              onClick={openComposer}
              className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-white shadow-card"
              aria-label="Create post"
            >
              <HiOutlinePlus className="text-lg" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <FiX className="text-lg" /> : <FiMenu className="text-lg" />}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="w-full overflow-x-auto rounded-full bg-slate-100 p-1 lg:w-auto">
            <div className="flex min-w-max items-center gap-2">
              {sortTabs.map(({ label, value, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleSortChange(value)}
                  className={clsx(
                    'flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition whitespace-nowrap',
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
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="mt-3 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card lg:hidden">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3">
                  <div
                    className="grid h-10 w-10 place-items-center rounded-full text-lg font-semibold text-white"
                    style={{ backgroundColor: user?.avatarColor || '#3f5fff' }}
                  >
                    {user?.displayName?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{user?.displayName}</p>
                    <p className="text-xs text-slate-500">@{user?.username}</p>
                    <p className="text-xs text-brand-500">Tier: {(user?.membershipTier ?? 'free').replace('-', ' ')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/store');
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
                >
                  <TbSparkles className="text-base" />
                  {(user?.starsBalance ?? 0).toLocaleString()} Stars
                </button>
                <button
                  type="button"
                  onClick={openComposer}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <HiOutlinePlus className="text-lg" />
                  New Post
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    void logout();
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  <FiLogOut className="text-base" />
                  Log out
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-500">
                  Sign in to save your favourite discussions and share updates with the community.
                </p>
                <NavLink
                  to="/store"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
                >
                  <TbSparkles className="text-base" />
                  Explore Stars
                </NavLink>
                <NavLink
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
                >
                  <FiLogIn className="text-base" />
                  Log in
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  Join now
                </NavLink>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
