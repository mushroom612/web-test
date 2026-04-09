import {useState} from "react";

export default function Header({sectionName}) {
  const [notifications, setNotifications] = useState(3);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">{sectionName}</h1>

        <div className="header-actions">
          {/* Notifications */}
          <div className="notification-wrapper">
            <button className="notification-btn">
              🔔
              {notifications > 0 && (
                <span className="notification-badge">{notifications}</span>
              )}
            </button>
          </div>

          {/* User Profile Dropdown */}
          <div className="profile-dropdown">
            <button
              className="profile-btn"
              onClick={() => setShowProfile(!showProfile)}
            >
              <div className="profile-avatar">JD</div>
              <div className="profile-info">
                <div className="profile-name">Jislia Dicosa</div>
                <div className="profile-role">Admin</div>
              </div>
              <span className={`dropdown-icon ${showProfile ? "open" : ""}`}>
                ▼
              </span>
            </button>

            {showProfile && (
              <div className="profile-menu">
                <a href="#" className="profile-menu-item">
                  👤 Profile
                </a>
                <a href="#" className="profile-menu-item">
                  ⚙️ Settings
                </a>
                <a href="#" className="profile-menu-item">
                  🔐 Security
                </a>
                <div className="menu-divider"></div>
                <a href="#" className="profile-menu-item logout">
                  🚪 Logout
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
