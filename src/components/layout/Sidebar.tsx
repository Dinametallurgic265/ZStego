import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/encode',    icon: <LockIcon />,    label: 'Encode' },
  { to: '/decode',    icon: <UnlockIcon />,  label: 'Decode' },
  { to: '/analyze',   icon: <ScanIcon />,    label: 'Analyze' },
  { to: '/testbench', icon: <FlaskIcon />,   label: 'Test Bench' },
  { to: '/settings',  icon: <GearIcon />,    label: 'Settings' },
  { to: '/about',     icon: <InfoIcon />,    label: 'About' },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}>
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-pill"
                    className="sidebar-pill"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-version mono">v0.1.0</span>
        <span className="sidebar-version mono">GPL-3.0</span>
      </div>
    </aside>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="3" y="8" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function UnlockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="3" y="8" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6 8V6a3 3 0 016 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="5" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="9" cy="9" r="2" fill="currentColor"/>
      <path d="M2 9h2M14 9h2M9 2v2M9 14v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9 8v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="9" cy="5.5" r="0.75" fill="currentColor"/>
    </svg>
  );
}

function FlaskIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M7 2v7L3 15a2 2 0 001.75 3h8.5A2 2 0 0015 15L11 9V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.5 2h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="7" cy="13" r="1" fill="currentColor" opacity="0.6"/>
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9 2v2M9 14v2M2 9h2M14 9h2M4.05 4.05l1.41 1.41M12.54 12.54l1.41 1.41M12.54 5.46l1.41-1.41M4.05 13.95l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
