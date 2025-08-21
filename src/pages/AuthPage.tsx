// @ts-nocheck
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'
import { useNavigate } from 'react-router-dom'

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [userError, setUserError] = useState(null)
  const [info, setInfo] = useState(null)
  const navigate = useNavigate()
  const {
    getSession,
    onAuthStateChange,
    signUp,
    signIn,
    error: authError,
  } = useSupabaseAuth()

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

  function getNetworkErrorMessage(error) {
    if (
      error instanceof TypeError ||
      (error.message && error.message.toLowerCase().includes('failed to fetch'))
    ) {
      console.error(error)
      return 'Не удалось подключиться к серверу. Попробуйте позже.'
    }
    return error.message
  }

  async function onSubmit({ email, password, username }) {
    setUserError(null)
    setInfo(null)
    if (isRegister) {
      const { data, error } = await signUp(email, password, username)
      if (error) {
        setUserError(getNetworkErrorMessage(error))
      } else if (data.user && data.user.confirmed_at === null) {
        setInfo('Проверьте почту для подтверждения аккаунта')
      } else if (!data.session) {
        setInfo(
          'Нет активной сессии. Подтвердите аккаунт или проверьте конфигурацию.',
        )
      } else {
        navigate('/')
      }
    } else {
      const { data, error } = await signIn(email, password)
      if (error) {
        setUserError(getNetworkErrorMessage(error))
      } else if (!data.session) {
        setInfo(
          'Нет активной сессии. Подтвердите аккаунт или проверьте конфигурацию.',
        )
      } else {
        navigate('/')
      }
    }
  }

  useEffect(() => {
    let isMounted = true
    let subscription

    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await getSession()
        if (session && isMounted) {
          navigate('/')
        }
        ;({
          data: { subscription },
        } = onAuthStateChange((_event, session) => {
          if (session) {
            navigate('/')
          }
        }))
      } catch (error) {
        console.error(error)
        setUserError('Не удалось получить сессию. Попробуйте позже.')
        return
      }
    }

    checkSession()

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [navigate])

  return (
    <div>
      <div className="flex items-center justify-center h-screen bg-base-200 transition-colors">
        <div className="flex w-full min-h-screen items-center justify-center bg-base-100">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-base-100 p-6 rounded shadow w-full max-w-sm space-y-4 transition-colors"
          >
            <h2 className="text-lg font-bold text-center">
              {isRegister ? 'Регистрация' : 'Вход'}
            </h2>
            {userError && (
              <div className="text-red-500 text-sm">{userError}</div>
            )}
            {authError && (
              <div className="text-gray-500 text-xs">{authError}</div>
            )}
            {info && <div className="text-blue-500 text-sm">{info}</div>}

            <div>
              <input
                type="email"
                className="input input-bordered w-full"
                placeholder="Email"
                {...register('email')}
              />
              {errors.email && (
                <div className="text-red-500 text-sm">
                  {errors.email.message}
                </div>
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
              {isRegister
                ? 'Уже есть аккаунт? Войти'
                : 'Нет аккаунта? Регистрация'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
