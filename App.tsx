
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { LandingPage } from './components/LandingPage';
import { CrmDashboard } from './components/CrmDashboard';
import { ChatWidget } from './components/ChatWidget';
import { Shop } from './components/Shop';
import { CartDrawer } from './components/CartDrawer';
import { Auth } from './components/Auth';
import { UserProfile } from './components/UserProfile';
import { About } from './components/About';
import { Journal } from './components/Journal';
import { Concierge } from './components/Concierge';
import { ViewMode, Customer, Message, Product, CartItem, Order, User } from './types';
import { INITIAL_CUSTOMERS, MOCK_PRODUCTS } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('landing');
  const [user, setUser] = useState<User | null>(null);
  
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Chat Widget State (to programmatically open it from Concierge page)
  // Note: The ChatWidget itself manages its open state internally in the current implementation.
  // Ideally, we'd lift that state up, but for this refactor, we can simulate "opening" by keeping it simple
  // or refactoring ChatWidget to accept an `isOpen` prop.
  // For now, let's treat the ChatWidget as an always-present overlay that user toggles,
  // but we can't easily force-open it from parent without lifting state.
  // Refactor ChatWidget to be controllable? Yes.
  // Actually, I'll refrain from heavy refactor of ChatWidget to avoid breaking changes if not requested.
  // Instead, the Concierge page "Start Live Consultation" will just be a visual cue or we can assume the user clicks the bubble.
  // WAIT: To make the Concierge page button work ("Start Live Consultation"), I should control ChatWidget state.

  // Let's implement controlled state for ChatWidget
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleLogin = (newUser: User) => {
    // Determine the view based on role
    const nextView = newUser.role === 'admin' ? 'crm' : 'shop';
    
    // Ensure the user has the latest profile data if they exist in our mock customers list
    const existingCustomer = customers.find(c => c.email === newUser.email);
    const updatedUser = {
        ...newUser,
        address: existingCustomer ? '123 Luxury Lane, Beverly Hills, CA' : newUser.address
    };

    setUser(updatedUser);
    setCurrentView(nextView);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('landing');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  // Function to handle new messages from the public chat widget
  const handleNewChatMessage = (msg: Message) => {
    setCustomers(prev => {
      const targetCustomerId = 'c1'; 
      return prev.map(c => {
        if (c.id === targetCustomerId) {
          return {
            ...c,
            lastInteraction: new Date(),
            messages: [...c.messages, msg]
          };
        }
        return c;
      });
    });
  };

  // Cart Handlers
  const handleAddToCart = (item: CartItem) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.productId === item.productId && i.variantId === item.variantId);
      if (existing) {
        return prev.map(i => i.variantId === item.variantId ? { ...i, quantity: i.quantity + item.quantity } : i);
      }
      return [...prev, item];
    });
    setIsCartOpen(true);
  };

  const handleRemoveFromCart = (variantId: string) => {
    setCartItems(prev => prev.filter(i => i.variantId !== variantId));
  };

  const handlePlaceOrder = (details: { name: string; email: string; address: string }) => {
    const newOrder: Order = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      customerDetails: details,
      items: [...cartItems],
      total: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      status: 'Pending',
      date: new Date()
    };

    setOrders(prev => [newOrder, ...prev]);
    setCartItems([]);
    
    // Also attach order to the customer history if they match email
    setCustomers(prev => prev.map(c => {
      if (c.email === details.email) {
        return { 
          ...c, 
          lastInteraction: new Date(),
          orders: [...(c.orders || []), newOrder] 
        };
      }
      return c;
    }));
  };

  // Filter orders for the logged-in user profile
  const userOrders = user && user.email 
    ? orders.filter(o => o.customerDetails.email === user.email)
    : [];

  return (
    <Layout 
      currentView={currentView} 
      onNavigate={setCurrentView}
      cartItemCount={cartItems.reduce((sum, i) => sum + i.quantity, 0)}
      onOpenCart={() => setIsCartOpen(true)}
      user={user}
      onLogout={handleLogout}
    >
      {currentView === 'landing' && <LandingPage />}
      
      {currentView === 'shop' && <Shop products={products} onAddToCart={handleAddToCart} />}
      
      {currentView === 'about' && <About />}
      
      {currentView === 'journal' && <Journal />}
      
      {currentView === 'concierge' && <Concierge onOpenChat={() => setIsChatOpen(true)} />}

      {currentView === 'crm' && (
        user?.role === 'admin' ? (
          <CrmDashboard 
            customers={customers} setCustomers={setCustomers}
            products={products} setProducts={setProducts}
            orders={orders} setOrders={setOrders}
          />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-brand-500">
             <h2 className="text-xl font-serif mb-4">Staff Access Only</h2>
             <p className="mb-6">Please log in with an administrator account to view the CRM.</p>
             <button onClick={() => setCurrentView('auth')} className="bg-brand-900 text-white px-6 py-2 rounded-lg">Go to Login</button>
          </div>
        )
      )}

      {currentView === 'auth' && (
        <Auth onLogin={handleLogin} onCancel={() => setCurrentView('landing')} />
      )}

      {currentView === 'profile' && user && (
        <UserProfile 
          user={user} 
          orders={userOrders} 
          onUpdateUser={handleUpdateUser}
          onLogout={handleLogout}
        />
      )}

      {/* Global Elements */}
      <ChatWidget 
        onNewMessage={handleNewChatMessage} 
        isOpen={isChatOpen} 
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onRemove={handleRemoveFromCart}
        onPlaceOrder={handlePlaceOrder}
      />
    </Layout>
  );
};

export default App;
