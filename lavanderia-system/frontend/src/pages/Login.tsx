import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/utils/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Droplets, Mail, Lock, ArrowRight } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Bem-vindo de volta!');
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Painel visual */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-aqua-700 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-aqua-400/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <Droplets className="h-6 w-6" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">Lavanderia System</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight">
            Gestão completa para a sua lavanderia
          </h2>
          <p className="mt-4 text-base text-white/80">
            Controle clientes, serviços e pedidos em um só lugar. Do tingimento à lavagem de
            ursinhos de pelúcia, tudo organizado de forma simples e elegante.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {['Lavagem', 'Tingimento', 'Passadoria', 'Pelúcias & Especiais'].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold backdrop-blur"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-white/60">
          © {new Date().getFullYear()} Lavanderia System · Todos os direitos reservados
        </p>
      </div>

      {/* Formulário */}
      <div className="flex w-full flex-col items-center justify-center bg-slate-50 px-5 py-10 lg:w-1/2">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-aqua-500 text-white shadow-lg shadow-brand-500/30">
              <Droplets className="h-6 w-6" />
            </div>
            <span className="text-xl font-extrabold text-slate-900">Lavanderia System</span>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900">Acessar o sistema</h1>
          <p className="mt-1 text-sm text-slate-500">
            Entre com suas credenciais para continuar.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Input
              label="E-mail"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="voce@lavanderia.com"
              leftIcon={<Mail className="h-4 w-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <Input
              label="Senha"
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Entrar
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Primeiro acesso
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              As credenciais iniciais do administrador são definidas no arquivo{' '}
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px] text-slate-700">
                backend/.env
              </code>
              . Após entrar, altere a senha em <strong>Usuários</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}