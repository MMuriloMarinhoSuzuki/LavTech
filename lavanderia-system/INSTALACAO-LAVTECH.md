# Guia rápido: Instalar a LavTech (Lavanderia System) em uma máquina nova

A LavTech funciona 100% **on-premise** (apenas no seu computador). Você só precisa do **Node.js 22+**. O banco de dados é embutido (não precisa instalar MySQL/Postgres).

## 1) Pré-requisitos

### Windows
- Instale o Node.js LTS 22+ pelo [site oficial](https://nodejs.org) ou via `winget install OpenJS.NodeJS.LTS`
- Abra um `cmd` ou `PowerShell` e verifique: `node -v` (deve exibir v22 ou superior)

### Linux (Arch/Manjaro/Ubuntu/Debian)
- Instale: `sudo pacman -S nodejs npm` (Arch) ou `sudo apt install nodejs npm` (Debian/Ubuntu)
- Verifique: `node -v`

## 2) Baixar e extrair

1. Baixe o pacote `LavTech-limpo.tar.gz` (sem `.env` e sem `node_modules`)
2. Extraia para uma pasta da sua preferência. Ex.: `C:\Users\SeuNome\LavTech` (Windows) ou `~/LavTech` (Linux)

Depois de extrair, você terá algo assim:

```text
LavTech/
├── AGENTS.md (opcional, não usado na execução)
├── .gitignore
└── lavanderia-system/
    ├── backend/
    ├── frontend/
    ├── package.json
    ├── start.sh
    ├── start.bat
    └── ...
```

## 3) Criar o arquivo .env

Dentro de `lavanderia-system/backend/` existe `backend/.env.example`. Copie-o para `.env` na MESMA pasta.

**Windows (Explorer):** copie `lavanderia-system\backend\.env.example` e renomeie para `.env`
**Linux (terminal):**

```bash
cd LavTech/lavanderia-system/backend
cp .env.example .env
```

Esse arquivo guarda o nome da loja (para a notinha) e outras configurações. Não precisa alterar nada para testar. As senhas/admin são criadas automaticamente.

## 4) Instalar e iniciar

Abra o terminal na pasta `lavanderia-system` (a que tem `start.sh` ou `start.bat`):

**Windows (duplo clique) — mais fácil:**
- Dê duplo clique em `start.bat` dentro de `lavanderia-system\`

**Windows (terminal):**
```cmd
cd C:\caminho\para\LavTech\lavanderia-system
start.bat
```

**Linux/macOS:**
```bash
cd ~/LavTech/lavanderia-system
chmod +x start.sh
./start.sh
```

**Qualquer sistema (via npm):**
```bash
cd lavanderia-system
npm start
```

Na **primeira execução**, o script vai:
1. Instalar dependências (`backend/node_modules` e `frontend/node_modules`) — demora alguns minutos na 1ª vez
2. Compilar o frontend (`frontend/dist`)
3. Criar o banco `backend/data/lavanderia.db` (já vem com os 10 serviços e usuários padrão)
4. Abrir o navegador sozinho em `http://localhost:3001`

## 5) Primeiro login

Abra `http://localhost:3001` e entre com:

| Email | Senha | Perfil |
|---|---|---|
| `jorge@lavanderia.com` | `0225` | admin |
| `admin@lavanderia.com` | `admin123` | admin |

**Recomendado:** troque a senha do `admin@lavanderia.com` pela tela **Usuários** logo no primeiro acesso.

## 6) Usando o sistema

- **Serviços** → o catálogo já tem ícones por serviço (bermuda/calça/camiseta/tênis etc). Ao criar/editar, o ícone sugere sozinho pelo nome e você pode trocar com um clique.
- **Clientes** → cadastre ou busque por nome/telefone.
- **Pedidos** → selecione cliente, adicione serviços (clicando na lista) e finalize. Ao imprimir notinha, sai **duas vias juntas** com 1 clique.
- **Dashboard** → fila "prontos p/ retirada", atalhos `N` (novo pedido) e `/` (buscar).

## 7) Parar/voltar a usar depois

- **Parar:** pressione `Ctrl + C` no terminal (ou feche a janela preta/branca)
- **Voltar a usar:** abra `start.bat` (Windows) ou `./start.sh` (Linux) novamente — ele não reinstala tudo, só levanta o servidor

## 8) Backup dos dados

Os dados ficam em **um único arquivo**: `lavanderia-system/backend/data/lavanderia.db`

**Para fazer backup:** copie esse arquivo para outro local (pen drive, pasta de backup). **Dica:** faça o backup com o sistema **parado**.

**Para restaurar:** cole o `.db` de volta no mesmo caminho, substituindo o arquivo atual.

## 9) Dicas e solução de problemas

- **Navegador não abriu sozinho?** Acesse manualmente `http://localhost:3001`
- **Porta 3001 ocupada?** Feche outro programa que use essa porta, ou edite `backend/.env` trocando `PORT=3001` por outra (ex.: `3002`)
- **Windows pede "permitir acesso"?** Pode aceitar (é o Node abrindo servidor local)
- **Acha que faltou dependência?** Rode `npm run setup` dentro de `lavanderia-system/` (instala backend+frontend)
- **Quer zerar o banco?** Com servidor parado: `npm run db:reset` (apaga clientes/pedidos/serviços/usuários e recria admin + catálogo)

**Suporte prático:** siga esses passos na ordem. Na maioria dos casos, bastam os passos 3–5 para rodar.