import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Header } from '../../components/base/Header';
import { Footer } from '../../components/base/Footer';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirecionamento inteligente baseado no tipo de utilizador
  useEffect(() => {
    if (user) {
      const redirect = searchParams.get('redirect');
      if (redirect) {
        navigate(redirect);
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, insira um email válido.');
      return;
    }

    if (password.length < 6) {
      setError('A password deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      
      setSuccessMessage('✅ Login bem-sucedido! A redirecionar...');
      
      setTimeout(() => {
        const redirect = searchParams.get('redirect');
        if (redirect) {
          navigate(redirect);
        }
      }, 500);
    } catch (err: any) {
      console.error('Erro no login:', err);
      
      let errorMessage = 'Email ou password incorretos.';
      
      const errorMsg = err.message?.toLowerCase() || '';
      
      if (errorMsg.includes('invalid login credentials') || errorMsg.includes('email ou password incorretos')) {
        errorMessage = '❌ Email ou password incorretos. Verifique os seus dados.';
      } else if (errorMsg.includes('não existe')) {
        errorMessage = '⚠️ Esta conta não existe. Por favor, crie uma conta primeiro.';
      } else if (errorMsg.includes('rate limit') || errorMsg.includes('too many')) {
        errorMessage = '⏱️ Muitas tentativas. Aguarde alguns minutos e tente novamente.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Wallpaper Animado de Fundo - Gradiente Vibrante */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 animate-gradient-shift"></div>
      
      {/* Padrão de Ondas Animadas */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px',
        }}></div>
      </div>
      
      {/* Círculos Animados de Fundo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-20 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
      </div>

      {/* Partículas Flutuantes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-20 animate-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 15}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10">
        <Header />
      </div>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Card Principal com Glassmorphism */}
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 border-2 border-white/50 transform transition-all duration-500 hover:shadow-emerald-500/30 hover:scale-[1.02] animate-glow">
            {/* Cabeçalho com Ícone Animado */}
            <div className="text-center mb-8">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-full animate-pulse-soft shadow-2xl shadow-emerald-500/50"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <i className="ri-shield-check-line text-5xl text-white animate-bounce-slow"></i>
                </div>
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-3 animate-gradient-text">
                Acesso Seguro
              </h1>
              <p className="text-gray-700 font-semibold text-lg">Entre na sua conta Marisol</p>
              
              {/* Badges de Segurança */}
              <div className="flex items-center justify-center gap-3 mt-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 rounded-full">
                  <i className="ri-lock-line text-emerald-600 text-sm"></i>
                  <span className="text-xs font-bold text-emerald-700">Encriptado</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-100 rounded-full">
                  <i className="ri-shield-check-line text-teal-600 text-sm"></i>
                  <span className="text-xs font-bold text-teal-700">Seguro</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-100 rounded-full">
                  <i className="ri-verified-badge-line text-cyan-600 text-sm"></i>
                  <span className="text-xs font-bold text-cyan-700">Verificado</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl shadow-lg animate-shake">
                <div className="flex items-start gap-3">
                  <i className="ri-error-warning-line text-2xl text-red-600 mt-0.5 animate-pulse"></i>
                  <div className="flex-1">
                    <p className="text-sm text-red-700 mb-3 font-medium leading-relaxed">{error}</p>
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 font-semibold hover:underline cursor-pointer transition-all"
                    >
                      <i className="ri-user-add-line"></i>
                      Criar nova conta
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-xl shadow-lg animate-bounce-in">
                <div className="flex items-start gap-3">
                  <i className="ri-checkbox-circle-line text-2xl text-green-600 mt-0.5 animate-spin-slow"></i>
                  <p className="text-sm text-green-700 font-medium">{successMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="transform transition-all duration-300 hover:scale-[1.02]">
                <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <i className="ri-mail-line text-teal-600"></i>
                  Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="ri-mail-line text-xl text-teal-600 group-focus-within:text-emerald-600 transition-colors"></i>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-teal-200 rounded-xl focus:ring-4 focus:ring-teal-300/50 focus:border-teal-500 transition-all text-gray-900 font-medium placeholder:text-gray-500 shadow-sm hover:shadow-md hover:border-teal-400"
                    placeholder="seu@email.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="transform transition-all duration-300 hover:scale-[1.02]">
                <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <i className="ri-lock-line text-teal-600"></i>
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="ri-lock-line text-xl text-teal-600 group-focus-within:text-emerald-600 transition-colors"></i>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-14 py-4 bg-white border-2 border-teal-200 rounded-xl focus:ring-4 focus:ring-teal-300/50 focus:border-teal-500 transition-all text-gray-900 font-medium placeholder:text-gray-500 shadow-sm hover:shadow-md hover:border-teal-400"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer hover:scale-110 transition-transform"
                    tabIndex={-1}
                  >
                    <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-xl text-teal-600 hover:text-emerald-600 transition-colors`}></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-8 py-5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white rounded-xl hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 transition-all duration-300 font-bold text-lg shadow-2xl shadow-teal-500/50 whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-[1.05] hover:shadow-teal-600/60 active:scale-95 animate-gradient-x relative overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                {loading ? (
                  <span className="flex items-center justify-center gap-3 relative z-10">
                    <i className="ri-loader-4-line text-2xl animate-spin"></i>
                    A entrar...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2 relative z-10">
                    <i className="ri-login-box-line text-xl"></i>
                    Entrar com Segurança
                  </span>
                )}
              </button>
            </form>

            {/* Símbolos de Confiança */}
            <div className="mt-8 pt-6 border-t-2 border-gray-200">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <i className="ri-shield-check-fill text-2xl text-emerald-600"></i>
                  <span className="text-xs font-bold">SSL Seguro</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <i className="ri-lock-password-fill text-2xl text-teal-600"></i>
                  <span className="text-xs font-bold">Encriptação 256-bit</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <i className="ri-verified-badge-fill text-2xl text-cyan-600"></i>
                  <span className="text-xs font-bold">Verificado</span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-700 font-medium">
                Ainda não tem conta?{' '}
                <Link
                  to="/register"
                  className="text-teal-600 hover:text-emerald-600 font-bold hover:underline cursor-pointer transition-all transform hover:scale-110 inline-block"
                >
                  Criar conta agora
                </Link>
              </p>
            </div>
          </div>

          {/* Informação de Segurança */}
          <div className="mt-8 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg animate-pulse-soft">
                <i className="ri-information-line text-2xl text-white"></i>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 mb-2 text-lg">🔒 Segurança Garantida</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <i className="ri-checkbox-circle-fill text-emerald-600 mt-0.5"></i>
                    <span>Dados protegidos com encriptação SSL</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="ri-checkbox-circle-fill text-teal-600 mt-0.5"></i>
                    <span>Acesso imediato após login</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="ri-checkbox-circle-fill text-cyan-600 mt-0.5"></i>
                    <span>Sem verificação de email necessária</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-white hover:text-emerald-200 transition-all cursor-pointer hover:underline font-bold text-lg transform hover:scale-110 hover:gap-3"
            >
              <i className="ri-arrow-left-line text-xl"></i>
              Voltar à página inicial
            </Link>
          </div>
        </div>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
