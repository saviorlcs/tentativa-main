// src/pages/Appearance.jsx
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Sun, Moon, Monitor, Check, Palette } from 'lucide-react';
import Footer from '@/components/Footer';

const THEME_MODES = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'auto', label: 'Auto', icon: Monitor },
];

const COLOR_SCHEMES = [
  {
    id: 'pomociclo-classic',
    name: 'Pomociclo Classic',
    colors: ['#3b82f6', '#10b981', '#f97316'],
    isPro: false,
  },
  {
    id: 'fogo-intenso',
    name: 'Fogo Intenso',
    colors: ['#ef4444', '#f97316', '#fbbf24'],
    isPro: false,
  },
  {
    id: 'oceano-profundo',
    name: 'Oceano Profundo',
    colors: ['#06b6d4', '#0891b2', '#3b82f6'],
    isPro: false,
  },
  {
    id: 'floresta-mistica',
    name: 'Floresta Mística',
    colors: ['#10b981', '#059669', '#84cc16'],
    isPro: true,
  },
  {
    id: 'mistico-roxo',
    name: 'Místico Roxo',
    colors: ['#a855f7', '#9333ea', '#c084fc'],
    isPro: true,
  },
  {
    id: 'rosa-elegante',
    name: 'Rosa Elegante',
    colors: ['#ec4899', '#f472b6', '#a855f7'],
    isPro: true,
  },
  {
    id: 'ouro-premium',
    name: 'Ouro Premium',
    colors: ['#ca8a04', '#eab308', '#f97316'],
    isPro: true,
  },
  {
    id: 'ardosia-profissional',
    name: 'Ardósia Profissional',
    colors: ['#64748b', '#475569', '#3b82f6'],
    isPro: true,
  },
];

export default function Appearance() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [themeMode, setThemeMode] = useState('auto');
  const [colorScheme, setColorScheme] = useState('pomociclo-classic');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const res = await api.get('/auth/me');
      const userData = res.data?.user;
      setUser(userData);

      // Carrega preferências salvas
      const prefsRes = await api.get('/user/appearance').catch(() => ({ data: {} }));
      const prefs = prefsRes.data || {};
      
      setThemeMode(prefs.theme_mode || 'auto');
      setColorScheme(prefs.color_scheme || 'pomociclo-classic');
      
      // Aplica o tema
      applyTheme(prefs.theme_mode || 'auto', prefs.color_scheme || 'pomociclo-classic');
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

    // Aplica esquema de cores
    const selectedScheme = COLOR_SCHEMES.find(s => s.id === scheme);
    if (selectedScheme) {
      root.style.setProperty('--color-primary', selectedScheme.colors[0]);
      root.style.setProperty('--color-secondary', selectedScheme.colors[1]);
      root.style.setProperty('--color-accent', selectedScheme.colors[2]);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.post('/user/appearance', {
        theme_mode: themeMode,
        color_scheme: colorScheme,
      });
      
      applyTheme(themeMode, colorScheme);
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
    applyTheme(mode, colorScheme);
  }

  function handleColorSchemeChange(scheme) {
    setColorScheme(scheme);
    applyTheme(themeMode, scheme);
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

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Palette className="w-8 h-8 text-cyan-400" />
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400">
            Aparência
          </h1>
        </div>

        {/* Modo de Tema */}
        <Card className="bg-slate-800/60 border-slate-700 rounded-2xl p-6 mb-6 app-surface">
          <h2 className="text-white font-bold text-xl mb-4">Modo de Tema</h2>
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
                      ? 'bg-cyan-900/40 border-cyan-500'
                      : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700 hover:border-slate-500'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <Check className="w-5 h-5 text-cyan-400" />
                    </div>
                  )}
                  <Icon className={`w-8 h-8 mx-auto mb-3 ${isSelected ? 'text-cyan-400' : 'text-gray-400'}`} />
                  <div className={`text-center font-semibold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                    {mode.label}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Esquema de Cores */}
        <Card className="bg-slate-800/60 border-slate-700 rounded-2xl p-6 mb-6 app-surface">
          <h2 className="text-white font-bold text-xl mb-4">Esquema de Cores</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COLOR_SCHEMES.map((scheme) => {
              const isSelected = colorScheme === scheme.id;
              
              return (
                <button
                  key={scheme.id}
                  onClick={() => !scheme.isPro && handleColorSchemeChange(scheme.id)}
                  disabled={scheme.isPro}
                  className={`relative p-5 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'bg-cyan-900/40 border-cyan-500'
                      : scheme.isPro
                      ? 'bg-slate-700/30 border-slate-600 opacity-60 cursor-not-allowed'
                      : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700 hover:border-slate-500'
                  }`}
                >
                  {isSelected && !scheme.isPro && (
                    <div className="absolute top-3 right-3">
                      <Check className="w-5 h-5 text-cyan-400" />
                    </div>
                  )}
                  
                  {scheme.isPro && (
                    <div className="absolute top-3 right-3 bg-amber-500/20 px-2 py-1 rounded border border-amber-500/50">
                      <span className="text-xs font-bold text-amber-300">PRO</span>
                    </div>
                  )}
                  
                  <div className={`text-left font-semibold mb-3 ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                    {scheme.name}
                  </div>
                  
                  <div className="flex gap-2">
                    {scheme.colors.map((color, idx) => (
                      <div
                        key={idx}
                        className="flex-1 h-10 rounded-lg border border-white/20"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Botão Salvar */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg"
          >
            {saving ? 'Salvando...' : 'Salvar Preferências'}
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
