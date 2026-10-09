# 🧺 Lavanderia System

Sistema completo de gestão para lavanderia com **clientes**, **serviços**, **pedidos** e **usuários**, feito para rodar **100% on-premise** em um único computador, com interface moderna, responsiva e controle de acesso por perfil.

![status](https://img.shields.io/badge/status-ativo-success)
![backend](https://img.shields.io/badge/backend-Node.js%20%2B%20Express-339933)
![frontend](https://img.shields.io/badge/frontend-React%20%2B%20TypeScript-3178c6)
![db](https://img.shields.io/badge/db-SQLite%20embutido-003b57)
![so](https://img.shields.io/badge/Linux%20%7C%20Windows-multiplataforma-blue)

---

## ✨ Funcionalidades

- **Autenticação** com JWT e perfis de acesso (**Administrador**, **Gerente**, **Atendente**).
- **Gestão de Usuários** (somente Administrador) — criar, editar, ativar/desativar, redefinir senha e excluir.
- **CRUD de Clientes** — contato, endereço e observações, com busca e paginação.
- **CRUD de Serviços** organizados por categoria:
  - 💧 **Lavagem** — roupas em geral e delicadas, edredons, cobertores, tapetes…
  - 🎨 **Tingimento** — camisetas, calças, bermudas, moletons e vestidos (recoloração completa ou revitalização de tecidos).
  - 👔 **Passadoria** — simples, social e de edredons.
  - ⭐ **Especiais** — renovação de couro, tênis e mochilas, pelúcias…
- **CRUD de Pedidos** com montagem de itens, **previsão de entrega**, cálculo automático de subtotal/desconto/total e alteração de status:
  - Pendente → Em andamento → Pronto → Entregue (ou Cancelado).
- **Pagamento e notinha** — registre a forma de pagamento (Dinheiro, Pix, Cartão, Outro) e a situação (Pendente/Pago). Ao confirmar o pedido/pagamento, o sistema gera o comprovante em duas vias: **comanda do cliente** (resumida) e **via do atendente** (completa, com dados internos). Pronta para impressora térmica de **80mm**.
- **Dashboard** com indicadores: pedidos por status e receita do mês/total, além da **Fila de trabalho** (prontos para retirada e entregas do dia, com entrega em 1 clique).
- **Lançamento rápido de pedidos** (pensado para quem registra muitos pedidos por dia):
  - Seletor de **cliente com busca** por nome ou telefone e **cadastro na hora**, sem sair da tela.
  - **Serviços em lista clicável** com busca — um clique adiciona (clicar de novo aumenta a quantidade).
  - Total sempre visível no rodapé do formulário e foco automático no primeiro campo.
- **Filtros e atalhos**: filtros rápidos (Hoje, Últimos 7 dias, Atrasados), filtro por pagamento e por status; **avançar status em 1 clique**; atalhos de teclado **`N`** (novo pedido) e **`/`** (buscar). O sino do topo mostra a quantidade de pedidos **prontos para retirada**.
- **Interface responsiva** (desktop, tablet e celular), com notificações e feedback visual.

> Todos os dados são lidos e gravados no banco de dados. O sistema **não utiliza dados fictícios**: na primeira execução ele cria apenas o usuário administrador e um catálogo básico de serviços (editável).

---

## 🧱 Tecnologias

| Camada   | Stack                                                             |
| -------- | ----------------------------------------------------------------- |
| Backend  | Node.js, Express, JWT, bcrypt, Zod, `node:sqlite` (SQLite nativo) |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router, Axios     |
| Banco    | SQLite embutido (arquivo local, **sem instalação externa**)       |

---

## 💻 Pré-requisitos

O único requisito é o **Node.js 22 ou superior**. O banco de dados é o **SQLite embutido no próprio Node** — você **não precisa instalar** MySQL, PostgreSQL nem nenhum servidor de banco.

### Arch Linux / Manjaro

```bash
sudo pacman -S nodejs npm
```

Confirme a versão:

```bash
node -v   # precisa ser v22 ou superior
```

> Se o `node -v` mostrar uma versão antiga, instale o pacote `nodejs-lts` ou baixe a versão 22+ em <https://nodejs.org>.

### Windows

Opção 1 — via **winget** (recomendado, Prompt de Comando):

```bat
winget install OpenJS.NodeJS.LTS
```

Opção 2 — baixe o instalador **LTS** em <https://nodejs.org> e instale.

Após instalar, **feche e reabra** o terminal e confirme com `node -v`.

---

## 🚀 Como executar (modo on-premise)

Este é o modo recomendado para a empresa: **um único processo** serve o sistema completo (interface + API) em **uma só porta**, sem depender de internet.

### Linux / macOS

```bash
cd lavanderia-system
./start.sh
```

### Windows

Dê **duplo clique** em `start.bat` — ou, no Prompt de Comando:

```bat
cd lavanderia-system
start.bat
```

### Qualquer sistema (via npm)

```bash
cd lavanderia-system
npm start
```

Na primeira vez, o launcher instala as dependências e compila a interface automaticamente. Depois é só:

1. Abrir **http://localhost:3001** no navegador (o navegador abre sozinho).
2. Entrar com o administrador criado no primeiro acesso:
   - **E-mail:** `admin@lavanderia.com`
   - **Senha:** `admin123`
3. Ir em **Usuários** e **trocar a senha do administrador**.
4. Cadastrar gerentes/atendentes conforme a necessidade.

> Para encerrar, pressione **Ctrl+C** no terminal (ou feche a janela).

### Primeiro acesso e primeiros passos

1. **Usuários** → crie as contas de gerente e atendente (e altere a senha do admin).
2. **Serviços** → revise/ajuste o catálogo (preços, prazos) ou cadastre os seus.
3. **Clientes** → cadastre seus clientes.
4. **Pedidos** → comece a registrar os pedidos.

---

## 🛠️ Modo desenvolvimento (para programar)

Sobe backend e frontend com recarregamento automático:

```bash
cd lavanderia-system
npm run dev
```

- Backend: `http://localhost:3001` (recarrega ao salvar)
- Frontend: `http://localhost:5173` (Vite com HMR)

No Windows também há o atalho `dev.bat`.

---

## ⚙️ Configuração

As configurações ficam em `backend/.env` (use `backend/.env.example` como base). Principais variáveis:

| Variável         | Padrão                     | Descrição                                                        |
| ---------------- | -------------------------- | ---------------------------------------------------------------- |
| `PORT`           | `3001`                     | Porta do sistema (interface + API)                               |
| `HOST`           | `0.0.0.0`                  | Interface de rede onde escuta (`127.0.0.1` = só esta máquina)    |
| `DB_PATH`        | `data/lavanderia.db`       | Local do banco (relativo à pasta `backend` ou caminho absoluto)  |
| `ADMIN_NAME`     | `Administrador`            | Nome do admin criado no primeiro acesso                          |
| `ADMIN_EMAIL`    | `admin@lavanderia.com`     | E-mail do admin                                                  |
| `ADMIN_PASSWORD` | `admin123`                 | Senha inicial do admin (**troque depois**)                       |
| `SEED_SERVICES`  | `true`                     | Popula o catálogo de serviços básicos na primeira execução       |
| `STORE_NAME`     | `Lavanderia System`        | Nome da loja exibido no cabeçalho da notinha                     |
| `STORE_PHONE`    | *(vazio)*                  | Telefone da loja na notinha                                      |
| `STORE_ADDRESS`  | *(vazio)*                  | Endereço da loja na notinha                                      |
| `STORE_DOCUMENT` | *(vazio)*                  | CNPJ/CPF da loja na notinha                                      |
| `JWT_SECRET`     | *(valor padrão)*           | **Troque** por uma sequência aleatória longa                     |

> As variáveis `ADMIN_*` são usadas **apenas na criação inicial** do banco. Depois disso, gerencie os usuários pela tela **Usuários**.

---

## 🔐 Perfis de acesso

| Perfil            | Pode fazer                                                                 |
| ----------------- | -------------------------------------------------------------------------- |
| **Administrador** | Tudo: clientes, serviços, pedidos, usuários e exclusões                     |
| **Gerente**       | Criar/editar clientes, serviços e pedidos                                  |
| **Atendente**     | Criar pedidos, consultar clientes/serviços e alterar o status dos pedidos  |

---

## 🗄️ Banco de dados

O banco é criado automaticamente em `backend/data/lavanderia.db` (SQLite, arquivo único).

**Backup:** basta copiar o arquivo `backend/data/lavanderia.db` (de preferência com o sistema parado).

**💾 Visa e versão do banco junto com o código (cenário escolhido):** o repositório Git **versiona o `backend/data/lavanderia.db`** como backup (os arquivos `-wal`/`-shm`, temporários do SQLite, ficam fora). Assim, ao clonar em outra máquina, o banco já vem junto. Siga este ritual nos commits para um backup consistente:

1. Pare o servidor (ou gere o checkpoint) para os dados irem para o arquivo principal;
2. `git add -A && git commit` — o `.db` entra no pacote atualizado;
3. Na máquina nova: `git pull`/`git clone` e rode `./start.sh` (instala deps e builds sozinho).

> Lembrete: o `backend/.env` **não** é versionado (contém senhas). Na máquina nova, copie o `.env.example` para `.env` e ajuste os dados da loja/credenciais se quiser.

**Recomeçar do zero** (apaga clientes, pedidos, serviços e usuários):

```bash
cd lavanderia-system
npm run db:reset
```

Ou, manualmente no servidor:

```bash
cd backend
node src/database/reset.js
```

---

## 🧾 Notinha / comprovante (impressão)

Cada pedido tem a ação **Imprimir notinha** (ícone de impressora na lista, no detalhe do pedido ou automaticamente ao criar/marcar como pago). O comprovante tem **duas vias**, que são impressas **juntas — com um único clique**, cada uma em seu papel, uma seguida da outra:

- **Cliente (comanda):** versão resumida — loja, nº do pedido, data, cliente, itens, total, pagamento e previsão de entrega.
- **Atendente (via completa):** tudo da comanda + status, responsável, contato/endereço completo, valores unitários, desconto, observações internas e datas.

O layout é otimizado para **impressora térmica de 80mm**. Ao imprimir, escolha a impressora térmica e o papel de 80mm — a largura é ajustada automaticamente pelo navegador e a quebra de página separa as duas vias.

O cabeçalho da notinha usa os dados da loja definidos em `backend/.env` (`STORE_NAME`, `STORE_PHONE`, `STORE_ADDRESS`, `STORE_DOCUMENT`).

---

## 📁 Estrutura

```
lavanderia-system/
├── start.sh / start.bat / dev.bat   # launchers (Linux e Windows)
├── package.json                     # scripts: setup, build, start, dev, db:reset
├── scripts/                         # launchers multiplataforma (Node)
├── backend/
│   ├── .env / .env.example          # configuração
│   ├── data/lavanderia.db           # banco SQLite (gerado)
│   └── src/
│       ├── config/                  # variáveis de ambiente
│       ├── controllers/             # auth, clients, services, orders, users
│       ├── database/                # conexão, schema e reset
│       ├── middleware/              # autenticação e autorização
│       ├── models/                  # acesso a dados
│       └── routes/                  # rotas da API
└── frontend/
    └── src/
        ├── components/              # UI (botões, inputs, modais, layout…)
        ├── context/                 # Auth e Toast
        ├── hooks/                   # hooks reutilizáveis
        ├── pages/                   # Dashboard, Clientes, Serviços, Pedidos, Usuários, Login
        ├── services/                # cliente HTTP da API
        ├── types/                   # tipos TypeScript
        └── utils/                   # formatação, máscaras e axios
```

---

## 🔌 Endpoints principais

| Método | Rota                        | Descrição                          |
| ------ | --------------------------- | ---------------------------------- |
| POST   | `/api/auth/login`           | Login (retorna JWT)                |
| GET    | `/api/auth/me`              | Dados do usuário autenticado       |
| PUT    | `/api/auth/password`        | Troca a própria senha              |
| GET    | `/api/users`                | Lista usuários (admin)             |
| POST   | `/api/users`                | Cria usuário (admin)               |
| PUT    | `/api/users/:id`            | Atualiza usuário (admin)           |
| PUT    | `/api/users/:id/password`   | Redefine senha (admin)             |
| DELETE | `/api/users/:id`            | Remove usuário (admin)             |
| GET    | `/api/clients`              | Lista clientes (busca/paginação)   |
| POST   | `/api/clients`              | Cria cliente                       |
| PUT    | `/api/clients/:id`          | Atualiza cliente                   |
| DELETE | `/api/clients/:id`          | Remove cliente (soft delete)       |
| GET    | `/api/services`             | Lista serviços (filtro por categoria) |
| POST   | `/api/services`             | Cria serviço                       |
| PUT    | `/api/services/:id`         | Atualiza serviço                   |
| DELETE | `/api/services/:id`         | Remove serviço                     |
| GET    | `/api/orders`               | Lista pedidos (filtros/paginação)  |
| GET    | `/api/orders/stats`         | Indicadores do dashboard           |
| POST   | `/api/orders`               | Cria pedido com itens              |
| PATCH  | `/api/orders/:id/status`    | Atualiza status do pedido          |
| GET    | `/api/orders/:id/receipt`   | Gera a notinha (comanda + via do atendente) |
| PATCH  | `/api/orders/:id/payment`   | Atualiza situação/forma de pagamento |

---

## 🌐 Acesso pela rede local (opcional)

Por padrão o sistema escuta em `0.0.0.0`, ou seja, outros computadores da mesma rede já conseguem acessá-lo pelo **IP da máquina servidora**:

1. Descubra o IP do computador servidor (Linux: `ip addr`; Windows: `ipconfig`).
2. Em outra máquina da rede, acesse `http://<IP-DO-SERVIDOR>:3001`.

Para restringir o acesso **somente a esta máquina**, defina no `backend/.env`:

```
HOST=127.0.0.1
```

> Se for acessar pela rede, libere a porta `3001` no firewall do computador servidor.

---

## 🧯 Solução de problemas

**"EADDRINUSE: address already in use"**

O launcher (`./start.sh`, `start.bat` ou `npm start`) já detecta e libera automaticamente as portas `3001` e `5173`, encerrando apenas processos deste projeto. Se a porta estiver ocupada por **outro programa**, o sistema avisa — nesse caso, encerre o outro programa ou altere `PORT` em `backend/.env`.

Verificação manual (Linux):

```bash
ss -ltnp 'sport = :3001'   # ver o que está usando a porta
kill <PID>                 # encerrar pelo PID exibido
```

**`node -v` mostra versão antiga**

Atualize o Node.js para 22+ (veja a seção **Pré-requisitos**).

**Esqueci a senha do administrador**

No servidor, rode `npm run db:reset` (isso **apaga todos os dados**) e faça o primeiro acesso novamente com as credenciais do `backend/.env`.

---

## 🔒 Recomendações de segurança (on-premise)

- Troque a **senha do administrador** no primeiro acesso.
- Troque o `JWT_SECRET` no `backend/.env` por uma sequência aleatória longa.
- Mantenha o arquivo `backend/data/lavanderia.db` protegido e faça **backups periódicos**.
- Restrinja o acesso físico/à rede da máquina conforme a necessidade.

---

Feito com 💙 para deixar a gestão da sua lavanderia simples e bonita.
