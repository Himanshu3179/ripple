import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineSparkles } from 'react-icons/hi2';
import useAuth from '../../hooks/useAuth';

interface RegisterFormState {
  displayName: string;
  username: string;
  email: string;
  password: string;
  bio: string;
}

const RegisterPage = () => {
  const { register: registerUser } = useAuth();
  const [form, setForm] = useState<RegisterFormState>({
    displayName: '',
    username: '',
    email: '',
    password: '',
    bio: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await registerUser({
        ...form,
        username: form.username.trim().toLowerCase(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-white shadow-card">
          <HiOutlineSparkles className="text-xl" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">Create your profile</h1>
        <p className="mt-2 text-sm text-slate-500">
          Pick a name that stands out and start joining the conversations.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <div className="grid gap-2">
          <label htmlFor="displayName" className="text-sm font-semibold text-slate-600">
            Display name
          </label>
          <input
            id="displayName"
            name="displayName"
            required
            value={form.displayName}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-400 focus:bg-white focus:shadow-input"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="username" className="text-sm font-semibold text-slate-600">
            Username
          </label>
          <input
            id="username"
            name="username"
            required
            minLength={3}
            value={form.username}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-400 focus:bg-white focus:shadow-input"
          />
          <p className="text-xs text-slate-400">Only lowercase letters, numbers, and underscores.</p>
        </div>

        <div className="grid gap-2">
          <label htmlFor="email" className="text-sm font-semibold text-slate-600">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-400 focus:bg-white focus:shadow-input"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="password" className="text-sm font-semibold text-slate-600">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-400 focus:bg-white focus:shadow-input"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="bio" className="text-sm font-semibold text-slate-600">
            Bio (optional)
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            value={form.bio}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-400 focus:bg-white focus:shadow-input"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Creating profile…' : 'Create account'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500">
        Already a member?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-500">
          Log in
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
