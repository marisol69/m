import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Header } from '../../components/base/Header';
import { Footer } from '../../components/base/Footer';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Redirecionamento inteligente baseado no tipo de utilizador
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate]);

  // Calcular força da password
  useEffect(() => {
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    setPasswordStrength(Math.min(strength, 100));
  }, [password]);

  const validateEmail = (email: string): { valid: boolean; message?: string; cleanedEmail?: string } => {
    let cleanEmail = email
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '');
    
    if (!cleanEmail) {
      return { valid: false, message: 'O email é obrigatório.' };
    }

    const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(cleanEmail)) {
      return { valid: false, message: 'Por favor, insira um email válido (ex: nome@gmail.com).' };
    }

    if (cleanEmail.length > 255) {
      return { valid: false, message: 'O email é demasiado longo.' };
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { valid: false, message: 'O email deve conter @ e um domínio válido (ex: nome@gmail.com).' };
    }

    const parts = cleanEmail.split('@');
    if (parts.length !== 2) {
      return { valid: false, message: 'Formato de email inválido.' };
    }

    const [localPart, domain] = parts;

    if (localPart.length === 0 || localPart.length > 64) {
      return { valid: false, message: 'O nome do email é inválido.' };
    }

    if (/[^a-zA-Z0-9._+-]/.test(localPart)) {
      return { valid: false, message: 'O email contém caracteres inválidos. Use apenas letras, números, . _ + -' };
    }

    if (/^[._+-]|[._+-]$/.test(localPart)) {
      return { valid: false, message: 'O email não pode começar ou terminar com caracteres especiais.' };
    }

    if (cleanEmail.includes('..')) {
      return { valid: false, message: 'O email não pode conter pontos consecutivos.' };
    }

    if (domain.length === 0 || domain.length > 255) {
      return { valid: false, message: 'O domínio do email é inválido.' };
    }

    if (/[^a-zA-Z0-9.-]/.test(domain)) {
      return { valid: false, message: 'O domínio contém caracteres inválidos.' };
    }

    const domainParts = domain.split('.');
    if (domainParts.length < 2) {
      return { valid: false, message: 'O domínio deve ter uma extensão válida (ex: .com, .pt).' };
    }

    if (domainParts.some(part => part.length === 0)) {
      return { valid: false, message: 'O domínio é inválido.' };
    }

    const extension = domainParts[domainParts.length - 1];
    if (extension.length < 2 || !/^[a-zA-Z]+$/.test(extension)) {
      return { valid: false, message: 'A extensão do domínio é inválida.' };
    }

    if (/^[.-]|[.-]$/.test(domain)) {
      return { valid: false, message: 'O domínio não pode começar ou terminar com . ou -' };
    }

    return { valid: true, cleanedEmail: cleanEmail };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (fullName.trim().length < 2) {
      setError('O nome deve ter pelo menos 2 caracteres.');
      return;
    }

    let cleanEmail = email
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const emailValidation = validateEmail(cleanEmail);
    if (!emailValidation.valid) {
      setError(emailValidation.message || 'Email inválido.');
      return;
    }

    if (emailValidation.cleanedEmail) {
      cleanEmail = emailValidation.cleanedEmail;
    }

    if (password.length < 6) {
      setError('A password deve ter pelo menos 6 caracteres.');
      return;
    }

    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasLowerCase || !hasUpperCase || !hasNumber) {
      setError('A password deve conter letras maiúsculas, minúsculas e números.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As passwords não coincidem.');
      return;
    }

    setLoading(true);

    try {
      await register(cleanEmail, password, fullName.trim());
      
      setSuccessMessage('✅ Conta criada com sucesso! A entrar automaticamente...');
      
      // Não precisa de timeout - o useEffect vai redirecionar automaticamente
    } catch (err: any) {
      console.error('❌ Erro no registo:', err);
      
      let errorMessage = 'Erro ao criar conta. Tente novamente.';
      
      if (err.message) {
        const msg = err.message.toLowerCase();
        
        if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('duplicate') || msg.includes('user already registered')) {
          errorMessage = '❌ Este email já está registado. Tente fazer login ou use outro email.';
        } else if (msg.includes('invalid email') || msg.includes('invalid') && msg.includes('email')) {
          errorMessage = '❌ Email inválido. Use um formato válido como: nome@gmail.com (sem espaços ou caracteres especiais).';
        } else if (msg.includes('weak password') || msg.includes('password')) {
          errorMessage = '❌ Password demasiado fraca. Use pelo menos 6 caracteres com letras maiúsculas, minúsculas e números.';
        } else if (msg.includes('rate limit')) {
          errorMessage = '❌ Demasiadas tentativas. Aguarde alguns minutos e tente novamente.';
        } else if (msg.includes('network') || msg.includes('fetch')) {
          errorMessage = '❌ Erro de conexão. Verifique a sua internet e tente novamente.';
        } else {
          errorMessage = `❌ ${err.message}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return 'bg-red-500';
    if (passwordStrength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return 'Fraca';
    if (passwordStrength < 70) return 'Média';
    return 'Forte';
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Wallpaper Animado de Fundo - Gradiente Vibrante */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-600 animate-gradient-shift"></div>
      
      {/* Padrão Geométrico Animado */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }}></div>
      </div>
      
      {/* Círculos Animados de Fundo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-20 w-96 h-96 bg-fuchsia-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
      </div>

      {/* Partículas Flutuantes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-30 animate-particle"
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
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 border-2 border-white/50 transform transition-all duration-500 hover:shadow-purple-500/30 hover:scale-[1.02] animate-glow">
            {/* Cabeçalho com Ícone Animado */}
            <div className="text-center mb-8">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-full animate-pulse-soft shadow-2xl shadow-purple-500/50"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <i className="ri-user-add-line text-5xl text-white animate-bounce-slow"></i>
                </div>
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-3 animate-gradient-text">
                Criar Conta Segura
              </h1>
              <p className="text-gray-700 font-semibold text-lg">Junte-se à Marisol hoje ✨</p>
              
              {/* Badges de Segurança */}
              <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 rounded-full">
                  <i className="ri-shield-check-line text-violet-600 text-sm"></i>
                  <span className="text-xs font-bold text-violet-700">Proteção Total</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 rounded-full">
                  <i className="ri-lock-password-line text-purple-600 text-sm"></i>
                  <span className="text-xs font-bold text-purple-700">Encriptado</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-fuchsia-100 rounded-full">
                  <i className="ri-flashlight-line text-fuchsia-600 text-sm"></i>
                  <span className="text-xs font-bold text-fuchsia-700">Acesso Imediato</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl shadow-lg animate-shake">
                <div className="flex items-start gap-3">
                  <i className="ri-error-warning-line text-2xl text-red-600 mt-0.5 animate-pulse"></i>
                  <p className="text-sm text-red-700 font-medium">{error}</p>
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

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="transform transition-all duration-300 hover:scale-[1.02]">
                <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <i className="ri-user-line text-purple-600"></i>
                  Nome Completo
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="ri-user-line text-xl text-purple-600 group-focus-within:text-violet-600 transition-colors"></i>
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-purple-200 rounded-xl focus:ring-4 focus:ring-purple-300/50 focus:border-purple-500 transition-all text-gray-900 font-medium placeholder:text-gray-500 shadow-sm hover:shadow-md hover:border-purple-400"
                    placeholder="O seu nome completo"
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="transform transition-all duration-300 hover:scale-[1.02]">
                <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <i className="ri-mail-line text-purple-600"></i>
                  Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="ri-mail-line text-xl text-purple-600 group-focus-within:text-violet-600 transition-colors"></i>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-purple-200 rounded-xl focus:ring-4 focus:ring-purple-300/50 focus:border-purple-500 transition-all text-gray-900 font-medium placeholder:text-gray-500 shadow-sm hover:shadow-md hover:border-purple-400"
                    placeholder="nome@gmail.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-600 flex items-center gap-1">
                  <i className="ri-information-line text-purple-600"></i>
                  Use um email válido e permanente
                </p>
              </div>

              <div className="transform transition-all duration-300 hover:scale-[1.02]">
                <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <i className="ri-lock-line text-purple-600"></i>
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="ri-lock-line text-xl text-purple-600 group-focus-within:text-violet-600 transition-colors"></i>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-white border-2 border-purple-200 rounded-xl focus:ring-4 focus:ring-purple-300/50 focus:border-purple-500 transition-all text-gray-900 font-medium placeholder:text-gray-500 shadow-sm hover:shadow-md hover:border-purple-400"
                    placeholder="Mínimo 6 caracteres"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer hover:scale-110 transition-transform"
                  >
                    <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-xl text-purple-600 hover:text-violet-600 transition-colors`}></i>
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-700">Força da Password:</span>
                      <span className={`text-xs font-bold ${passwordStrength < 40 ? 'text-red-600' : passwordStrength < 70 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                        style={{ width: `${passwordStrength}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                <p className="mt-1.5 text-xs text-gray-600 flex items-center gap-1">
                  <i className="ri-shield-check-line text-purple-600"></i>
                  Use letras maiúsculas, minúsculas e números
                </p>
              </div>

              <div className="transform transition-all duration-300 hover:scale-[1.02]">
                <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <i className="ri-lock-line text-purple-600"></i>
                  Confirmar Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="ri-lock-line text-xl text-purple-600 group-focus-within:text-violet-600 transition-colors"></i>
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-white border-2 border-purple-200 rounded-xl focus:ring-4 focus:ring-purple-300/50 focus:border-purple-500 transition-all text-gray-900 font-medium placeholder:text-gray-500 shadow-sm hover:shadow-md hover:border-purple-400"
                    placeholder="Repita a password"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer hover:scale-110 transition-transform"
                  >
                    <i className={`${showConfirmPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-xl text-purple-600 hover:text-violet-600 transition-colors`}></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-8 py-5 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white rounded-xl hover:from-violet-600 hover:via-purple-600 hover:to-fuchsia-600 transition-all duration-300 font-bold text-lg shadow-2xl shadow-purple-500/50 whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-[1.05] hover:shadow-purple-600/60 active:scale-95 animate-gradient-x relative overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                {loading ? (
                  <span className="flex items-center justify-center gap-3 relative z-10">
                    <i className="ri-loader-4-line text-2xl animate-spin"></i>
                    A criar conta...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2 relative z-10">
                    <i className="ri-user-add-line text-xl"></i>
                    Criar Conta Agora
                  </span>
                )}
              </button>
            </form>

            {/* Símbolos de Confiança */}
            <div className="mt-8 pt-6 border-t-2 border-gray-200">
              <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-2 text-gray-700">
                  <i className="ri-shield-check-fill text-2xl text-violet-600"></i>
                  <span className="text-xs font-bold">SSL Seguro</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <i className="ri-lock-password-fill text-2xl text-purple-600"></i>
                  <span className="text-xs font-bold">Encriptação 256-bit</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <i className="ri-flashlight-fill text-2xl text-fuchsia-600"></i>
                  <span className="text-xs font-bold">Acesso Instantâneo</span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-700 font-medium">
                Já tem conta?{' '}
                <Link
                  to="/login"
                  className="text-purple-600 hover:text-violet-600 font-bold hover:underline cursor-pointer transition-all transform hover:scale-110 inline-block"
                >
                  Entrar agora
                </Link>
              </p>
            </div>
          </div>

          {/* Informação de Segurança */}
          <div className="mt-8 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg animate-pulse-soft">
                <i className="ri-shield-star-line text-2xl text-white"></i>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 mb-2 text-lg">🚀 Benefícios da Conta</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <i className="ri-checkbox-circle-fill text-violet-600 mt-0.5"></i>
                    <span><strong>Acesso imediato</strong> - Entre automaticamente após criar conta</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="ri-checkbox-circle-fill text-purple-600 mt-0.5"></i>
                    <span><strong>Sem verificação de email</strong> - Comece a usar agora mesmo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="ri-checkbox-circle-fill text-fuchsia-600 mt-0.5"></i>
                    <span><strong>100% seguro</strong> - Dados protegidos com encriptação SSL</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-white hover:text-violet-200 transition-all cursor-pointer hover:underline font-bold text-lg transform hover:scale-110 hover:gap-3"
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
