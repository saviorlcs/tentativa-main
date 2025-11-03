// Página de Controle Financeiro Pessoal
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Header from '../components/Header';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, PiggyBank, Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import Footer from '../components/Footer';

const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

const FINANCIAL_CATEGORIES = {
  receitas: {
    name: 'Receitas',
    icon: TrendingUp,
    color: '#10b981',
    items: [
      'Salário',
      '13º salário / férias',
      'PLR',
      'Bônus',
      'Receita com imóveis',
      'Freelas',
      'Pensão/Aposentadoria',
      'Outros',
    ]
  },
  investimentos: {
    name: 'Investimentos',
    icon: PiggyBank,
    color: '#3b82f6',
    items: [
      'Reserva de Emergência',
      'Previdência/Aposentadoria',
      'Títulos de Renda Fixa',
      'Fundos de investimento',
      'Fundos Imobiliários',
      'Criptomoedas',
      'Ações',
      'Outros',
    ]
  },
  moradia: {
    name: 'Moradia',
    icon: DollarSign,
    color: '#f59e0b',
    items: [
      'Aluguel',
      'Condomínio',
      'IPTU',
      'Financiamento da casa',
      'Luz',
      'Água',
      'Internet/TV',
      'Gás',
      'Outros',
    ]
  },
  transporte: {
    name: 'Transporte',
    icon: DollarSign,
    color: '#ef4444',
    items: [
      'Financiamento do Carro',
      'Seguro Automotivo',
      'IPVA',
      'Transporte Público',
      'Combustível',
      'Estacionamento',
      'Outros',
    ]
  },
  saude: {
    name: 'Saúde',
    icon: DollarSign,
    color: '#ec4899',
    items: [
      'Plano de Saúde',
      'Plano odontológico',
      'Medicamentos/Farmácia',
      'Consultas',
      'Exames',
      'Outros',
    ]
  },
  educacao: {
    name: 'Educação',
    icon: DollarSign,
    color: '#8b5cf6',
    items: [
      'Escola/Colégio',
      'Faculdade/Universidade',
      'Cursos Extras',
      'Material Escolar',
      'Outros',
    ]
  },
  alimentacao: {
    name: 'Alimentação',
    icon: DollarSign,
    color: '#06b6d4',
    items: [
      'Supermercado/Feira',
      'Cafés e Restaurantes',
      'Delivery',
      'Outros',
    ]
  },
  lazer: {
    name: 'Lazer e Entretenimento',
    icon: DollarSign,
    color: '#f97316',
    items: [
      'Roupas e Acessórios',
      'Presentes',
      'Viagens',
      'Shows/Cinema/Teatro',
      'Bares/Restaurantes',
      'Streamings',
      'Hobby',
      'Outros',
    ]
  },
  cuidados: {
    name: 'Cuidado Pessoal',
    icon: DollarSign,
    color: '#a855f7',
    items: [
      'Manicure/Pedicure',
      'Cabelo/Barba',
      'Depilação/Estética',
      'Academia',
      'Outros',
    ]
  },
};

export default function Financeiro() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [financialData, setFinancialData] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const me = await api.get('/auth/me');
        setUser(me.data);
        await loadFinancialData();
      } catch (e) {
        if (e?.response?.status === 401) {
          navigate('/', { replace: true });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  async function loadFinancialData() {
    try {
      const res = await api.get('/financeiro/data');
      setFinancialData(res.data || {});
    } catch (e) {
      // Se não existir ainda, inicializa vazio
      setFinancialData({});
    }
  }

  async function saveValue(category, item, month, value) {
    try {
      const key = `${selectedYear}-${month}`;
      const newData = { ...financialData };
      if (!newData[key]) newData[key] = {};
      if (!newData[key][category]) newData[key][category] = {};
      newData[key][category][item] = parseFloat(value) || 0;
      
      await api.post('/financeiro/save', {
        year: selectedYear,
        month,
        category,
        item,
        value: parseFloat(value) || 0,
      });
      
      setFinancialData(newData);
      toast.success('Valor salvo!');
    } catch (e) {
      toast.error('Erro ao salvar');
    }
  }

  function getValue(category, item, month) {
    const key = `${selectedYear}-${month}`;
    return financialData?.[key]?.[category]?.[item] || 0;
  }

  function getTotalByCategory(category, month) {
    const key = `${selectedYear}-${month}`;
    const categoryData = financialData?.[key]?.[category] || {};
    return Object.values(categoryData).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  }

  function getTotalReceitas(month) {
    return getTotalByCategory('receitas', month);
  }

  function getTotalInvestimentos(month) {
    return getTotalByCategory('investimentos', month);
  }

  function getTotalDespesas(month) {
    const categories = ['moradia', 'transporte', 'saude', 'educacao', 'alimentacao', 'lazer', 'cuidados'];
    return categories.reduce((sum, cat) => sum + getTotalByCategory(cat, month), 0);
  }

  function getSaldo(month) {
    return getTotalReceitas(month) - getTotalInvestimentos(month) - getTotalDespesas(month);
  }

  const monthlyStats = useMemo(() => {
    const stats = MONTHS.map((_, idx) => ({
      month: idx,
      receitas: getTotalReceitas(idx),
      investimentos: getTotalInvestimentos(idx),
      despesas: getTotalDespesas(idx),
      saldo: getSaldo(idx),
    }));
    return stats;
  }, [financialData, selectedYear]);

  const totals = useMemo(() => {
    return monthlyStats.reduce((acc, stat) => ({
      receitas: acc.receitas + stat.receitas,
      investimentos: acc.investimentos + stat.investimentos,
      despesas: acc.despesas + stat.despesas,
      saldo: acc.saldo + stat.saldo,
    }), { receitas: 0, investimentos: 0, despesas: 0, saldo: 0 });
  }, [monthlyStats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-xl text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Header user={user} />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 mb-2">
              💰 Controle Financeiro
            </h1>
            <p className="text-gray-400 text-sm">Gerencie suas finanças pessoais mês a mês</p>
          </div>

          {/* Seletor de Ano */}
          <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2 app-surface">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedYear(y => y - 1)}
              className="text-gray-300 hover:text-white"
            >
              ◀
            </Button>
            <span className="text-white font-bold min-w-[80px] text-center">{selectedYear}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedYear(y => y + 1)}
              className="text-gray-300 hover:text-white"
            >
              ▶
            </Button>
          </div>
        </div>

        {/* Resumo do Ano */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-2xl p-6 backdrop-blur shadow-lg shadow-green-500/10 app-surface">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-green-400" />
              <span className="text-green-200 text-sm font-semibold">Receitas Totais</span>
            </div>
            <div className="text-3xl font-black text-white">R$ {totals.receitas.toFixed(2)}</div>
          </div>

          <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-2xl p-6 backdrop-blur shadow-lg shadow-blue-500/10 app-surface">
            <div className="flex items-center gap-3 mb-2">
              <PiggyBank className="w-6 h-6 text-blue-400" />
              <span className="text-blue-200 text-sm font-semibold">Investimentos</span>
            </div>
            <div className="text-3xl font-black text-white">R$ {totals.investimentos.toFixed(2)}</div>
          </div>

          <div className="bg-gradient-to-br from-red-600/20 to-rose-600/20 border border-red-500/30 rounded-2xl p-6 backdrop-blur shadow-lg shadow-red-500/10 app-surface">
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="w-6 h-6 text-red-400" />
              <span className="text-red-200 text-sm font-semibold">Despesas Totais</span>
            </div>
            <div className="text-3xl font-black text-white">R$ {totals.despesas.toFixed(2)}</div>
          </div>

          <div className={`bg-gradient-to-br ${totals.saldo >= 0 ? 'from-cyan-600/20 to-blue-600/20 border-cyan-500/30' : 'from-orange-600/20 to-red-600/20 border-orange-500/30'} border rounded-2xl p-6 backdrop-blur shadow-lg app-surface`}>
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className={`w-6 h-6 ${totals.saldo >= 0 ? 'text-cyan-400' : 'text-orange-400'}`} />
              <span className={`${totals.saldo >= 0 ? 'text-cyan-200' : 'text-orange-200'} text-sm font-semibold`}>Saldo</span>
            </div>
            <div className="text-3xl font-black text-white">R$ {totals.saldo.toFixed(2)}</div>
          </div>
        </div>

        {/* Tabela de Finanças */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 overflow-x-auto app-surface">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left text-cyan-300 font-bold pb-4 pr-4 sticky left-0 bg-slate-800/95 z-10">Categoria</th>
                {MONTHS.map((month, idx) => (
                  <th key={idx} className="text-center text-cyan-300 font-bold pb-4 px-2 min-w-[100px]">{month}</th>
                ))}
                <th className="text-center text-cyan-300 font-bold pb-4 px-2 min-w-[120px]">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {/* Receitas */}
              <tr>
                <td colSpan={14} className="pt-4 pb-2">
                  <div className="flex items-center gap-2 text-green-400 font-bold text-base">
                    <TrendingUp className="w-5 h-5" />
                    RECEITAS
                  </div>
                </td>
              </tr>
              {FINANCIAL_CATEGORIES.receitas.items.map((item, itemIdx) => (
                <tr key={`receita-${itemIdx}`} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                  <td className="py-2 pr-4 text-gray-300 text-sm sticky left-0 bg-slate-800/95">{item}</td>
                  {MONTHS.map((_, monthIdx) => {
                    const cellKey = `receitas-${item}-${monthIdx}`;
                    const isEditing = editingCell === cellKey;
                    const value = getValue('receitas', item, monthIdx);
                    
                    return (
                      <td key={monthIdx} className="py-2 px-2 text-center">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="0.01"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-full h-8 text-xs bg-slate-700 border-slate-600 text-white"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  saveValue('receitas', item, monthIdx, editValue);
                                  setEditingCell(null);
                                } else if (e.key === 'Escape') {
                                  setEditingCell(null);
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              className="h-8 w-8 p-0 bg-green-600 hover:bg-green-500"
                              onClick={() => {
                                saveValue('receitas', item, monthIdx, editValue);
                                setEditingCell(null);
                              }}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer hover:bg-slate-600/50 rounded px-2 py-1 text-white text-xs"
                            onClick={() => {
                              setEditingCell(cellKey);
                              setEditValue(value.toString());
                            }}
                          >
                            {value > 0 ? `R$ ${value.toFixed(2)}` : '-'}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2 px-2 text-center font-bold text-green-300">
                    R$ {MONTHS.reduce((sum, _, idx) => sum + getValue('receitas', item, idx), 0).toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-green-500/50 bg-green-900/20">
                <td className="py-3 pr-4 font-bold text-green-300 sticky left-0 bg-green-900/40">Total de Receitas</td>
                {monthlyStats.map((stat, idx) => (
                  <td key={idx} className="py-3 px-2 text-center font-bold text-green-300">
                    R$ {stat.receitas.toFixed(2)}
                  </td>
                ))}
                <td className="py-3 px-2 text-center font-bold text-green-300 text-base">
                  R$ {totals.receitas.toFixed(2)}
                </td>
              </tr>

              {/* Investimentos */}
              <tr>
                <td colSpan={14} className="pt-6 pb-2">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-base">
                    <PiggyBank className="w-5 h-5" />
                    INVESTIMENTOS
                  </div>
                </td>
              </tr>
              {FINANCIAL_CATEGORIES.investimentos.items.map((item, itemIdx) => (
                <tr key={`invest-${itemIdx}`} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                  <td className="py-2 pr-4 text-gray-300 text-sm sticky left-0 bg-slate-800/95">{item}</td>
                  {MONTHS.map((_, monthIdx) => {
                    const cellKey = `investimentos-${item}-${monthIdx}`;
                    const isEditing = editingCell === cellKey;
                    const value = getValue('investimentos', item, monthIdx);
                    
                    return (
                      <td key={monthIdx} className="py-2 px-2 text-center">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="0.01"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-full h-8 text-xs bg-slate-700 border-slate-600 text-white"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  saveValue('investimentos', item, monthIdx, editValue);
                                  setEditingCell(null);
                                } else if (e.key === 'Escape') {
                                  setEditingCell(null);
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              className="h-8 w-8 p-0 bg-green-600 hover:bg-green-500"
                              onClick={() => {
                                saveValue('investimentos', item, monthIdx, editValue);
                                setEditingCell(null);
                              }}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer hover:bg-slate-600/50 rounded px-2 py-1 text-white text-xs"
                            onClick={() => {
                              setEditingCell(cellKey);
                              setEditValue(value.toString());
                            }}
                          >
                            {value > 0 ? `R$ ${value.toFixed(2)}` : '-'}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2 px-2 text-center font-bold text-blue-300">
                    R$ {MONTHS.reduce((sum, _, idx) => sum + getValue('investimentos', item, idx), 0).toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-blue-500/50 bg-blue-900/20">
                <td className="py-3 pr-4 font-bold text-blue-300 sticky left-0 bg-blue-900/40">Total de Investimentos</td>
                {monthlyStats.map((stat, idx) => (
                  <td key={idx} className="py-3 px-2 text-center font-bold text-blue-300">
                    R$ {stat.investimentos.toFixed(2)}
                  </td>
                ))}
                <td className="py-3 px-2 text-center font-bold text-blue-300 text-base">
                  R$ {totals.investimentos.toFixed(2)}
                </td>
              </tr>

              {/* Despesas (todas as categorias) */}
              {Object.entries(FINANCIAL_CATEGORIES).filter(([key]) => !['receitas', 'investimentos'].includes(key)).map(([catKey, catData]) => (
                <>
                  <tr key={`cat-${catKey}`}>
                    <td colSpan={14} className="pt-6 pb-2">
                      <div className="flex items-center gap-2 text-red-400 font-bold text-base">
                        <catData.icon className="w-5 h-5" />
                        {catData.name.toUpperCase()}
                      </div>
                    </td>
                  </tr>
                  {catData.items.map((item, itemIdx) => (
                    <tr key={`${catKey}-${itemIdx}`} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-2 pr-4 text-gray-300 text-sm sticky left-0 bg-slate-800/95">{item}</td>
                      {MONTHS.map((_, monthIdx) => {
                        const cellKey = `${catKey}-${item}-${monthIdx}`;
                        const isEditing = editingCell === cellKey;
                        const value = getValue(catKey, item, monthIdx);
                        
                        return (
                          <td key={monthIdx} className="py-2 px-2 text-center">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-full h-8 text-xs bg-slate-700 border-slate-600 text-white"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      saveValue(catKey, item, monthIdx, editValue);
                                      setEditingCell(null);
                                    } else if (e.key === 'Escape') {
                                      setEditingCell(null);
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  className="h-8 w-8 p-0 bg-green-600 hover:bg-green-500"
                                  onClick={() => {
                                    saveValue(catKey, item, monthIdx, editValue);
                                    setEditingCell(null);
                                  }}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-slate-600/50 rounded px-2 py-1 text-white text-xs"
                                onClick={() => {
                                  setEditingCell(cellKey);
                                  setEditValue(value.toString());
                                }}
                              >
                                {value > 0 ? `R$ ${value.toFixed(2)}` : '-'}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2 px-2 text-center font-bold text-red-300">
                        R$ {MONTHS.reduce((sum, _, idx) => sum + getValue(catKey, item, idx), 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </>
              ))}

              <tr className="border-t-2 border-red-500/50 bg-red-900/20">
                <td className="py-3 pr-4 font-bold text-red-300 sticky left-0 bg-red-900/40">Total de Despesas</td>
                {monthlyStats.map((stat, idx) => (
                  <td key={idx} className="py-3 px-2 text-center font-bold text-red-300">
                    R$ {stat.despesas.toFixed(2)}
                  </td>
                ))}
                <td className="py-3 px-2 text-center font-bold text-red-300 text-base">
                  R$ {totals.despesas.toFixed(2)}
                </td>
              </tr>

              {/* Saldo */}
              <tr className="border-t-4 border-cyan-500/50 bg-cyan-900/20">
                <td className="py-4 pr-4 font-black text-cyan-300 text-base sticky left-0 bg-cyan-900/40">SALDO</td>
                {monthlyStats.map((stat, idx) => (
                  <td key={idx} className={`py-4 px-2 text-center font-black ${stat.saldo >= 0 ? 'text-cyan-300' : 'text-orange-300'}`}>
                    R$ {stat.saldo.toFixed(2)}
                  </td>
                ))}
                <td className={`py-4 px-2 text-center font-black text-lg ${totals.saldo >= 0 ? 'text-cyan-300' : 'text-orange-300'}`}>
                  R$ {totals.saldo.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Dica */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-blue-200 text-sm app-surface">
          💡 <strong>Dica:</strong> Clique em qualquer célula para editar o valor. Pressione Enter para salvar ou Esc para cancelar.
        </div>
      </div>
      <Footer />
    </div>
  );
}
