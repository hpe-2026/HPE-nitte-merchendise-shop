import { useState, useEffect } from 'react'
import { User, Mail, Clock, LogOut } from 'lucide-react'
import './Profile.css'

function Profile({ user, onLogout }) {
  const [userData, setUserData] = useState(user)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name || ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = () => {
    // Update localStorage
    const updatedUser = {
      ...userData,
      name: formData.name
    }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    setUserData(updatedUser)
    setEditing(false)
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            <User size={48} />
          </div>
          <h1 className="profile-name">{userData.name}</h1>
          <p className="profile-email">{userData.email}</p>
        </div>

        <div className="profile-details">
          <div className="detail-section">
            <h2>Account Information</h2>
            
            <div className="detail-item">
              <label>Full Name</label>
              {editing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="profile-input"
                />
              ) : (
                <p>{userData.name}</p>
              )}
            </div>

            <div className="detail-item">
              <label>Email Address</label>
              <p>{userData.email}</p>
              <small className="email-note">Email cannot be changed</small>
            </div>

            <div className="detail-item">
              <label>User ID</label>
              <p className="user-id"><code>{userData.userId}</code></p>
            </div>

            {/* Account created date */}
            <div className="detail-item">
              <label>Account Created</label>
              <p>
                <Clock size={16} style={{ display: 'inline', marginRight: '8px' }} />
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="action-buttons">
            {!editing ? (
              <button 
                onClick={() => setEditing(true)}
                className="btn-edit"
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button 
                  onClick={handleSave}
                  className="btn-save"
                >
                  Save Changes
                </button>
                <button 
                  onClick={() => setEditing(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
              </>
            )}
            
            <button 
              onClick={onLogout}
              className="btn-logout"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
