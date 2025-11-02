// src/pages/Appearance.jsx
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Sun, Moon, Monitor, Check, Palette, Sparkles, ShoppingBag } from 'lucide-react';
import Footer from '@/components/Footer';
import { useNavigate } from 'react-router-dom';

const THEME_MODES = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'auto', label: 'Auto', icon: Monitor },
];

// TEMAS GRATUITOS - Estilo do site (dark, profissional, sutis)
const FREE_COLOR_SCHEMES = [
  {
    id: 'pomociclo-default',
    name: 'Pomociclo Padrão',
    description: 'Tema original azul/cyan',
    colors: {
      primary: '#06b6d4',
      accent: '#8b5cf6',
      bg: '#0b1220',
      surface: '#0f172a',
      text: '#e5e7eb'
    },
    gradient: 'from-cyan-500 to-purple-600',
  },
  {
    id: 'midnight-blue',
    name: 'Azul Meia-Noite',
    description: 'Tons de azul profundo',
    colors: {
      primary: '#3b82f6',
      accent: '#60a5fa',
      bg: '#0a0e1a',
      surface: '#0f1419',
      text: '#e2e8f0'
    },
    gradient: 'from-blue-600 to-blue-400',
  },
  {
    id: 'dark-slate',
    name: 'Ardósia Escura',
    description: 'Cinza neutro e elegante',
    colors: {
      primary: '#64748b',
      accent: '#94a3b8',
      bg: '#0f0f0f',
      surface: '#1a1a1a',
      text: '#e5e7eb'
    },
    gradient: 'from-slate-600 to-slate-400',
  },
  {
    id: 'deep-space',
    name: 'Espaço Profundo',
    description: 'Roxo espacial sutil',
    colors: {
      primary: '#7c3aed',
      accent: '#a78bfa',
      bg: '#0a0a14',
      surface: '#12121f',
      text: '#e9d5ff'
    },
    gradient: 'from-violet-600 to-purple-400',
  },
];

export default function Appearance() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [themeMode, setThemeMode] = useState('auto');
  const [colorScheme, setColorScheme] = useState('pomociclo-default');
  const [saving, setSaving] = useState(false);
  const [equippedTheme, setEquippedTheme] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const res = await api.get('/auth/me');
      const userData = res.data?.user;
      setUser(userData);

      // Carrega tema equipado da loja (se houver)
      if (userData?.equipped_items?.theme) {
        setEquippedTheme(userData.equipped_items.theme);
      }

      // Carrega preferências de aparência básica
      const prefsRes = await api.get('/user/appearance').catch(() => ({ data: {} }));
      const prefs = prefsRes.data || {};
      
      setThemeMode(prefs.theme_mode || 'auto');
      setColorScheme(prefs.color_scheme || 'pomociclo-default');
      
      // Aplica o tema apenas se não houver tema equipado da loja
      if (!userData?.equipped_items?.theme) {
        applyTheme(prefs.theme_mode || 'auto', prefs.color_scheme || 'pomociclo-default');
      }
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    } finally {
      setLoading(false);
    }
  }

  function applyTheme(mode, scheme) {
    const root = document.documentElement;
    
    // Aplica modo (claro/escuro/auto)
    if (mode === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else if (mode === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
    } else {
      // Auto - detecta preferência do sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.remove('light', 'dark');
      root.classList.add(prefersDark ? 'dark' : 'light');
    }

    // Aplica esquema de cores gratuito
    const selectedScheme = FREE_COLOR_SCHEMES.find(s => s.id === scheme);
    if (selectedScheme) {
      // Aplica as variáveis CSS personalizadas
      root.style.setProperty('--primary', selectedScheme.colors.primary);
      root.style.setProperty('--accent', selectedScheme.colors.accent);
      root.style.setProperty('--bg', selectedScheme.colors.bg);
      root.style.setProperty('--surface', selectedScheme.colors.surface);
      root.style.setProperty('--text', selectedScheme.colors.text);
      
      console.log('[Appearance] Tema aplicado:', scheme, selectedScheme.colors);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.post('/user/appearance', {
        theme_mode: themeMode,
        color_scheme: colorScheme,
      });
      
      // Aplica o tema apenas se não houver tema da loja equipado
      if (!equippedTheme) {
        applyTheme(themeMode, colorScheme);
      }
      
      toast.success('Preferências de aparência salvas!');
    } catch (e) {
      console.error('Erro ao salvar:', e);
      toast.error('Erro ao salvar preferências');
    } finally {
      setSaving(false);
    }
  }

  function handleThemeModeChange(mode) {
    setThemeMode(mode);
    if (!equippedTheme) {
      applyTheme(mode, colorScheme);
    }
  }

  function handleColorSchemeChange(scheme) {
    setColorScheme(scheme);
    if (!equippedTheme) {
      applyTheme(themeMode, scheme);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
        <Header user={user} />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
      <Header user={user} />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Palette className="w-8 h-8 text-cyan-400" />
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400">
              Aparência
            </h1>
          </div>
          
          <Button
            onClick={() => navigate('/loja')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg flex items-center gap-2"
          >
            <ShoppingBag className="w-5 h-5" />
            Temas Premium na Loja
          </Button>
        </div>

        {/* Aviso sobre tema equipado */}
        {equippedTheme && (
          <Card className="bg-purple-900/30 border-purple-500/50 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <div>
                <p className="text-purple-200 font-semibold">Tema Premium Equipado</p>
                <p className="text-purple-300/70 text-sm">
                  Você está usando um tema da loja. Para usar os temas gratuitos, desequipe o tema atual na Loja.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Modo de Tema */}
        <Card className="bg-slate-800/60 border-slate-700 rounded-2xl p-6 mb-6 app-surface">
          <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-cyan-400" />
            Modo de Tema
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {THEME_MODES.map((mode) => {
              const Icon = mode.icon;
              const isSelected = themeMode === mode.value;
              
              return (
                <button
                  key={mode.value}
                  onClick={() => handleThemeModeChange(mode.value)}
                  className={`relative p-6 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'bg-cyan-900/40 border-cyan-500 shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700 hover:border-slate-500'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <Check className="w-5 h-5 text-cyan-400" />
                    </div>
                  )}
                  <Icon className={`w-8 h-8 mx-auto mb-3 ${
                    isSelected ? 'text-cyan-400' : 'text-gray-400'
                  }`} />
                  <div className={`text-center font-semibold ${
                    isSelected ? 'text-white' : 'text-gray-300'
                  }`}>
                    {mode.label}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Esquemas de Cores GRATUITOS */}
        <Card className="bg-slate-800/60 border-slate-700 rounded-2xl p-6 mb-6 app-surface">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-xl flex items-center gap-2">
              <Palette className="w-5 h-5 text-cyan-400" />
              Esquemas de Cores Gratuitos
            </h2>
            <div className="text-sm text-cyan-400 font-semibold">
              {FREE_COLOR_SCHEMES.length} temas disponíveis
            </div>
          </div>
          
          <p className="text-gray-400 text-sm mb-6">
            Escolha um dos temas gratuitos abaixo. Para temas premium com efeitos especiais, visite a Loja!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FREE_COLOR_SCHEMES.map((scheme) => {
              const isSelected = colorScheme === scheme.id && !equippedTheme;
              
              return (
                <button
                  key={scheme.id}
                  onClick={() => handleColorSchemeChange(scheme.id)}
                  disabled={!!equippedTheme}
                  className={`relative p-5 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'bg-cyan-900/40 border-cyan-500 shadow-lg shadow-cyan-500/20'
                      : equippedTheme
                      ? 'bg-slate-700/30 border-slate-600 opacity-50 cursor-not-allowed'
                      : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700 hover:border-slate-500'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <Check className="w-5 h-5 text-cyan-400" />
                    </div>
                  )}
                  
                  <div className={`font-bold text-lg mb-1 ${
                    isSelected ? 'text-white' : 'text-gray-200'
                  }`}>
                    {scheme.name}
                  </div>
                  
                  <div className="text-gray-400 text-sm mb-4">
                    {scheme.description}
                  </div>
                  
                  {/* Preview de cores */}
                  <div className="flex gap-2">
                    <div
                      className="flex-1 h-12 rounded-lg border border-white/20 shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${scheme.colors.primary}, ${scheme.colors.accent})` }}
                      title="Cores principais"
                    />
                    <div className="flex flex-col gap-1 flex-1">
                      <div
                        className="h-5 rounded border border-white/10"
                        style={{ backgroundColor: scheme.colors.bg }}
                        title="Background"
                      />
                      <div
                        className="h-6 rounded border border-white/10"
                        style={{ backgroundColor: scheme.colors.surface }}
                        title="Surface"
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Botões de ação */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-400">
            <Sparkles className="w-4 h-4 inline mr-1" />
            Quer mais opções? Visite a <button onClick={() => navigate('/loja')} className="text-purple-400 hover:text-purple-300 underline font-semibold">Loja</button> para temas premium!
          </div>
          
          <Button
            onClick={handleSave}
            disabled={saving || !!equippedTheme}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvando...' : 'Salvar Preferências'}
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
