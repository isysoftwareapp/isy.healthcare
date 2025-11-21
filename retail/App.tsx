
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, ChevronRight, Monitor, Settings, CreditCard, 
  Box, Users, Smartphone, QrCode, Printer, LayoutGrid, 
  ExternalLink, Lock, Zap, Globe, Shield, ShoppingBag, Check
} from 'lucide-react';
import FluidBackground from './components/FluidBackground';
import AIChat from './components/AIChat';
import CustomCursor from './components/CustomCursor';
import AdminPanel from './components/AdminPanel';
import { useSiteContent } from './hooks/useSiteContent';
import { FeatureBlock, EcosystemItem } from './types';

// Icon Mapper
const IconMap: Record<string, any> = {
  Monitor, Settings, CreditCard, Box, Users, Smartphone, 
  QrCode, Printer, LayoutGrid, Zap, Globe, Shield
};

const getIcon = (iconName: string) => {
  const IconComponent = IconMap[iconName] || Monitor;
  return IconComponent;
};

const App: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { content, updateContent, resetContent, isLoaded } = useSiteContent();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  
  // Product Catalog Filters
  const [productFilter, setProductFilter] = useState<'all' | 'kiosk' | 'pos'>('kiosk');

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - 80;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAdmin(true);
      setShowLogin(false);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  if (!isLoaded) return null;

  if (isAdmin) {
    return (
      <AdminPanel 
        content={content} 
        onUpdate={updateContent} 
        onReset={resetContent}
        onLogout={() => setIsAdmin(false)} 
      />
    );
  }

  const filteredProducts = content.products.filter(p => productFilter === 'all' || p.category === productFilter);

  return (
    <div className="relative min-h-screen font-brand text-black selection:bg-[#ADE8F4] selection:text-black">
      {/* Background Logic */}
      {content.images.backgroundImage ? (
        <div 
            className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat bg-fixed"
            style={{ backgroundImage: `url(${content.images.backgroundImage})` }}
        >
            <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]"></div>
        </div>
      ) : (
        <FluidBackground />
      )}
      
      <CustomCursor />
      <AIChat />

      {/* Login Modal */}
      <AnimatePresence>
        {showLogin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative"
            >
               <button 
                 onClick={() => setShowLogin(false)} 
                 className="absolute top-4 right-4 text-gray-400 hover:text-black"
               >
                 <X className="w-5 h-5" />
               </button>
               
               <div className="mb-6 text-center">
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
                     <Lock className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">Admin Access</h2>
                  <p className="text-gray-500 text-sm">Enter your credentials to manage the site.</p>
               </div>

               <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter Password"
                      className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 ${loginError ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-[#ADE8F4]'}`}
                      autoFocus
                    />
                    {loginError && <p className="text-red-500 text-xs mt-1 ml-1">Incorrect password. Try again.</p>}
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-[#498FB3] transition-colors"
                  >
                    Login
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 md:px-12 py-6 transition-all duration-300 bg-white/50 backdrop-blur-xl border-b border-white/20 supports-[backdrop-filter]:bg-white/50">
        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform overflow-hidden">
            {content.images.logo ? (
                <img src={content.images.logo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
                <span className="text-white font-bold text-xl">is</span>
            )}
          </div>
          <span className="text-2xl font-bold tracking-tight group-hover:opacity-80 transition-opacity">isy.software</span>
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex gap-10 text-sm font-bold text-gray-600">
          {['Ecosystem', 'Features', 'Hardware', 'Catalog', 'Pricing'].map((item) => (
            <button 
              key={item} 
              onClick={() => scrollToSection(item.toLowerCase())}
              className="hover:text-[#498FB3] transition-colors relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-[#498FB3] hover:after:w-full after:transition-all"
            >
              {item}
            </button>
          ))}
        </div>

        <div className="hidden md:flex gap-4">
             <button 
                onClick={() => scrollToSection('contact')}
                className="bg-black text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#498FB3] hover:shadow-lg hover:shadow-[#498FB3]/20 transition-all transform hover:-translate-y-0.5"
            >
                Contact Us
            </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
           {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-30 bg-white pt-24 px-6 flex flex-col gap-6 md:hidden"
          >
            {['Ecosystem', 'Features', 'Hardware', 'Catalog', 'Pricing', 'Contact'].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item.toLowerCase())}
                className="text-3xl font-bold text-black text-left pb-4"
              >
                {item}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <header className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden min-h-[90vh] flex flex-col justify-center">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-[#498FB3]/30 bg-[#ADE8F4]/20 text-[#498FB3] text-sm font-bold tracking-wide uppercase backdrop-blur-sm">
              {content.hero.badge}
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.1] mb-8 tracking-tight text-slate-900">
              {content.hero.titleLine1} <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#498FB3] via-[#ADE8F4] to-[#498FB3] bg-300% animate-gradient">
                {content.hero.titleLine2}
              </span>
            </h1>
            <p className="text-lg md:text-2xl text-gray-500 max-w-3xl mx-auto leading-relaxed mb-10 font-medium">
              {content.hero.subtitle}
            </p>
          </motion.div>

          {/* Hero Visual Placeholder */}
          <motion.div 
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 md:mt-24 relative mx-auto max-w-6xl"
          >
            <div className="relative bg-white/40 backdrop-blur-md rounded-2xl p-2 border border-white/50 shadow-2xl shadow-blue-900/10">
                <div className="aspect-[16/9] rounded-xl overflow-hidden relative bg-gradient-to-tr from-gray-50 to-white">
                    {/* Abstract representation of dashboard */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        {/* If we have a hero image, show it behind the overlay, else just overlay */}
                        {content.images.heroDashboard && (
                            <img 
                                src={content.images.heroDashboard}
                                alt="Dashboard Preview"
                                className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-multiply grayscale"
                            />
                        )}
                        <div className="text-center z-10 p-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60">
                             <LayoutGrid className="w-24 h-24 text-[#498FB3] mx-auto mb-6 opacity-80" />
                             <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-sm">System Dashboard</p>
                        </div>
                    </div>
                 </div>
                 
                 {/* Floating Elements for depth */}
                 <motion.div 
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -right-8 -top-12 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 hidden md:block"
                 >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#ADE8F4] flex items-center justify-center">
                            <Users className="w-5 h-5 text-[#000]" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-400 font-bold uppercase">New Members</div>
                            <div className="text-xl font-bold text-black">+128</div>
                        </div>
                    </div>
                 </motion.div>

                 <motion.div 
                    animate={{ y: [0, 15, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute -left-8 -bottom-8 bg-black text-white p-4 rounded-2xl shadow-xl shadow-black/20 hidden md:block"
                 >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                            <Box className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-400 font-bold uppercase">Stock Alert</div>
                            <div className="text-sm font-bold">Low Inventory: 3 Items</div>
                        </div>
                    </div>
                 </motion.div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* ECOSYSTEM SECTION */}
      <section id="ecosystem" className="py-24 relative">
        {/* Only show gradient if no custom background is present to avoid clash */}
        {!content.images.backgroundImage && (
           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white -z-10"></div>
        )}
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-sm font-bold text-[#498FB3] uppercase tracking-widest mb-3"
            >
              System Architecture
            </motion.h2>
            <motion.h3 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-bold mb-6 text-slate-900"
            >
              A modular, synchronized ecosystem.
            </motion.h3>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-gray-500 max-w-2xl mx-auto text-lg"
            >
              Every module is independent yet seamlessly connected through the cloud.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {content.ecosystem.map((item, i) => {
              const IconComponent = getIcon(item.icon);
              const isDark = item.bgClass.includes('bg-black') || item.bgClass.includes('from-[#498FB3]');
              
              return (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -10 }}
                  className={`${item.bgClass} p-10 rounded-3xl ${isDark ? 'shadow-2xl shadow-blue-900/20' : 'shadow-xl shadow-gray-100/50'} border ${isDark ? 'border-transparent' : 'border-gray-100'} flex flex-col items-start relative overflow-hidden group`}
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${isDark ? 'bg-white/20 backdrop-blur-sm' : 'bg-white shadow-sm'}`}>
                    <IconComponent className={`w-8 h-8 ${isDark ? 'text-white' : 'text-[#498FB3]'}`} />
                  </div>
                  <h4 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</h4>
                  <p className={`${isDark ? 'text-white/80' : 'text-gray-500'} leading-relaxed text-lg`}>{item.description}</p>
                  
                  {item.title.includes('CARD') && (
                      <QrCode className="absolute -bottom-10 -right-10 w-48 h-48 text-white opacity-10 rotate-12" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-20 md:py-32 overflow-hidden bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 space-y-32">
          
          {content.features.map((block, i) => {
             const isLeft = block.layout === 'left';
             
             return (
                <div key={block.id} className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-center">
                   {/* Visual Content */}
                   <div className={`order-2 ${isLeft ? 'lg:order-1' : 'lg:order-2'}`}>
                      {block.visualType === 'custom_kiosk_ui' ? (
                          <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl bg-black aspect-[3/4] max-w-md mx-auto border-8 border-black">
                             <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-black z-0"></div>
                             {/* Abstract UI Representation */}
                             <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
                                <div className="w-full bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10 shadow-2xl">
                                    <div className="flex justify-between mb-6 items-center">
                                        <div className="h-2 w-20 bg-white/30 rounded-full"></div>
                                        <div className="h-8 w-8 bg-[#ADE8F4] rounded-full opacity-80"></div>
                                    </div>
                                    <div className="h-40 w-full bg-gradient-to-br from-white/10 to-white/5 rounded-xl mb-4 border border-white/5"></div>
                                    <div className="space-y-2">
                                        <div className="h-3 w-3/4 bg-white/20 rounded-full"></div>
                                        <div className="h-3 w-1/2 bg-white/10 rounded-full"></div>
                                    </div>
                                    <div className="mt-6 h-12 w-full bg-[#498FB3] rounded-xl shadow-lg shadow-[#498FB3]/20"></div>
                                </div>
                             </div>
                             {/* Reflection */}
                             <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/10 to-transparent pointer-events-none z-20"></div>
                          </div>
                      ) : block.visualType === 'custom_joint_ui' ? (
                          <div className="relative h-[500px] bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex items-center justify-center group">
                            <div 
                              className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay"
                              style={{ backgroundImage: `url(${block.image})` }}
                            ></div>
                            <div className="text-center z-10 relative">
                              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                  <Box className="w-10 h-10 text-[#ADE8F4]" />
                              </div>
                              <h3 className="text-white font-bold text-3xl mb-2 tracking-tight">3D Builder</h3>
                              <p className="text-gray-400 font-mono text-sm uppercase tracking-widest">Interactive Module</p>
                              
                              {/* Floating Particles */}
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-[#ADE8F4]/30 rounded-full animate-spin-slow pointer-events-none"></div>
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-[#498FB3]/20 rounded-full animate-spin-reverse-slow pointer-events-none"></div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50"></div>
                          </div>
                      ) : (
                          // Standard Image
                          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden relative group">
                             <div className="absolute inset-0 bg-[#ADE8F4]/10 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"></div>
                             <img 
                                src={block.image} 
                                alt={block.title} 
                                className="w-full h-auto object-cover"
                             />
                          </div>
                      )}
                   </div>

                   {/* Text Content */}
                   <div className={`order-1 ${isLeft ? 'lg:order-2' : 'lg:order-1'}`}>
                     <div className="inline-block mb-4 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold tracking-wide uppercase">{block.tagline}</div>
                     <h2 className="text-4xl md:text-6xl font-bold mb-8 text-slate-900">{block.title}</h2>
                     <p className="text-xl text-gray-500 mb-10 leading-relaxed font-medium">
                       {block.description}
                     </p>
                     
                     {block.visualType === 'custom_joint_ui' ? (
                        // Special Grid for Joint Creator
                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#ADE8F4] transition-colors group">
                                <Box className="w-8 h-8 text-[#498FB3] mb-4 group-hover:scale-110 transition-transform" />
                                <h4 className="font-bold text-lg mb-1">Real-time 3D</h4>
                                <p className="text-sm text-gray-500">Interactive render</p>
                            </div>
                            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#ADE8F4] transition-colors group">
                                <CreditCard className="w-8 h-8 text-[#498FB3] mb-4 group-hover:scale-110 transition-transform" />
                                <h4 className="font-bold text-lg mb-1">Dynamic Price</h4>
                                <p className="text-sm text-gray-500">Updates instantly</p>
                            </div>
                        </div>
                     ) : (
                        // Standard Bullets
                        <ul className="space-y-6">
                           {block.bullets.map((bullet, bIdx) => (
                               <li key={bIdx} className="flex items-center gap-4 text-lg text-slate-700 group">
                                 <div className="w-8 h-8 rounded-full bg-[#ADE8F4]/30 flex items-center justify-center group-hover:bg-[#ADE8F4] transition-colors shrink-0">
                                    <div className="w-2.5 h-2.5 bg-[#498FB3] rounded-full"></div>
                                 </div>
                                 {bullet}
                               </li>
                           ))}
                        </ul>
                     )}
                   </div>
                </div>
             );
          })}
        </div>
      </section>

      {/* HARDWARE SECTION */}
      <section id="hardware" className="py-24 bg-[#0A0A0A] text-white relative overflow-hidden">
        {/* Texture */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
             <div>
                <h2 className="text-4xl md:text-6xl font-bold mb-8">{content.hardware.title}</h2>
                <p className="text-gray-400 text-xl mb-12 leading-relaxed">{content.hardware.subtitle}</p>
                
                <div className="space-y-10">
                   {content.hardware.items.map((item, idx) => {
                       const IconComp = getIcon(item.icon);
                       return (
                           <div key={idx} className="flex gap-6 group">
                              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-[#ADE8F4] transition-colors shrink-0">
                                <IconComp className="w-7 h-7 text-[#ADE8F4] group-hover:text-black transition-colors" />
                              </div>
                              <div>
                                 <h4 className="text-2xl font-bold mb-2">{item.title}</h4>
                                 <p className="text-gray-400 leading-relaxed">{item.description}</p>
                              </div>
                           </div>
                       );
                   })}
                </div>
             </div>
             <div className="relative perspective-1000">
                <motion.div 
                    initial={{ rotateY: -10, rotateX: 5 }}
                    whileHover={{ rotateY: 0, rotateX: 0 }}
                    transition={{ duration: 0.5 }}
                    className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl border border-gray-700 flex items-center justify-center shadow-2xl relative overflow-hidden"
                >
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-100%] animate-shine"></div>
                   
                   <div className="relative w-72 h-44 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl border border-gray-600 shadow-2xl p-6 flex flex-col justify-between overflow-hidden">
                      {/* Card Pattern */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#ADE8F4] rounded-full blur-[60px] opacity-20"></div>
                      
                      <div className="flex justify-between items-start relative z-10">
                         <div className="text-[10px] font-mono text-gray-400 tracking-widest">PREMIUM MEMBER</div>
                         <div className="text-[#ADE8F4] font-bold text-xl">is</div>
                      </div>
                      <div className="flex justify-between items-end relative z-10">
                          <div className="space-y-1">
                              <div className="w-32 h-2 bg-gray-700 rounded"></div>
                              <div className="w-20 h-2 bg-gray-700 rounded"></div>
                          </div>
                          <div className="w-12 h-12 bg-white p-1 rounded-lg">
                             <div className="w-full h-full bg-black rounded-sm flex items-center justify-center">
                                 <QrCode className="w-8 h-8 text-white" />
                             </div>
                          </div>
                      </div>
                   </div>
                </motion.div>
             </div>
          </div>
        </div>
      </section>
      
      {/* CATALOG SECTION */}
      <section id="catalog" className="py-24 bg-white/90 relative">
         <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
               <div>
                  <span className="text-sm font-bold text-[#498FB3] uppercase tracking-widest mb-3 block">Models & Specs</span>
                  <h2 className="text-4xl md:text-5xl font-bold text-slate-900">Hardware Catalog</h2>
               </div>
               <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                   {['kiosk', 'pos', 'all'].map((filter) => (
                       <button
                           key={filter}
                           onClick={() => setProductFilter(filter as any)}
                           className={`px-6 py-2 rounded-lg text-sm font-bold transition-all capitalize ${
                               productFilter === filter 
                               ? 'bg-white shadow-md text-black' 
                               : 'text-gray-500 hover:text-black'
                           }`}
                       >
                           {filter === 'all' ? 'View All' : `${filter} Models`}
                       </button>
                   ))}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
               <AnimatePresence mode="popLayout">
                   {filteredProducts.map((product) => (
                       <motion.div
                           key={product.id}
                           layout
                           initial={{ opacity: 0, scale: 0.9 }}
                           animate={{ opacity: 1, scale: 1 }}
                           exit={{ opacity: 0, scale: 0.9 }}
                           className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-shadow duration-300 flex flex-col"
                       >
                           <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden group">
                               <img 
                                   src={product.image} 
                                   alt={product.name} 
                                   className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                               />
                               <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                   {product.category}
                               </div>
                           </div>
                           
                           <div className="p-6 flex-1 flex flex-col">
                               <h3 className="text-lg font-bold text-slate-900 mb-2">{product.name}</h3>
                               <p className="text-sm text-gray-500 mb-4 line-clamp-2">{product.description}</p>
                               
                               <div className="space-y-2 mb-6 flex-1">
                                   {product.specs.slice(0, 3).map((spec, idx) => (
                                       <div key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                                           <div className="w-1 h-1 bg-[#498FB3] rounded-full mt-1.5 shrink-0"></div>
                                           {spec}
                                       </div>
                                   ))}
                               </div>
                               
                               <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                                   <div className="text-center p-2 rounded-lg bg-gray-50">
                                       <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Buy</div>
                                       <div className="font-bold text-slate-900">฿ {product.pricePurchase}</div>
                                   </div>
                                   <div className="text-center p-2 rounded-lg bg-[#ADE8F4]/20 border border-[#ADE8F4]/50">
                                       <div className="text-[10px] font-bold text-[#498FB3] uppercase tracking-wider">Rent</div>
                                       <div className="font-bold text-[#498FB3]">฿ {product.priceRent}<span className="text-[10px]">/mo</span></div>
                                   </div>
                               </div>
                           </div>
                       </motion.div>
                   ))}
               </AnimatePresence>
            </div>
         </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-24 md:py-32 bg-gray-50/80 backdrop-blur-sm relative">
        {/* Gradient overlay for smooth transition if image is used */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-white/80 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
             <h2 className="text-4xl md:text-6xl font-bold mb-6 text-slate-900">Scalable Solutions</h2>
             <p className="text-xl text-gray-500 max-w-2xl mx-auto">Choose the package that fits your business needs. All plans include hardware service options.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
             {content.pricing.map((tier, i) => (
               <div 
                 key={i} 
                 className={`relative p-10 rounded-[2rem] flex flex-col transition-all duration-300 ${
                   tier.highlight 
                    ? 'bg-black text-white shadow-2xl shadow-black/20 scale-105 z-10 ring-1 ring-black' 
                    : 'bg-white text-black border border-gray-100 shadow-xl hover:shadow-2xl hover:-translate-y-2'
                 }`}
               >
                  {tier.highlight && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#498FB3] text-white text-xs font-bold px-6 py-2 rounded-full uppercase tracking-widest shadow-lg">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-2xl font-bold mb-3">{tier.name}</h3>
                  <p className={`text-sm mb-10 leading-relaxed ${tier.highlight ? 'text-gray-400' : 'text-gray-500'}`}>{tier.description}</p>
                  
                  <div className="mb-10 flex items-baseline gap-1">
                     <span className="text-5xl font-bold tracking-tight">฿ {tier.price}</span>
                     <span className={`text-sm font-medium ${tier.highlight ? 'text-gray-400' : 'text-gray-400'}`}>{tier.period}</span>
                  </div>

                  <div className="flex-1 space-y-5 mb-10">
                     {tier.features.map((feature, idx) => (
                       <div key={idx} className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${tier.highlight ? 'bg-[#ADE8F4] text-black' : 'bg-black text-white'}`}>
                             <ChevronRight className="w-3 h-3 stroke-[3]" />
                          </div>
                          <span className={`text-sm font-bold ${tier.highlight ? 'text-gray-200' : 'text-gray-700'}`}>{feature}</span>
                       </div>
                     ))}
                  </div>

                  <button className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 transform active:scale-95 ${
                      tier.highlight 
                        ? 'bg-[#ADE8F4] text-black hover:bg-white hover:text-black' 
                        : 'bg-black text-white hover:bg-[#498FB3]'
                  }`}>
                     Choose Plan
                  </button>
               </div>
             ))}
          </div>

          <div className="mt-16 text-center">
              <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Hardware installation service available. Prices subject to configuration.
              </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="bg-white/90 backdrop-blur-lg pt-24 pb-10 border-t border-gray-100">
         <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
               <div className="lg:col-span-2">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center overflow-hidden">
                      {content.images.logo ? (
                          <img src={content.images.logo} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                          <span className="text-white font-bold text-lg">is</span>
                      )}
                    </div>
                    <span className="text-2xl font-bold tracking-tight">isy.software</span>
                  </div>
                  <h3 className="text-3xl font-bold mb-6 text-slate-900">Let's Build Your Digital Store Together.</h3>
                  <p className="text-gray-500 max-w-md text-lg leading-relaxed">
                    Contact us for a personalized quote, on-site demo, or franchise partnership opportunities.
                  </p>
               </div>

               <div>
                  <h4 className="font-bold mb-8 text-[#498FB3] uppercase tracking-widest text-xs">Contact Information</h4>
                  <ul className="space-y-6">
                     <li>
                        <a href={`mailto:${content.contact.email}`} className="text-xl font-bold hover:text-[#498FB3] transition-colors block text-slate-900">{content.contact.email}</a>
                        <span className="text-sm text-gray-400 font-medium">Email Us</span>
                     </li>
                     <li>
                        <a href={`tel:${content.contact.phone.replace(/\s/g, '')}`} className="text-xl font-bold hover:text-[#498FB3] transition-colors block text-slate-900">{content.contact.phone}</a>
                        <span className="text-sm text-gray-400 font-medium">Call Us</span>
                     </li>
                  </ul>
               </div>

               <div>
                  <h4 className="font-bold mb-8 text-[#498FB3] uppercase tracking-widest text-xs">Office Hours</h4>
                  <ul className="space-y-4 text-gray-500">
                     <li className="flex justify-between">
                        <span>Monday - Friday</span>
                        <span className="font-bold text-slate-900">09:00 - 18:00</span>
                     </li>
                     <li className="flex justify-between">
                        <span>Saturday</span>
                        <span className="font-bold text-slate-900">10:00 - 15:00</span>
                     </li>
                     <li className="flex justify-between">
                        <span>Sunday</span>
                        <span className="font-bold text-slate-900">Closed</span>
                     </li>
                  </ul>
               </div>
            </div>
            
            <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-400">© {new Date().getFullYear()} ISY Software. All rights reserved.</p>
                <div className="flex gap-6 text-sm font-bold text-gray-400">
                    <a href="#" className="hover:text-black">Privacy Policy</a>
                    <a href="#" className="hover:text-black">Terms of Service</a>
                </div>
                <button 
                   onClick={() => setShowLogin(true)}
                   className="text-xs font-bold text-gray-300 hover:text-black transition-colors flex items-center gap-1"
                >
                   <Lock className="w-3 h-3" /> Admin Access
                </button>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default App;
