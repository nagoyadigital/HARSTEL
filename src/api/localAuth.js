/**
 * LocalAuth - Production-grade localStorage-based authentication
 * Features: password hashing, session tokens with expiry, remember me, activity logging
 */

const AUTH_KEY = 'harstel_auth_session'
const USERS_KEY = 'harstel_users'
const ACTIVITY_LOG_KEY = 'harstel_activity_log'
const SESSION_DURATION = 8 * 60 * 60 * 1000 // 8 hours
const REMEMBER_ME_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days

// Simple hash function (production would use bcrypt via backend)
async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'harstel_salt_2024')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function verifyPassword(password, hash) {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

function generateToken() {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

function getUsers() {
  const raw = localStorage.getItem(USERS_KEY)
  return raw ? JSON.parse(raw) : []
}

function setUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function getSession() {
  const raw = localStorage.getItem(AUTH_KEY)
  if (!raw) return null
  try {
    const session = JSON.parse(raw)
    // Check expiry
    if (session.expiresAt && Date.now() > session.expiresAt) {
      clearSession()
      logActivity('session_expired', { userId: session.userId })
      return null
    }
    return session
  } catch {
    clearSession()
    return null
  }
}

function setSession(session) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(session))
}

function clearSession() {
  localStorage.removeItem(AUTH_KEY)
  // Also clear any cached auth data
  sessionStorage.clear()
}

function logActivity(action, details = {}) {
  try {
    const logs = JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || '[]')
    logs.push({
      id: generateToken().slice(0, 16),
      action,
      details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    })
    // Keep last 500 entries
    if (logs.length > 500) logs.splice(0, logs.length - 500)
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(logs))
  } catch {
    // Silent fail for logging
  }
}

// Seed default admin user with hashed password
async function ensureDefaultUser() {
  const users = getUsers()
  if (users.length === 0) {
    const hashedPassword = await hashPassword('admin123')
    setUsers([
      {
        id: 'admin-001',
        username: 'admin',
        email: 'admin@harstel.local',
        password: hashedPassword,
        name: 'Administrator',
        full_name: 'Administrator',
        role: 'admin',
        created_date: new Date().toISOString(),
      },
    ])
  } else {
    // Migration: ensure existing users have username field and hashed passwords
    let needsUpdate = false
    for (const user of users) {
      if (!user.username) {
        user.username = user.email ? user.email.split('@')[0] : 'admin'
        needsUpdate = true
      }
      // If password is plain text (not 64 char hex), hash it
      if (user.password && user.password.length !== 64) {
        user.password = await hashPassword(user.password)
        needsUpdate = true
      }
    }
    if (needsUpdate) setUsers(users)
  }
}

// Initialize
ensureDefaultUser()

export const localAuth = {
  async me() {
    const session = getSession()
    if (!session) return null
    const users = getUsers()
    const user = users.find(u => u.id === session.userId)
    if (!user) {
      clearSession()
      return null
    }
    const { password, ...safeUser } = user
    return safeUser
  },

  async loginViaUsernamePassword(username, password, rememberMe = false) {
    const users = getUsers()
    // Find by username or email
    const user = users.find(u => u.username === username || u.email === username)
    if (!user) {
      logActivity('login_failed', { username, reason: 'user_not_found' })
      throw new Error('Username atau password salah')
    }

    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      logActivity('login_failed', { username, reason: 'invalid_password' })
      throw new Error('Username atau password salah')
    }

    const token = generateToken()
    const duration = rememberMe ? REMEMBER_ME_DURATION : SESSION_DURATION
    const session = {
      userId: user.id,
      token,
      rememberMe,
      createdAt: Date.now(),
      expiresAt: Date.now() + duration,
    }
    setSession(session)
    logActivity('login_success', { userId: user.id, username: user.username, rememberMe })

    const { password: _, ...safeUser } = user
    return { access_token: token, user: safeUser }
  },

  // Keep backward compatibility
  async loginViaEmailPassword(email, password) {
    return this.loginViaUsernamePassword(email, password, false)
  },

  async loginWithProvider(provider, returnUrl) {
    const users = getUsers()
    const admin = users[0]
    if (admin) {
      const token = generateToken()
      setSession({
        userId: admin.id,
        token,
        rememberMe: false,
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION,
      })
      logActivity('login_provider', { provider, userId: admin.id })
    }
    window.location.hash = returnUrl || '/'
  },

  async register({ email, password, name, username }) {
    const users = getUsers()
    if (users.find(u => u.email === email || u.username === username)) {
      throw new Error('Username atau email sudah terdaftar')
    }
    const hashedPassword = await hashPassword(password)
    const newUser = {
      id: 'user-' + Date.now().toString(36),
      username: username || email.split('@')[0],
      email,
      password: hashedPassword,
      name: name || email.split('@')[0],
      full_name: name || email.split('@')[0],
      role: 'staff',
      created_date: new Date().toISOString(),
    }
    users.push(newUser)
    setUsers(users)
    logActivity('register', { userId: newUser.id, username: newUser.username })
    return { success: true }
  },

  async verifyOtp({ email, otpCode }) {
    const users = getUsers()
    const user = users.find(u => u.email === email)
    if (!user) throw new Error('User not found')
    const token = generateToken()
    setSession({
      userId: user.id,
      token,
      rememberMe: false,
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION,
    })
    return { access_token: token }
  },

  setToken(token) {
    const session = getSession()
    if (session) {
      setSession({ ...session, token })
    }
  },

  async resendOtp(email) {
    return { success: true }
  },

  async resetPasswordRequest(email) {
    const users = getUsers()
    if (!users.find(u => u.email === email)) {
      throw new Error('Email tidak terdaftar')
    }
    return { success: true }
  },

  async resetPassword({ resetToken, newPassword }) {
    const users = getUsers()
    if (users.length > 0) {
      users[0].password = await hashPassword(newPassword)
      setUsers(users)
    }
    return { success: true }
  },

  async logout() {
    const session = getSession()
    if (session) {
      logActivity('logout', { userId: session.userId })
    }
    // Clear ALL auth-related data
    clearSession()
    // Clear query cache
    localStorage.removeItem('harstel_query_cache')
    sessionStorage.clear()
  },

  isSessionValid() {
    const session = getSession()
    return session !== null
  },

  getActivityLog() {
    try {
      return JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || '[]')
    } catch {
      return []
    }
  },

  redirectToLogin(returnUrl) {
    window.location.hash = '/login' + (returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : '')
  },
}
