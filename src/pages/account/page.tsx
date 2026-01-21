import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '../../components/base/Header';
import { Footer } from '../../components/base/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_PUBLIC_SUPABASE_URL,
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
);

export default function AccountPage() {
  const { user, loading: authLoading, isAdmin, refreshUser } = useAuth();
  const { items: cartItems, removeFromCart } = useCart();
  const { favorites, removeFromFavorites } = useFavorites();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses' | 'notifications' | 'security'>('profile');
  const [ordersSubTab, setOrdersSubTab] = useState<'orders' | 'favorites' | 'cart'>('orders');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Dados do perfil
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    date_of_birth: '',
  });

  // Segurança
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Pedidos
  const [orders, setOrders] = useState<any[]>([]);

  // Endereços
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Casa',
    address_type: 'shipping',
    street: '',
    city: '',
    postal_code: '',
    country: 'LU',
    phone: '',
    is_default: false,
  });

  // Estados para modais
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/login?redirect=/account');
      return;
    }

    loadUserData();
  }, [user, authLoading, navigate]);

  const loadUserData = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Carregar dados do perfil do Supabase
      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (customerData) {
        setProfileData({
          full_name: customerData.full_name || customerData.name || '',
          phone: customerData.phone || '',
          date_of_birth: customerData.date_of_birth || '',
        });
      }

      // Carregar APENAS pedidos reais do cliente atual
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      // Usar APENAS os pedidos reais (sem pedidos demo)
      setOrders(ordersData || []);

      // Carregar endereços
      const { data: addressesData } = await supabase
        .from('addresses')
        .select('*')
        .eq('customer_id', user.id)
        .order('is_default', { ascending: false });

      if (addressesData) {
        setAddresses(addressesData);
      }

      setNotifications([]);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('customers')
        .update({
          full_name: profileData.full_name,
          name: profileData.full_name,
          phone: profileData.phone,
          date_of_birth: profileData.date_of_birth || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshUser();
      
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-24 right-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-2 animate-bounce';
      successMessage.innerHTML = '<i class="ri-check-line text-xl"></i><span>Perfil atualizado com sucesso!</span>';
      document.body.appendChild(successMessage);
      setTimeout(() => successMessage.remove(), 3000);
      
      await loadUserData();
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!user || !newEmail) return;

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;

      alert('Email atualizado com sucesso! Verifique o seu novo email para confirmar a alteração.');
      setNewEmail('');
      await refreshUser();
    } catch (error: any) {
      console.error('Erro ao alterar email:', error);
      alert(error.message || 'Erro ao alterar email. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user || !newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      alert('As passwords não coincidem!');
      return;
    }

    if (newPassword.length < 6) {
      alert('A password deve ter pelo menos 6 caracteres!');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      alert('Password alterada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Erro ao alterar password:', error);
      alert(error.message || 'Erro ao alterar password. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!user) {
      alert('Por favor, faça login primeiro');
      return;
    }

    // Validações
    if (!newAddress.street || !newAddress.city || !newAddress.postal_code || !newAddress.country) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);

    try {
      console.log('🔄 Iniciando processo de guardar endereço...');
      console.log('👤 User ID:', user.id);

      // Se for definir como padrão, remover o padrão dos outros endereços
      if (newAddress.is_default) {
        console.log('🔄 Removendo padrão dos outros endereços...');
        const { error: updateError } = await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('customer_id', user.id);

        if (updateError) {
          console.error('⚠️ Erro ao atualizar endereços padrão:', updateError);
        }
      }

      // Inserir novo endereço diretamente
      console.log('🔄 Inserindo novo endereço...');
      
      const addressData = {
        customer_id: user.id,
        address_type: newAddress.address_type || 'shipping',
        street: newAddress.street,
        city: newAddress.city,
        postal_code: newAddress.postal_code,
        country: newAddress.country,
        is_default: newAddress.is_default,
        created_at: new Date().toISOString(),
      };

      console.log('📦 Dados do endereço a inserir:', addressData);

      const { data: insertedAddress, error: insertError } = await supabase
        .from('addresses')
        .insert(addressData)
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao inserir endereço:', insertError);
        
        // Se o erro for de foreign key (cliente não existe), mostrar mensagem específica
        if (insertError.code === '23503') {
          alert('Erro: O seu perfil ainda não está completamente configurado. Por favor, faça logout e login novamente.');
        } else {
          alert('Erro ao adicionar endereço. Por favor, tente novamente.');
        }
        setSaving(false);
        return;
      }

      console.log('✅ Endereço inserido com sucesso:', insertedAddress);

      // Recarregar dados
      await loadUserData();

      // Fechar formulário e resetar
      setShowAddressForm(false);
      setNewAddress({
        label: 'Casa',
        address_type: 'shipping',
        street: '',
        city: '',
        postal_code: '',
        country: 'LU',
        phone: '',
        is_default: false,
      });

      // Mostrar mensagem de sucesso
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-24 right-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-2 animate-bounce';
      successMessage.innerHTML = '<i class="ri-check-line text-xl"></i><span>Endereço adicionado com sucesso!</span>';
      document.body.appendChild(successMessage);
      setTimeout(() => successMessage.remove(), 3000);
      
    } catch (error) {
      console.error('❌ Erro ao guardar endereço:', error);
      alert('Erro ao guardar endereço. Por favor, tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Tem certeza que deseja eliminar este endereço?')) return;

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;

      await loadUserData();
      alert('Endereço eliminado com sucesso!');
    } catch (error) {
      console.error('Erro ao eliminar endereço:', error);
      alert('Erro ao eliminar endereço. Tente novamente.');
    }
  };

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      await loadUserData();
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      await loadUserData();
    } catch (error) {
      console.error('Erro ao eliminar notificação:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeleting(true);

    try {
      // Eliminar todos os dados do utilizador
      await supabase.from('favorites').delete().eq('customer_id', user.id);
      await supabase.from('addresses').delete().eq('customer_id', user.id);
      await supabase.from('cart_items').delete().eq('customer_id', user.id);
      await supabase.from('notifications').delete().eq('customer_id', user.id);
      await supabase.from('order_items').delete().eq('order_id', supabase.from('orders').select('id').eq('customer_id', user.id));
      await supabase.from('orders').delete().eq('customer_id', user.id);
      await supabase.from('customers').delete().eq('id', user.id);

      // Eliminar conta de autenticação
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) throw error;

      // Fazer logout
      await supabase.auth.signOut();
      
      alert('Conta eliminada com sucesso. Será redirecionado para a página inicial.');
      navigate('/');
    } catch (error) {
      console.error('Erro ao eliminar conta:', error);
      alert('Erro ao eliminar conta. Por favor, contacte o suporte.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Adicionar novo endereço
  const handleAddAddress = async () => {
    if (!user) return;

    // Validação
    if (!newAddress.street || !newAddress.city || !newAddress.postal_code || !newAddress.country) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setSaving(true);

    try {
      console.log('🔄 Iniciando adição de endereço...');
      console.log('👤 User ID:', user.id);

      // Se for o primeiro endereço ou marcado como padrão, desmarcar outros
      if (newAddress.is_default || addresses.length === 0) {
        const { error: updateError } = await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('customer_id', user.id);

        if (updateError) {
          console.error('⚠️ Erro ao atualizar endereços existentes:', updateError);
        }
      }

      // Inserir novo endereço
      const addressData = {
        customer_id: user.id,
        address_type: newAddress.address_type || 'shipping',
        street: newAddress.street,
        city: newAddress.city,
        postal_code: newAddress.postal_code,
        country: newAddress.country,
        is_default: newAddress.is_default || addresses.length === 0,
        created_at: new Date().toISOString(),
      };

      console.log('📦 Dados do endereço a inserir:', addressData);

      const { data: insertedAddress, error: insertError } = await supabase
        .from('addresses')
        .insert(addressData)
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao inserir endereço:', insertError);
        
        // Se o erro for de foreign key (cliente não existe), mostrar mensagem específica
        if (insertError.code === '23503') {
          alert('Erro: O seu perfil ainda não está completamente configurado. Por favor, faça logout e login novamente.');
        } else {
          alert('Erro ao adicionar endereço. Por favor, tente novamente.');
        }
        setSaving(false);
        return;
      }

      console.log('✅ Endereço inserido com sucesso:', insertedAddress);

      // Recarregar dados
      await loadUserData();

      // Limpar formulário e fechar modal
      setNewAddress({
        label: 'Casa',
        address_type: 'shipping',
        street: '',
        city: '',
        postal_code: '',
        country: 'LU',
        phone: '',
        is_default: false,
      });
      setShowAddressModal(false);
      setSaving(false);

      // Mostrar mensagem de sucesso
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-24 right-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-2 animate-bounce';
      successMessage.innerHTML = '<i class="ri-check-line text-xl"></i><span>Endereço adicionado com sucesso!</span>';
      document.body.appendChild(successMessage);
      setTimeout(() => successMessage.remove(), 3000);
    } catch (error) {
      console.error('❌ Erro ao adicionar endereço:', error);
      alert('Erro ao adicionar endereço. Por favor, tente novamente.');
      setSaving(false);
    }
  };

  // Editar endereço existente
  const handleEditAddress = async () => {
    if (!user || !editingAddress) return;

    // Validação
    if (!editingAddress.street || !editingAddress.city || !editingAddress.postal_code || !editingAddress.country) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setSaving(true);

    try {
      // 1. Se marcado como padrão, desmarcar outros
      if (editingAddress.is_default) {
        const { error: updateError } = await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('customer_id', user.id)
          .neq('id', editingAddress.id);

        if (updateError) {
          console.error('❌ Erro ao atualizar outros endereços:', updateError);
        }
      }

      // 2. Atualizar endereço
      const updateData = {
        address_type: editingAddress.address_type || 'shipping',
        street: editingAddress.street,
        city: editingAddress.city,
        postal_code: editingAddress.postal_code,
        country: editingAddress.country,
        is_default: editingAddress.is_default,
      };

      console.log('📦 Dados do endereço a atualizar:', updateData);

      const { error: updateError } = await supabase
        .from('addresses')
        .update(updateData)
        .eq('id', editingAddress.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar endereço:', updateError);
        alert('Erro ao atualizar endereço. Por favor, tente novamente.');
        setSaving(false);
        return;
      }

      console.log('✅ Endereço atualizado com sucesso');

      // 3. Recarregar dados
      await loadUserData();

      // 4. Fechar modal
      setEditingAddress(null);
      setSaving(false);

      // Mostrar mensagem de sucesso
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-24 right-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-2 animate-bounce';
      successMessage.innerHTML = '<i class="ri-check-line text-xl"></i><span>Endereço atualizado com sucesso!</span>';
      document.body.appendChild(successMessage);
      setTimeout(() => successMessage.remove(), 3000);
    } catch (error) {
      console.error('❌ Erro ao editar endereço:', error);
      alert('Erro ao editar endereço. Por favor, tente novamente.');
      setSaving(false);
    }
  };

  const unreadNotifications = notifications.filter(n => !n.is_read).length;

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Função para obter badge de status
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; icon: string; color: string }> = {
      pending: { label: 'Pendente', icon: 'ri-time-line', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      processing: { label: 'Em Processamento', icon: 'ri-loader-4-line', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      shipped: { label: 'Enviado', icon: 'ri-truck-line', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
      delivered: { label: 'Entregue', icon: 'ri-check-double-line', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      cancelled: { label: 'Cancelado', icon: 'ri-close-line', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${config.color}`}>
        <i className={config.icon}></i>
        {config.label}
      </span>
    );
  };

  // Estado para controlar pedido expandido
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-pink-50/30 to-rose-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center">
          <i className="ri-loader-4-line text-5xl text-pink-500 animate-spin mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50/30 to-rose-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Header />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Cabeçalho */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold flex-shrink-0">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{user.full_name || 'Minha Conta'}</h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base break-all">{user.email}</p>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 rounded-full text-xs font-medium mt-2">
                    <i className="ri-vip-crown-line"></i>
                    Administrador
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-2 shadow-sm border border-gray-100 dark:border-slate-700 mb-6 sm:mb-8 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 sm:px-6 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-200 dark:shadow-pink-900/50'
                    : 'text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400'
                }`}
              >
                <i className="ri-user-line mr-2"></i>
                Perfil
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-4 sm:px-6 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-200 dark:shadow-pink-900/50'
                    : 'text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400'
                }`}
              >
                <i className="ri-shopping-bag-line mr-2"></i>
                Pedidos ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab('addresses')}
                className={`px-4 sm:px-6 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'addresses'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-200 dark:shadow-pink-900/50'
                    : 'text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400'
                }`}
              >
                <i className="ri-map-pin-line mr-2"></i>
                Endereços ({addresses.length})
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-4 sm:px-6 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap cursor-pointer relative ${
                  activeTab === 'notifications'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-200 dark:shadow-pink-900/50'
                    : 'text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400'
                }`}
              >
                <i className="ri-notification-line mr-2"></i>
                Notificações
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    {unreadNotifications}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-4 sm:px-6 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'security'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-200 dark:shadow-pink-900/50'
                    : 'text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400'
                }`}
              >
                <i className="ri-lock-line mr-2"></i>
                Segurança
              </button>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-pink-100 dark:border-slate-700">
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Informações Pessoais</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-600 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-600 dark:text-gray-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Para alterar o email, use a secção de Segurança
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                      placeholder="+351 912 345 678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                      Data de Nascimento
                    </label>
                    <input
                      type="date"
                      value={profileData.date_of_birth}
                      onChange={(e) => setProfileData({ ...profileData, date_of_birth: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {saving ? 'A guardar...' : 'Guardar Alterações'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Segurança</h2>
                
                {/* Alterar Email */}
                <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <i className="ri-mail-line text-blue-600 dark:text-blue-400"></i>
                    Alterar Email
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                        Email Atual
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-600 dark:text-gray-400 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                        Novo Email
                      </label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        placeholder="novo@email.com"
                      />
                    </div>
                    <button
                      onClick={handleChangeEmail}
                      disabled={loading || !newEmail}
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {loading ? 'A alterar...' : 'Alterar Email'}
                    </button>
                  </div>
                </div>

                {/* Alterar Password */}
                <div className="p-6 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-2xl border border-pink-200 dark:border-pink-800">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <i className="ri-lock-line text-pink-600 dark:text-pink-400"></i>
                    Alterar Password
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                        Nova Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                        Confirmar Nova Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                        placeholder="Repita a nova password"
                      />
                    </div>
                    <button
                      onClick={handleChangePassword}
                      disabled={loading || !newPassword || !confirmPassword}
                      className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {loading ? 'A alterar...' : 'Alterar Password'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Meus Pedidos</h2>
                  <span className="px-4 py-2 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 rounded-full text-sm font-bold">
                    {orders.length} {orders.length === 1 ? 'Pedido' : 'Pedidos'}
                  </span>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                      <i className="ri-shopping-bag-line text-5xl text-gray-400 dark:text-gray-500"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ainda não fez nenhum pedido</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Explore a nossa coleção e faça a sua primeira compra!</p>
                    <Link
                      to="/products"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300 whitespace-nowrap"
                    >
                      <i className="ri-shopping-bag-line"></i>
                      Ver Produtos
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-white dark:bg-slate-700 rounded-2xl border-2 border-gray-100 dark:border-slate-600 overflow-hidden hover:border-pink-200 dark:hover:border-pink-800 transition-all duration-300"
                      >
                        {/* Cabeçalho do Pedido */}
                        <div
                          className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600/50 transition-all duration-300"
                          onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                  Pedido #{order.order_number}
                                </h3>
                                {getStatusBadge(order.status)}
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <i className="ri-calendar-line"></i>
                                  {formatDate(order.created_at)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <i className="ri-shopping-bag-line"></i>
                                  {Array.isArray(order.items) ? order.items.length : JSON.parse(order.items || '[]').length} {Array.isArray(order.items) ? (order.items.length === 1 ? 'item' : 'itens') : (JSON.parse(order.items || '[]').length === 1 ? 'item' : 'itens')}
                                </span>
                                <span className="flex items-center gap-1">
                                  <i className="ri-bank-card-line"></i>
                                  {order.payment_method}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                                <p className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent">
                                  €{order.total_amount.toFixed(2)}
                                </p>
                              </div>
                              <button className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-pink-500 transition-all duration-300">
                                <i className={`${expandedOrder === order.id ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} text-2xl`}></i>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Detalhes do Pedido (Expandível) */}
                        {expandedOrder === order.id && (
                          <div className="border-t border-gray-100 dark:border-slate-600 bg-gray-50 dark:bg-slate-800/50">
                            <div className="p-6 space-y-6">
                              {/* Produtos */}
                              <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                  <i className="ri-shopping-bag-line text-pink-500"></i>
                                  Produtos
                                </h4>
                                <div className="space-y-3">
                                  {(Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]')).map((item: any, index: number) => (
                                    <div
                                      key={index}
                                      className="flex items-center gap-4 p-4 bg-white dark:bg-slate-700 rounded-xl border border-gray-100 dark:border-slate-600"
                                    >
                                      <div className="w-20 h-20 bg-gray-100 dark:bg-slate-600 rounded-lg overflow-hidden flex-shrink-0">
                                        {item.image && (
                                          <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                          />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h5 className="font-bold text-gray-900 dark:text-white truncate">{item.name}</h5>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          Quantidade: {item.quantity}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-bold text-gray-900 dark:text-white">
                                          €{(item.price * item.quantity).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          €{item.price.toFixed(2)} cada
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Resumo de Valores */}
                              <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                  <i className="ri-money-euro-circle-line text-pink-500"></i>
                                  Resumo do Pedido
                                </h4>
                                <div className="bg-white dark:bg-slate-700 rounded-xl p-4 border border-gray-100 dark:border-slate-600 space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                                    <span className="font-bold text-gray-900 dark:text-white">€{order.subtotal.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Envio</span>
                                    <span className="font-bold text-gray-900 dark:text-white">€{order.shipping_cost.toFixed(2)}</span>
                                  </div>
                                  {order.tax_amount > 0 && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600 dark:text-gray-400">IVA</span>
                                      <span className="font-bold text-gray-900 dark:text-white">€{order.tax_amount.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {order.discount_amount > 0 && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-green-600 dark:text-green-400">Desconto</span>
                                      <span className="font-bold text-green-600 dark:text-green-400">-€{order.discount_amount.toFixed(2)}</span>
                                    </div>
                                  )}
                                  <div className="pt-2 border-t border-gray-200 dark:border-slate-600 flex justify-between">
                                    <span className="font-bold text-gray-900 dark:text-white">Total</span>
                                    <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent">
                                      €{order.total_amount.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Endereço de Envio */}
                              <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                  <i className="ri-map-pin-line text-pink-500"></i>
                                  Endereço de Envio
                                </h4>
                                <div className="bg-white dark:bg-slate-700 rounded-xl p-4 border border-gray-100 dark:border-slate-600">
                                  {typeof order.shipping_address === 'string' ? (
                                    (() => {
                                      try {
                                        const addr = JSON.parse(order.shipping_address);
                                        return (
                                          <div className="text-sm text-gray-600 dark:text-gray-400">
                                            <p className="font-bold text-gray-900 dark:text-white mb-1">{addr.street}</p>
                                            <p>{addr.postal_code} {addr.city}</p>
                                            <p>{addr.country}</p>
                                          </div>
                                        );
                                      } catch {
                                        return <p className="text-sm text-gray-600 dark:text-gray-400">{order.shipping_address}</p>;
                                      }
                                    })()
                                  ) : (
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      <p className="font-bold text-gray-900 dark:text-white mb-1">{order.shipping_address?.street}</p>
                                      <p>{order.shipping_address?.postal_code} {order.shipping_address?.city}</p>
                                      <p>{order.shipping_address?.country}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Status do Pedido */}
                              <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                  <i className="ri-truck-line text-pink-500"></i>
                                  Tracking do Pedido
                                </h4>
                                <div className="bg-white dark:bg-slate-700 rounded-xl p-6 border border-gray-100 dark:border-slate-600">
                                  <div className="space-y-4">
                                    {/* Pedido Criado */}
                                    <div className="flex items-start gap-4">
                                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                        <i className="ri-check-line text-green-600 dark:text-green-400"></i>
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-bold text-gray-900 dark:text-white">Pedido Criado</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          {formatDate(order.created_at)}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Em Processamento */}
                                    {['processing', 'shipped', 'delivered'].includes(order.status) && (
                                      <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                          <i className="ri-check-line text-green-600 dark:text-green-400"></i>
                                        </div>
                                        <div className="flex-1">
                                          <p className="font-bold text-gray-900 dark:text-white">Em Processamento</p>
                                          <p className="text-sm text-gray-600 dark:text-gray-400">
                                            O seu pedido está a ser preparado
                                          </p>
                                        </div>
                                      </div>
                                    )}

                                    {/* Enviado */}
                                    {['shipped', 'delivered'].includes(order.status) && (
                                      <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                          <i className="ri-check-line text-green-600 dark:text-green-400"></i>
                                        </div>
                                        <div className="flex-1">
                                          <p className="font-bold text-gray-900 dark:text-white">Enviado</p>
                                          <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {order.shipped_at ? formatDate(order.shipped_at) : 'O seu pedido foi enviado'}
                                          </p>
                                        </div>
                                      </div>
                                    )}

                                    {/* Entregue */}
                                    {order.status === 'delivered' && (
                                      <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                          <i className="ri-check-line text-green-600 dark:text-green-400"></i>
                                        </div>
                                        <div className="flex-1">
                                          <p className="font-bold text-gray-900 dark:text-white">Entregue</p>
                                          <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {order.delivered_at ? formatDate(order.delivered_at) : 'O seu pedido foi entregue'}
                                          </p>
                                        </div>
                                      </div>
                                    )}

                                    {/* Cancelado */}
                                    {order.status === 'cancelled' && (
                                      <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                          <i className="ri-close-line text-red-600 dark:text-red-400"></i>
                                        </div>
                                        <div className="flex-1">
                                          <p className="font-bold text-gray-900 dark:text-white">Cancelado</p>
                                          <p className="text-sm text-gray-600 dark:text-gray-400">
                                            O pedido foi cancelado
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Ações */}
                              <div className="flex flex-wrap gap-3">
                                {order.status === 'delivered' && (
                                  <button className="flex-1 min-w-[200px] px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300 whitespace-nowrap">
                                    <i className="ri-arrow-go-back-line mr-2"></i>
                                    Solicitar Devolução
                                  </button>
                                )}
                                <button className="flex-1 min-w-[200px] px-6 py-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-slate-600 rounded-xl font-bold hover:border-pink-500 dark:hover:border-pink-500 transition-all duration-300 whitespace-nowrap">
                                  <i className="ri-customer-service-line mr-2"></i>
                                  Contactar Suporte
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'addresses' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Endereços</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                      Adicionar Novo Endereço
                    </label>
                    <input
                      type="text"
                      value={newAddress.label}
                      onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                      placeholder="Ex: Casa, Trabalho"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                      Tipo de Endereço
                    </label>
                    <select
                      value={newAddress.address_type}
                      onChange={(e) => setNewAddress({ ...newAddress, address_type: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="shipping">Envio</option>
                      <option value="billing">Faturação</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                      Endereço
                    </label>
                    <input
                      type="text"
                      value={newAddress.street}
                      onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                      placeholder="Rua, número, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                      placeholder="Cidade"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      value={newAddress.postal_code}
                      onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                      placeholder="Ex: 1234"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                      País
                    </label>
                    <select
                      value={newAddress.country}
                      onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="LU">Luxemburgo</option>
                      <option value="DE">Alemanha</option>
                      <option value="FR">França</option>
                      <option value="BE">Bélgica</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                      placeholder="+351 912 345 678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                      Definir como Padrão
                    </label>
                    <input
                      type="checkbox"
                      checked={newAddress.is_default}
                      onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                      className="w-4 h-4 text-pink-500 bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded focus:ring-pink-500 focus:ring-2"
                    />
                  </div>

                  <button
                    onClick={handleSaveAddress}
                    disabled={saving}
                    className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {saving ? 'A guardar...' : 'Guardar Endereço'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
