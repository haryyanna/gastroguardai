import { NavLink } from 'react-router-dom';
import { Home, MessageSquare, Activity, BarChart2, Camera } from 'lucide-react';
import './BottomNav.css';

const BottomNav = () => {
    return (
        <nav className="bottom-nav">
            <NavLink
                to="/home"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
                <div className="icon-container">
                    <Home size={22} />
                </div>
                <span>Home</span>
            </NavLink>

            <NavLink
                to="/scan"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
                <div className="icon-container">
                    <Camera size={22} />
                </div>
                <span>Scan Makanan</span>
            </NavLink>

            <NavLink
                to="/chat"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
                <div className="icon-container">
                    <MessageSquare size={22} />
                </div>
                <span>Ranstal AI</span>
            </NavLink>

            <NavLink
                to="/checklist"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
                <div className="icon-container">
                    <Activity size={22} />
                </div>
                <span>Checklist</span>
            </NavLink>

            <NavLink
                to="/progress"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
                <div className="icon-container">
                    <BarChart2 size={22} />
                </div>
                <span>Destinasi</span>
            </NavLink>
        </nav>
    );
};

export default BottomNav;
