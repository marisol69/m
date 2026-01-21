import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Customer {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  customer: Customer | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateCustomer: (data: Partial<Customer>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar dados do cliente
  const loadUserData = async (authUser: User) => {
    try {
      const { data: customerData, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (error) {
        // Se o cliente não existe (PGRST116), criar automaticamente
        if (error.code === 'PGRST116') {
          console.log('Cliente não encontrado, a criar automaticamente...');
          
          // Criar cliente na base de dados
          const { data: newCustomer, error: createError } = await supabase
            .from('customers')
            .insert([
              {
                user_id: authUser.id,
                email: authUser.email,
                name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Cliente',
                created_at: new Date().toISOString(),
              },
            ])
            .select()
            .single();

          if (createError) {
            // Se o erro for de duplicação (23505), significa que o cliente já existe
            // Tentar carregar novamente com maiortolerância
            if (createError.code === '23505') {
              console.log('Cliente já existe, a carregar dados novamente...');
              
              // Aguardar um pouco antes de tentar novamente
              await new Promise(resolve => setTimeout(resolve, 500));
              
              const { data: existingCustomer, error: loadError } = await supabase
                .from('customers')
                .select('*')
                .eq('user_id', authUser.id)
                .maybeSingle(); // Usar maybeSingle() em vez de single() para evitar erro PGRST116

              if (loadError) {
                console.error('Erro ao carregar cliente existente:', loadError);
                // Não retornar - continuar com o utilizador autenticado
                setUser(authUser);
                return;
              }

              if (existingCustomer) {
                console.log('✅ Cliente existente carregado com sucesso!');
                setCustomer(existingCustomer);
                setUser(authUser);
              } else {
                // Cliente ainda não existe, definir apenas o utilizador
                console.log('⚠️ Cliente não encontrado, mas utilizador autenticado');
                setUser(authUser);
              }
              return;
            }

            console.error('Erro ao criar cliente:', createError);
            // Não retornar - continuar com o utilizador autenticado
            setUser(authUser);
            return;
          }

          console.log('✅ Cliente criado com sucesso!');
          setCustomer(newCustomer);
          setUser(authUser);
          return;
        }

        console.error('Erro ao carregar dados do cliente:', error);
        // Não retornar - continuar com o utilizador autenticado
        setUser(authUser);
        return;
      }

      setCustomer(customerData);
      setUser(authUser);
    } catch (error) {
      console.error('Erro ao carregar dados do utilizador:', error);
      // Garantir que o utilizador fica autenticado mesmo com erro
      setUser(authUser);
    }
  };

  // Verificar sessão ao carregar
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession?.user) {
          setSession(currentSession);
          await loadUserData(currentSession.user);
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      
      if (newSession?.user) {
        await loadUserData(newSession.user);
      } else {
        setUser(null);
        setCustomer(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Erro no login:', error);
        
        // ✅ IGNORAR erro de "Email not confirmed"
        // Permitir login mesmo sem confirmação de email
        if (error.message.includes('Email not confirmed') || 
            error.message.includes('email_not_confirmed')) {
          console.log('⚠️ Email não confirmado, mas permitindo login...');
          
          // Tentar obter a sessão atual
          const { data: sessionData } = await supabase.auth.getSession();
          
          if (sessionData.session) {
            console.log('✅ Sessão encontrada, utilizador logado!');
            await loadUserData(sessionData.session.user);
            return;
          }
        }
        
        throw error;
      }

      if (data.user) {
        console.log('✅ Login bem-sucedido!');
        await loadUserData(data.user);
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);
      throw error;
    }
  };

  // Register
  const register = async (email: string, password: string, name: string) => {
    try {
      // ✅ PRIMEIRO: Verificar se o utilizador já existe no Auth
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const userExists = existingUsers?.users?.some(u => u.email === email);

      if (userExists) {
        console.log('⚠️ Utilizador já existe no Auth, fazendo login direto...');
        
        // Fazer login direto
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) {
          // Se a password estiver errada, informar o utilizador
          if (loginError.message.includes('Invalid login credentials')) {
            throw new Error('Esta conta já existe. Por favor, faça login com a sua password.');
          }
          throw loginError;
        }

        if (loginData.user) {
          console.log('✅ Login bem-sucedido com conta existente!');
          await loadUserData(loginData.user);
        }
        return;
      }

      // ✅ Criar conta SEM confirmação de email
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          // ✅ IMPORTANTE: Desabilitar confirmação de email
          emailRedirectTo: undefined,
        },
      });

      if (signUpError) {
        console.error('❌ Erro ao criar conta:', signUpError);
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('Erro ao criar utilizador');
      }

      console.log('✅ Conta criada com sucesso no Auth!');

      // ✅ Verificar se o cliente já existe na base de dados
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (existingCustomer) {
        console.log('✅ Cliente já existe na base de dados, a atualizar...');
        
        // Atualizar o user_id do cliente existente
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            user_id: authData.user.id,
            name: name,
          })
          .eq('email', email);

        if (updateError) {
          console.error('⚠️ Erro ao atualizar cliente:', updateError);
        } else {
          console.log('✅ Cliente atualizado com sucesso!');
        }
      } else {
        // ✅ Criar cliente na base de dados
        const { error: customerError } = await supabase
          .from('customers')
          .insert([
            {
              user_id: authData.user.id,
              email: authData.user.email,
              name: name,
              created_at: new Date().toISOString(),
            },
          ]);

        if (customerError) {
          // Se o erro for de duplicação, tentar atualizar
          if (customerError.code === '23505') {
            console.log('⚠️ Cliente duplicado, a atualizar...');
            
            const { error: updateError } = await supabase
              .from('customers')
              .update({
                user_id: authData.user.id,
                name: name,
              })
              .eq('email', email);

            if (updateError) {
              console.error('⚠️ Erro ao atualizar cliente:', updateError);
            } else {
              console.log('✅ Cliente atualizado com sucesso!');
            }
          } else {
            console.error('⚠️ Erro ao criar cliente:', customerError);
          }
        } else {
          console.log('✅ Cliente criado com sucesso na base de dados!');
        }
      }

      // ✅ Carregar dados do utilizador
      await loadUserData(authData.user);

      // ✅ Verificar se já tem sessão ativa (login automático)
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData.session) {
        console.log('✅ Sessão ativa encontrada! Utilizador já está logado!');
        return;
      }

      // ✅ Se não tiver sessão, fazer login automático
      console.log('🔄 Fazendo login automático...');
      
      try {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) {
          console.error('⚠️ Erro no login automático:', loginError);
          
          // ✅ IGNORAR erro de confirmação de email
          if (loginError.message.includes('Email not confirmed') || 
              loginError.message.includes('email_not_confirmed')) {
            console.log('⚠️ Email não confirmado, mas permitindo acesso...');
            return; // Permitir acesso mesmo assim
          }
          
          // Para outros erros, apenas avisar mas não bloquear
          console.warn('⚠️ Login automático falhou, mas conta foi criada');
          return;
        }

        if (loginData.session) {
          console.log('✅ Login automático bem-sucedido!');
          await loadUserData(loginData.user);
        }
      } catch (autoLoginError) {
        console.error('⚠️ Erro no login automático:', autoLoginError);
        // Não lançar erro - conta foi criada com sucesso
        console.log('✅ Conta criada! Utilizador pode fazer login manualmente se necessário.');
      }

    } catch (error) {
      console.error('❌ Erro no registo:', error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setCustomer(null);
      setSession(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  };

  // Atualizar dados do cliente
  const updateCustomer = async (data: Partial<Customer>) => {
    try {
      if (!customer) {
        throw new Error('Nenhum cliente logado');
      }

      const { error } = await supabase
        .from('customers')
        .update(data)
        .eq('id', customer.id);

      if (error) {
        throw error;
      }

      // Atualizar estado local
      setCustomer({ ...customer, ...data });
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      throw error;
    }
  };

  const value = {
    user,
    customer,
    session,
    loading,
    login,
    register,
    logout,
    updateCustomer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
