import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'
import { useNavigate } from 'react-router-dom'

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const navigate = useNavigate()
  const { getSession, onAuthStateChange, signUp, signIn } = useSupabaseAuth()

  const schema = z
    .object({
      email: z.string().email('Некорректный email'),
      password: z.string().min(6, 'Пароль должен быть минимум 6 символов'),
      username: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (isRegister && !data.username) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Имя обязательно',
          path: ['username'],
        })
      }
    })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit({ email, password, username }) {
    setError(null)
    setInfo(null)
    if (isRegister) {
      const { data, error } = await signUp(email, password, username)
      if (error) {
        setError(error.message)
      } else if (data.user && data.user.confirmed_at === null) {
        setInfo('Проверьте почту для подтверждения аккаунта')
      } else {
        navigate('/')
      }
    } else {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
      } else {
        navigate('/')
      }
    }
  }

  useEffect(() => {
    let isMounted = true
    getSession().then(({ data: { session } }) => {
      if (session && isMounted) {
        navigate('/')
      }
    })
    const {
      data: { subscription },
    } = onAuthStateChange((_event, session) => {
      if (session) {
        navigate('/')
      }
    })
    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [navigate])

  return (
    <div className="flex w-full min-h-screen items-center justify-center bg-base-100">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-6 rounded shadow w-full max-w-sm space-y-4"
      >
        <h2 className="text-lg font-bold text-center">
          {isRegister ? 'Регистрация' : 'Вход'}
        </h2>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {info && <div className="text-blue-500 text-sm">{info}</div>}

        <div>
          <input
            type="email"
            className="input input-bordered w-full"
            placeholder="Email"
            {...register('email')}
          />
          {errors.email && (
            <div className="text-red-500 text-sm">{errors.email.message}</div>
          )}
        </div>

        {isRegister && (
          <div>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Имя пользователя"
              {...register('username')}
            />
            {errors.username && (
              <div className="text-red-500 text-sm">
                {errors.username.message}
              </div>
            )}
          </div>
        )}

        <div>
          <input
            type="password"
            className="input input-bordered w-full"
            placeholder="Пароль"
            {...register('password')}
          />
          {errors.password && (
            <div className="text-red-500 text-sm">
              {errors.password.message}
            </div>
          )}
        </div>

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
