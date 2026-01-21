import { RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const HomePage = lazy(() => import('../pages/home/page'));
const ProductsPage = lazy(() => import('../pages/products/page'));
const ProductPage = lazy(() => import('../pages/product/page'));
const CartPage = lazy(() => import('../pages/cart/page'));
const CheckoutPage = lazy(() => import('../pages/checkout/page'));
const CheckoutSuccessPage = lazy(() => import('../pages/checkout/success/page'));
const CheckoutErrorPage = lazy(() => import('../pages/checkout/error/page'));
const FavoritesPage = lazy(() => import('../pages/favorites/page'));
const LoginPage = lazy(() => import('../pages/login/page'));
const RegisterPage = lazy(() => import('../pages/register/page'));
const AccountPage = lazy(() => import('../pages/account/page'));
const AdminPage = lazy(() => import('../pages/admin/page'));
const NewsletterPage = lazy(() => import('../pages/newsletter/page'));
const AboutPage = lazy(() => import('../pages/about/page'));
const ContactPage = lazy(() => import('../pages/contact/page'));
const FAQPage = lazy(() => import('../pages/faq/page'));
const ShippingPage = lazy(() => import('../pages/shipping/page'));
const ReturnsPage = lazy(() => import('../pages/returns/page'));
const PrivacyPage = lazy(() => import('../pages/privacy/page'));
const TermsPage = lazy(() => import('../pages/terms/page'));
const SupportPage = lazy(() => import('../pages/support/page'));
const NotFoundPage = lazy(() => import('../pages/NotFound'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/products',
    element: <ProductsPage />,
  },
  {
    path: '/product/:id',
    element: <ProductPage />,
  },
  {
    path: '/cart',
    element: <CartPage />,
  },
  {
    path: '/checkout',
    element: <CheckoutPage />,
  },
  {
    path: '/checkout/success',
    element: <CheckoutSuccessPage />,
  },
  {
    path: '/checkout/error',
    element: <CheckoutErrorPage />,
  },
  {
    path: '/favorites',
    element: <FavoritesPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/account',
    element: <AccountPage />,
  },
  {
    path: '/admin',
    element: <AdminPage />,
  },
  {
    path: '/about',
    element: <AboutPage />,
  },
  {
    path: '/contact',
    element: <ContactPage />,
  },
  {
    path: '/faq',
    element: <FAQPage />,
  },
  {
    path: '/newsletter',
    element: <NewsletterPage />,
  },
  {
    path: '/privacy',
    element: <PrivacyPage />,
  },
  {
    path: '/terms',
    element: <TermsPage />,
  },
  {
    path: '/shipping',
    element: <ShippingPage />,
  },
  {
    path: '/returns',
    element: <ReturnsPage />,
  },
  {
    path: '/support',
    element: <SupportPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

export default routes;
