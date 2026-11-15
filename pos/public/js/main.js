import { NAV, route } from './ui.js';
import './pos.js';
import './admin.js';

const ORDER = ['floor', 'kds', 'orders', 'dashboard', 'menu', 'inventory', 'purchases', 'vendors', 'customers', 'staff', 'expenses', 'reports', 'dayclose', 'settings'];
NAV.sort((a, b) => ORDER.indexOf(a.path) - ORDER.indexOf(b.path));
window.addEventListener('hashchange', route);
route();
