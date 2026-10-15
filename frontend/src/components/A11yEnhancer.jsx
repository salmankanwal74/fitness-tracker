import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

// Har route ka page title (browser tab + screen reader announcement)
const TITLES = {
  '/': 'Welcome',
  '/login': 'Login',
  '/signup': 'Sign up',
  '/forgot-password': 'Forgot password',
  '/privacy': 'Privacy Policy',
  '/terms': 'Terms of Service',
  '/dashboard': 'Dashboard',
  '/workouts': 'Workouts',
  '/weight': 'Weight',
  '/measurements': 'Measurements',
  '/performance': 'Performance',
  '/nutrition': 'Nutrition',
  '/workout-analytics': 'Workout Analytics',
  '/nutrition-analytics': 'Nutrition Analytics',
  '/goals': 'Goals',
  '/reports': 'Reports',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/support': 'Support',
};

const hasName = (el) =>
  el.hasAttribute('aria-label') ||
  el.hasAttribute('aria-labelledby') ||
  (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) ||
  el.closest('label');

// Jis form field ka label nahi, usko placeholder / title se accessible naam dena
function labelFields(root) {
  root.querySelectorAll('input, select, textarea').forEach((el) => {
    if (el.type === 'hidden' || el.type === 'checkbox' || el.type === 'radio') return;
    if (hasName(el)) return;
    const name = el.getAttribute('placeholder') || el.getAttribute('title') || el.getAttribute('name');
    if (name) {
      el.setAttribute('aria-label', name);
    } else if (el.type === 'date') {
      el.setAttribute('aria-label', 'Date');
    }
  });
}

// Recharts ke graphs ko screen reader ke liye "image" bana kar naam dena
function labelCharts(root) {
  root.querySelectorAll('.recharts-wrapper').forEach((el) => {
    if (el.closest('[role="img"]')) return;
    const heading = el.closest('.chart-container')?.querySelector('h3');
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', `${heading ? heading.textContent : 'Data'} chart`);
  });
}

function A11yEnhancer() {
  const location = useLocation();
  const [message, setMessage] = useState('');
  const first = useRef(true);

  // 1) Route badalne par: title, screen-reader announcement, focus main content par
  useEffect(() => {
    const path = location.pathname.startsWith('/reset-password') ? '/reset-password' : location.pathname;
    const name = TITLES[path] || (path === '/reset-password' ? 'Reset password' : 'Fitness Tracker');
    document.title = `${name} | Fitness Tracker`;

    if (first.current) {
      first.current = false;
      return;
    }
    setMessage(`${name} page`);
    const main = document.getElementById('main-content');
    if (main) main.focus({ preventScroll: true });
  }, [location.pathname]);

  // 2) DOM mein naye fields/charts aaye to unhe label dena
  useEffect(() => {
    const run = () => {
      labelFields(document);
      labelCharts(document);
    };
    run();
    let timer;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(run, 100);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}

export default A11yEnhancer;