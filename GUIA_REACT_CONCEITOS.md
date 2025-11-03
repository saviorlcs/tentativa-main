# 📚 Guia de Conceitos React - Pomociclo

## 🎯 Conceitos Básicos

### 1. **useState** - Gerenciamento de Estado

```javascript
const [user, setUser] = useState(null);
```

**O que é?**
- Cria uma variável que pode mudar e fazer o componente re-renderizar
- `user` = valor atual
- `setUser` = função para atualizar o valor
- `null` = valor inicial

**Exemplo prático:**
```javascript
const [contador, setContador] = useState(0);

// Para atualizar:
setContador(1); // contador agora é 1
setContador(contador + 1); // incrementa
```

**Quando usar?**
- Dados que mudam com o tempo (formulários, modals abertos/fechados, listas)
- Qualquer coisa que precise atualizar a interface

---

### 2. **useEffect** - Efeitos Colaterais

```javascript
useEffect(() => {
  // código que roda quando o componente monta ou quando dependências mudam
  
  return () => {
    // código de limpeza (cleanup)
  };
}, [dependencia1, dependencia2]);
```

**O que é?**
- Executa código após a renderização
- Usado para: buscar dados da API, configurar listeners, timers, etc.

**Exemplo prático:**
```javascript
// Busca dados quando componente monta
useEffect(() => {
  async function carregarUsuario() {
    const res = await api.get("/auth/me");
    setUser(res.data.user);
  }
  carregarUsuario();
}, []); // [] vazio = só roda uma vez

// Atualiza quando user muda
useEffect(() => {
  console.log("Usuário mudou:", user);
}, [user]); // roda toda vez que user mudar
```

**Quando usar?**
- Carregar dados da API
- Configurar event listeners (click, scroll, etc)
- Timers (setInterval, setTimeout)
- WebSockets, subscriptions

---

### 3. **useNavigate** - Navegação entre Páginas

```javascript
const navigate = useNavigate();

// Navegar para outra página
navigate("/dashboard");
navigate("/profile", { replace: true }); // substitui histórico
```

**O que é?**
- Função do React Router para mudar de página
- `replace: true` = não adiciona ao histórico (botão voltar não volta)

**Quando usar?**
- Redirecionar usuário após login
- Navegar entre páginas programaticamente
- Proteção de rotas (redirecionar se não autenticado)

---

### 4. **useLocation** - Informações da URL Atual

```javascript
const location = useLocation();

console.log(location.pathname); // "/dashboard"
console.log(location.search);   // "?id=123"
```

**O que é?**
- Retorna informações sobre a página atual
- `pathname` = caminho da URL
- `search` = query params (?param=valor)

**Quando usar?**
- Verificar em qual página está
- Ler parâmetros da URL
- Lógica condicional baseada na rota

---

### 5. **useMemo** - Memorização de Valores

```javascript
const valorCaroParaCalcular = useMemo(() => {
  return calcularAlgoComplexo(dados);
}, [dados]);
```

**O que é?**
- Cacheia o resultado de um cálculo pesado
- Só recalcula quando as dependências mudam
- Melhora performance

**Quando usar?**
- Cálculos complexos que não precisam rodar toda vez
- Transformações de dados pesadas
- Evitar re-renders desnecessários

---

## 🎨 Conceitos de Componentes

### 6. **Props** - Propriedades do Componente

```javascript
function Header({ user, onLogout }) {
  return (
    <div>
      <h1>Olá, {user.name}</h1>
      <button onClick={onLogout}>Sair</button>
    </div>
  );
}

// Uso:
<Header user={usuarioAtual} onLogout={handleLogout} />
```

**O que é?**
- Dados passados de um componente pai para filho
- Somente leitura (não pode modificar)

---

### 7. **Context** - Estado Global

```javascript
// Criar contexto
const AppContext = createContext();

// Prover dados
<AppProvider>
  <App />
</AppProvider>

// Usar em qualquer componente filho
const { me, showMusicPlayer } = useApp();
```

**O que é?**
- Compartilha estado entre componentes sem passar props manualmente
- Usado no Pomociclo para: usuário logado, player de música, etc.

**Quando usar?**
- Dados que vários componentes precisam (usuário, tema, idioma)
- Evitar "prop drilling" (passar props por muitos níveis)

---

## 🔄 Fluxo de Dados no Pomociclo

```
App.js (raiz)
├── AppProvider (contexto global)
│   ├── AuthHandler (verifica login)
│   ├── AppTheming (aplica temas)
│   └── Routes
│       ├── Dashboard
│       │   ├── Header (user via context)
│       │   └── Timer
│       ├── Shop
│       └── Settings
```

**Fluxo:**
1. `App.js` carrega e verifica autenticação
2. `AuthHandler` busca dados do usuário (`/auth/me`)
3. Se autenticado, redireciona para `/dashboard`
4. `AppProvider` disponibiliza `user` para todos os componentes
5. `Header` e outros componentes acessam `user` via `useApp()`

---

## 🎯 Padrões Usados no Código

### Async/Await - Código Assíncrono

```javascript
// Ruim (callbacks)
api.get("/user").then(res => {
  setUser(res.data);
}).catch(err => {
  console.error(err);
});

// Bom (async/await)
async function carregarUser() {
  try {
    const res = await api.get("/user");
    setUser(res.data);
  } catch (err) {
    console.error(err);
  }
}
```

---

### Optional Chaining (?.)

```javascript
// Ruim (pode quebrar se user for null)
const nome = user.profile.name;

// Bom (safe)
const nome = user?.profile?.name;
// Se user ou profile for null/undefined, retorna undefined
```

---

### Nullish Coalescing (??)

```javascript
const valor = null ?? "padrão";     // "padrão"
const valor = undefined ?? "padrão"; // "padrão"
const valor = 0 ?? "padrão";        // 0 (diferente de ||)
const valor = "" ?? "padrão";       // "" (diferente de ||)
```

---

### Destructuring - Desestruturação

```javascript
// Antes
const nome = user.name;
const email = user.email;

// Depois
const { name, email } = user;

// Com array
const [primeiro, segundo] = [1, 2, 3];
// primeiro = 1, segundo = 2
```

---

## 🔍 Exemplos Práticos do Pomociclo

### Exemplo 1: Carregar e Exibir Usuário

```javascript
function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data.user);
      } catch (err) {
        console.error("Erro ao carregar:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div>Carregando...</div>;
  if (!user) return <div>Usuário não encontrado</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>Level: {user.level}</p>
      <p>Moedas: {user.coins}</p>
    </div>
  );
}
```

---

### Exemplo 2: Modal com Estado

```javascript
function Dashboard() {
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <div>
      <button onClick={() => setModalAberto(true)}>
        Abrir Modal
      </button>

      {modalAberto && (
        <div className="modal">
          <h2>Meu Modal</h2>
          <button onClick={() => setModalAberto(false)}>
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}
```

---

### Exemplo 3: Lista Dinâmica

```javascript
function ShopList() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function loadItems() {
      const res = await api.get("/shop/items");
      setItems(res.data);
    }
    loadItems();
  }, []);

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>
          <h3>{item.name}</h3>
          <p>{item.price} moedas</p>
        </div>
      ))}
    </div>
  );
}
```

---

## 🎓 Resumo Rápido

| Conceito | Quando Usar | Exemplo |
|----------|-------------|---------|
| `useState` | Dados que mudam | Formulários, modals, contadores |
| `useEffect` | Código após renderizar | Buscar API, timers, listeners |
| `useNavigate` | Mudar de página | Após login, redirecionamentos |
| `useLocation` | Informações da URL | Verificar página atual |
| `useMemo` | Cachear cálculos | Operações pesadas |
| `useApp()` | Acessar contexto global | Pegar dados do usuário |
| `async/await` | Chamadas assíncronas | Requisições API |
| `?.` | Acesso seguro | Evitar erros de null |

---

## 🚀 Comandos Úteis

```bash
# Iniciar frontend
cd /app/frontend
yarn start

# Instalar nova dependência
yarn add nome-do-pacote

# Verificar erros de lint
yarn lint

# Build para produção
yarn build
```

---

## 📖 Recursos para Aprender Mais

- **React Docs**: https://react.dev
- **React Router**: https://reactrouter.com
- **JavaScript Moderno**: https://javascript.info

---

**💡 Dica:** Sempre que ver algo que não entende no código, procure por:
1. O nome do hook (ex: `useState`) na documentação React
2. Exemplos práticos no próprio código do Pomociclo
3. Console.log para ver o que cada variável contém
