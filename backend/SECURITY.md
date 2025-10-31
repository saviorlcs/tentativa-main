# 🛡️ SISTEMA DE SEGURANÇA - POMOCICLO

## 📋 Proteções Implementadas

### 1. **Rate Limiting** 🚦
Limita número de requisições por IP para prevenir:
- Ataques DDoS
- Força bruta em login
- Scraping massivo

**Configuração:**
- 100 requisições por minuto por IP
- IPs que excedem são bloqueados por 15 minutos
- Logs automáticos de bloqueios

### 2. **Proteção XSS & Injection** 🔒
Detecta e bloqueia tentativas de:
- Cross-Site Scripting (XSS)
- SQL Injection
- Command Injection
- Path Traversal

**Ação:** Requisições maliciosas são bloqueadas e logadas.

### 3. **Proteção de Área Admin** 👮
Reforça segurança das rotas administrativas:
- Máximo 5 tentativas de acesso
- Bloqueio de 1 hora após falhas
- Logs detalhados de acesso

### 4. **Headers de Segurança** 🛡️
Adiciona headers em todas as respostas:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (anti-clickjacking)
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HTTPS)
- `Content-Security-Policy` (anti-XSS)

---

## 📊 Monitoramento

### Verificar Logs de Segurança
```bash
# Ver últimos eventos de segurança
tail -f /app/backend/logs/security.log

# Ver ataques detectados
grep "ATAQUE DETECTADO" /app/backend/logs/security.log

# Ver IPs bloqueados
grep "bloqueado" /app/backend/logs/security.log
```

### Tipos de Eventos Logados
- 🚫 IPs bloqueados por rate limit
- 🚨 Tentativas de injection detectadas
- ⚠️ Acessos à área admin
- 🔴 Múltiplas falhas de autenticação

---

## 🔐 Recomendações Adicionais

### Para Ambiente de Produção:

1. **Adicione HTTPS** (já configurado o header)
2. **Use senhas fortes** para admin
3. **Mantenha logs por 30 dias** mínimo
4. **Monitore regularmente** o arquivo `security.log`
5. **Configure alertas** para múltiplos bloqueios

### Variáveis de Ambiente Importantes:
```bash
JWT_SECRET=<seu-secret-super-forte>  # Mude isso!
COOKIE_SECURE=true  # Ative em produção
```

---

## 🚨 Como Saber se Está Sendo Atacado

### Sinais de Ataque:
1. Múltiplos IPs bloqueados em curto período
2. Muitas tentativas de acesso a `/api/admin`
3. Requisições com padrões suspeitos nos logs
4. Aumento súbito de requisições 401/403

### Comandos Úteis:
```bash
# Contar IPs únicos bloqueados hoje
grep "IP bloqueado" /app/backend/logs/security.log | grep $(date +%Y-%m-%d) | wc -l

# Ver IPs mais bloqueados
grep "IP bloqueado" /app/backend/logs/security.log | grep -oE '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}' | sort | uniq -c | sort -rn

# Ver tentativas de injection
grep "ATAQUE DETECTADO" /app/backend/logs/security.log | tail -20
```

---

## ⚙️ Ajustando Configurações

Edite `/app/backend/security_config.py`:

```python
# Aumentar limite de rate
RATE_LIMIT_MAX_REQUESTS = 200  # Mais permissivo

# Reduzir tempo de bloqueio
RATE_LIMIT_BLOCK_MINUTES = 5  # 5 minutos

# Adicionar IPs confiáveis (não serão bloqueados)
TRUSTED_IPS = [
    '127.0.0.1',
    'seu.ip.publico.aqui',
]
```

---

## 🔍 Testando as Proteções

### Teste 1: Rate Limiting
```bash
# Faça 150 requisições rápidas (deve bloquear após 100)
for i in {1..150}; do curl http://localhost:8001/api/shop/list; done
```

### Teste 2: XSS Detection
```bash
# Tente injetar script (deve ser bloqueado)
curl "http://localhost:8001/api/shop/list?search=<script>alert('xss')</script>"
```

### Teste 3: Admin Protection
```bash
# Tente acessar admin sem auth (após 5 tentativas, bloqueia)
for i in {1..6}; do curl http://localhost:8001/api/admin/seed-shop -X POST; done
```

---

## 📈 Status Atual

✅ Rate Limiting Ativo
✅ Proteção XSS/Injection Ativa
✅ Proteção Admin Ativa
✅ Headers de Segurança Ativos
✅ Logs de Segurança Ativos

**Seu site está protegido contra:**
- Ataques DDoS
- Força bruta
- XSS (Cross-Site Scripting)
- SQL/NoSQL Injection
- Command Injection
- Path Traversal
- Clickjacking
- Scraping agressivo

---

## 🆘 Em Caso de Ataque Real

1. **Verifique os logs:** `tail -100 /app/backend/logs/security.log`
2. **Identifique IPs maliciosos:** Veja os IPs bloqueados
3. **Bloqueie permanentemente se necessário:** Adicione regras no firewall do servidor
4. **Documente o incidente:** Guarde logs para análise futura

---

**Última atualização:** $(date)
**Status:** 🟢 PROTEGIDO
