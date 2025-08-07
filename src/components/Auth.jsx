import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../supabaseClient'

export default function Auth() {
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState(null)

  const authSchema = z
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
    handleSubmit: formSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(authSchema) })

  async function handleSubmit({ email, password, username }) {
    setError(null)
    let res
    if (isRegister) {
      res = await supabase.auth.signUp({ email, password, options: { data: { username } } })
    } else {
      res = await supabase.auth.signInWithPassword({ email, password })
    }
    if (res.error) setError(res.error.message)
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <form onSubmit={formSubmit(handleSubmit)} className="bg-white p-6 rounded shadow w-full max-w-sm space-y-4">
        <h2 className="text-lg font-bold text-center">
          {isRegister ? 'Регистрация' : 'Вход'}
        </h2>
        {error && <div className="text-red-500 text-sm">{error}</div>}
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
              <div className="text-red-500 text-sm">{errors.username.message}</div>
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
            <div className="text-red-500 text-sm">{errors.password.message}</div>
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
