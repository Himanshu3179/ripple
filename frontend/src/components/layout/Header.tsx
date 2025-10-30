import { useMemo, useState, type ComponentType, type FormEvent, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { TbFlame, TbSparkles, TbStars, TbUserPlus, TbLogout, TbShoppingCart } from 'react-icons/tb';
import { HiOutlinePlus } from 'react-icons/hi';
import { FiLogIn, FiMenu, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import NotificationBell from './NotificationBell';

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
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const activeSort = useMemo(() => searchParams.get('sort') || 'hot', [searchParams]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const navItems = useMemo(() => {
    const items: Array<{ to: string; label: string }> = [
      { to: '/', label: 'Home' },
      { to: '/communities', label: 'Communities' },
      { to: '/missions', label: 'Missions' },
      { to: '/store', label: 'Store' },
      { to: '/storyverse', label: 'Storyverse' },
    ];
    if (user?.membershipTier === 'star-pass' || user?.membershipTier === 'star-unlimited') {
      items.push({ to: '/schedule', label: 'Schedule' }, { to: '/analytics', label: 'Analytics' });
    }
    if (user?.role === 'admin') {
      items.push({ to: '/admin', label: 'Admin' });
    }
    return items;
  }, [user]);

  const desktopActions = isAuthenticated ? (
    <>
      <button
        type="button"
        onClick={openComposer}
        className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
      >
        <HiOutlinePlus className="text-lg" />
        New Post
      </button>
      <NotificationBell enabled={isAuthenticated} className="hidden lg:block" menuAlign="right" />
      <div className="relative" ref={profileMenuRef}>
        <button
          type="button"
          onClick={() => setProfileMenuOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-full p-1 transition hover:bg-slate-100"
        >
          <div
            className="grid h-9 w-9 place-items-center rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: user?.avatarColor || '#3f5fff' }}
          >
            {user?.displayName?.charAt(0)?.toUpperCase()}
          </div>
          <p className="hidden text-sm font-semibold text-slate-700 lg:block">{user?.displayName}</p>
        </button>
        {isProfileMenuOpen && (
          <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <div
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg font-semibold text-white"
                style={{ backgroundColor: user?.avatarColor || '#3f5fff' }}
              >
                {user?.displayName?.charAt(0)?.toUpperCase()}
              </div>
              <div className="leading-tight">
                <p className="font-semibold text-slate-800">{user?.displayName}</p>
                <p className="text-xs text-slate-500">@{user?.username}</p>
              </div>
            </div>
            <div className="my-2 h-px bg-slate-200" />
            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen(false);
                navigate('/store');
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <TbSparkles className="text-lg text-brand-500" />
              <span>{(user?.starsBalance ?? 0).toLocaleString()} Stars</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen(false);
                navigate('/referrals');
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <TbUserPlus className="text-lg text-slate-500" />
              <span>Referral hub</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen(false);
                navigate('/store');
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <TbShoppingCart className="text-lg text-slate-500" />
              <span>Visit Store</span>
            </button>
            <div className="my-2 h-px bg-slate-200" />
            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen(false);
                void logout();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <TbLogout className="text-lg" />
              <span>Log out</span>
            </button>
          </div>
        )}
      </div>
    </>
  ) : (
    <>
      <NavLink
        to="/login"
        className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
      >
        Log in
      </NavLink>
      <NavLink
        to="/register"
        className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
      >
        Join now
      </NavLink>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="grid grid-cols-[auto,1fr,auto] items-center gap-4">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm">
                <span className="text-xl font-bold">R</span>
              </div>
              <div className="hidden flex-col leading-tight text-slate-900 sm:flex">
                <span className="text-lg font-bold">Ripple</span>
                <span className="text-xs text-slate-500">A new wave of ideas</span>
              </div>
            </Link>
          </div>

          <div className="w-full max-w-md justify-self-center">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search Ripple..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-400 focus:bg-white focus:shadow-sm"
              />
            </form>
          </div>

      <div className="hidden items-center justify-end gap-2 whitespace-nowrap lg:flex">
        {desktopActions}
      </div>

          <div className="flex items-center justify-end gap-2 lg:hidden">
            <NotificationBell enabled={isAuthenticated} className="lg:hidden" menuAlign="right" />
            <button
              type="button"
              onClick={openComposer}
              className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-white shadow-sm"
              aria-label="Create post"
            >
              <HiOutlinePlus className="text-xl" />
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

        <nav className="mt-3 hidden items-center gap-3 text-sm font-semibold text-slate-500 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx('rounded-full px-3 py-1 transition', isActive ? 'bg-brand-50 text-brand-600' : 'hover:bg-slate-100')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
          <div className="w-full overflow-x-auto rounded-full bg-slate-100 p-1 lg:w-auto">
            <div className="flex min-w-max items-center gap-1">
              {sortTabs.map(({ label, value, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleSortChange(value)}
                  className={clsx(
                    'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition whitespace-nowrap',
                    activeSort === value
                      ? 'bg-white text-brand-600 shadow-sm'
                      : 'text-slate-500 hover:text-brand-600',
                  )}
                >
                  <Icon className="text-lg" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="mt-3 grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg lg:hidden">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-3 rounded-xl bg-slate-100 p-3">
                  <div
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg font-semibold text-white"
                    style={{ backgroundColor: user?.avatarColor || '#3f5fff' }}
                  >
                    {user?.displayName?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="leading-tight">
                    <p className="font-semibold text-slate-800">{user?.displayName}</p>
                    <p className="text-xs text-slate-500">@{user?.username}</p>
                  </div>
                </div>
                <NavLink
                  to="/store"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <TbSparkles className="text-lg text-brand-500" />
                  <span>{(user?.starsBalance ?? 0).toLocaleString()} Stars</span>
                </NavLink>
                <NavLink
                  to="/referrals"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <TbUserPlus className="text-lg text-slate-500" />
                  <span>Referral hub</span>
                </NavLink>
                <div className="grid gap-1">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        clsx(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                          isActive ? 'bg-brand-50 text-brand-600' : 'text-slate-700 hover:bg-slate-100',
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
                <div className="my-1 h-px bg-slate-200" />
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    void logout();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <TbLogout className="text-lg" />
                  <span>Log out</span>
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  <FiLogIn className="text-base" />
                  Log in
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
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
