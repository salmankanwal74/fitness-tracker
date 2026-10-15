import { useState , useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Dumbbell,
  Apple,
  Scale,
  Ruler,
  TrendingUp,
  BarChart3,
  PieChart,
  Target,
  FileText,
  User,
  Settings,
  LifeBuoy,
  LogOut,
  Menu,
  X,
    ChevronDown,
  Users,
  MessageSquare,
  ShieldCheck,

} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LOG_LINKS = [
  { to: '/workouts', label: 'Workouts', icon: Dumbbell },
  { to: '/nutrition', label: 'Nutrition', icon: Apple },
  { to: '/weight', label: 'Weight', icon: Scale },
  { to: '/measurements', label: 'Measurements', icon: Ruler },
  { to: '/performance', label: 'Performance', icon: TrendingUp },
];

const ANALYTICS_LINKS = [
  { to: '/workout-analytics', label: 'Workout Analytics', icon: BarChart3 },
  { to: '/nutrition-analytics', label: 'Nutrition Analytics', icon: PieChart },
];

function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(true);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
    setMenuOpen(false);
  };

  const closeMobile = () => setMenuOpen(false);
  
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  if (!user) return null;

  const linkClass = ({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`;

  return (
    <>
      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <span className="navbar-brand">🏋️ Fitness Tracker</span>
               <button
          className="hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="sidebar-nav"
        >          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Backdrop for mobile drawer */}
           {menuOpen && <div className="sidebar-backdrop" onClick={closeMobile} aria-hidden="true" />}

           <aside id="sidebar-nav" className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-brand-emoji">🏋️</span>
          <span>Fitness Tracker</span>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <NavLink to="/dashboard" className={linkClass} onClick={closeMobile}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

                    <button
            className="sidebar-group-toggle"
            onClick={() => setLogOpen(!logOpen)}
            aria-expanded={logOpen}
          >
            <span>Log</span>
            <ChevronDown size={16} className={logOpen ? 'chevron-open' : ''} />
          </button>
          {logOpen && (
            <div className="sidebar-group">
              {LOG_LINKS.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className={linkClass} onClick={closeMobile}>
                  <Icon size={17} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          )}

          <button
            className="sidebar-group-toggle"
            onClick={() => setAnalyticsOpen(!analyticsOpen)}
            aria-expanded={analyticsOpen}
          >
            <span>Analytics</span>
            <ChevronDown size={16}aria-hidden="true"  className={analyticsOpen ? 'chevron-open' : ''} />
          </button>
          {analyticsOpen && (
            <div className="sidebar-group">
              {ANALYTICS_LINKS.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className={linkClass} onClick={closeMobile}>
                  <Icon size={17} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          )}

          <NavLink to="/goals" className={linkClass} onClick={closeMobile}>
            <Target size={18} />
            <span>Goals</span>
          </NavLink>
          <NavLink to="/reports" className={linkClass} onClick={closeMobile}>
            <FileText size={18} />
            <span>Reports</span>
          </NavLink>
                    <NavLink to="/community" className={linkClass} onClick={closeMobile}>
            <Users size={18} />
            <span>Community</span>
          </NavLink>
          <NavLink to="/forum" className={linkClass} onClick={closeMobile}>
            <MessageSquare size={18} />
            <span>Forum</span>
          </NavLink>

          <div className="sidebar-divider" />

          <NavLink to="/profile" className={linkClass} onClick={closeMobile}>
            <User size={18} />
            <span>Profile</span>
          </NavLink>
          <NavLink to="/settings" className={linkClass} onClick={closeMobile}>
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>
          <NavLink to="/support" className={linkClass} onClick={closeMobile}>
            <LifeBuoy size={18} />
            <span>Support</span>
          </NavLink>
                    {user.role === 'admin' && (
            <NavLink to="/admin/support" className={linkClass} onClick={closeMobile}>
              <ShieldCheck size={18} />
              <span>Support Inbox</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user.name.charAt(0).toUpperCase()}</div>
            <div>
              <div className="sidebar-user-name">{user.name}</div>
              {user.username && <div className="sidebar-user-handle">@{user.username}</div>}
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Navbar;