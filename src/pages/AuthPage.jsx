import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    let res
    if (isRegister) {
      res = await supabase.auth.signUp({ email, password, options: { data: { username } } })
    } else {
      res = await supabase.auth.signInWithPassword({ email, password })
    }
    if (res.error) {
      setError(res.error.message)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-full max-w-sm space-y-4">
        <h2 className="text-lg font-bold text-center">
          {isRegister ? 'Регистрация' : 'Вход'}
        </h2>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <input
          type="email"
          className="input input-bordered w-full"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        {isRegister && (
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Имя пользователя"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        )}
        <input
          type="password"
          className="input input-bordered w-full"
          placeholder="Пароль"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary w-full">
          {isRegister ? 'Зарегистрироваться' : 'Войти'}
        </button>
        <button
          type="button"
          className="btn btn-link w-full"
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Регистрация'}
        </button>
      </form>
    </div>
  )
}
