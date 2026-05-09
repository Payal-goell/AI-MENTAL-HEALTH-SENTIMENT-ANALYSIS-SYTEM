import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('mindcare_user')) } catch { return null }
    })
    const [token, setToken] = useState(() => localStorage.getItem('mindcare_token'))

    const login = (userData, accessToken) => {
        setUser(userData)
        setToken(accessToken)
        localStorage.setItem('mindcare_user', JSON.stringify(userData))
        localStorage.setItem('mindcare_token', accessToken)
    }

    const logout = () => {
        setUser(null)
        setToken(null)
        localStorage.removeItem('mindcare_user')
        localStorage.removeItem('mindcare_token')
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
