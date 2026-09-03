# Vistoria de Área — Cerradão

App de vistoria de área (infestação, pragas, vigor da soqueira, falha) com
nota de risco calculada, dashboard por fazenda/fornecedor e relatórios.
Este projeto substitui o protótipo que rodava dentro do Claude — aqui os
dados ficam num banco de dados de verdade, acessível por qualquer pessoa
da empresa com o link, sem precisar de conta no Claude.

## O que você precisa (tudo gratuito)

1. Conta no [GitHub](https://github.com) (se ainda não tiver)
2. Conta no [Vercel](https://vercel.com) — dá pra entrar direto com o GitHub
3. Um banco Postgres — o mais simples é criar direto pelo painel do Vercel (Passo 3 abaixo)

Nenhuma dessas etapas pede conhecimento de programação — é tudo clicar em botões.

---

## Passo 1 — Subir este projeto pro GitHub

1. Entre em [github.com/new](https://github.com/new) e crie um repositório novo (pode ser privado). Dê um nome, ex: `vistoria-area-cerradao`.
2. Na página do repositório recém-criado, clique em **"uploading an existing file"** (ou "Add file" → "Upload files").
3. Arraste **todos os arquivos e pastas deste projeto** pra lá (a pasta inteira que eu te entreguei).
4. Clique em **"Commit changes"** pra confirmar o upload.

> Se preferir, dá pra fazer isso via linha de comando também (`git init`, `git add .`, `git commit`, `git push`), mas o upload pela interface do GitHub funciona igual e não exige nada instalado no seu computador.

## Passo 2 — Importar no Vercel

1. Entre em [vercel.com/new](https://vercel.com/new) e faça login com sua conta GitHub.
2. Selecione o repositório `vistoria-area-cerradao` que você acabou de criar.
3. Clique em **"Deploy"**. Ele vai tentar publicar — pode falhar nessa primeira tentativa porque ainda falta o banco de dados (Passo 3), sem problemas.

## Passo 3 — Criar o banco de dados Postgres

1. Dentro do projeto no painel do Vercel, vá na aba **"Storage"**.
2. Clique em **"Create Database"** → escolha **Postgres** (pode aparecer como "Neon" — é o mesmo).
3. Siga os passos padrão de criação (nome, região — escolha uma perto do Brasil, ex: `us-east` ou `sa-east` se disponível).
4. Depois de criado, o Vercel já conecta automaticamente esse banco ao seu projeto e cria a variável de ambiente `POSTGRES_URL` sozinho — você não precisa copiar/colar nada.

## Passo 4 — Criar a tabela no banco

1. Ainda na aba **Storage**, abra o banco que você criou e procure a opção **"Query"** ou **"SQL Editor"** (o nome varia um pouco conforme a interface do momento).
2. Cole o conteúdo do arquivo `db/schema.sql` (está nesse projeto) e execute.
3. Isso cria a tabela `visitas` onde tudo vai ficar guardado.

> Se você pular esse passo, o próprio app tenta criar a tabela sozinho na primeira vez que alguém salvar uma vistoria — mas rodar manualmente é mais garantido.

## Passo 5 — Publicar de novo

1. Volte na aba **"Deployments"** do projeto no Vercel.
2. Clique nos "..." do último deploy (o que falhou) e escolha **"Redeploy"**.
3. Agora com o banco conectado, deve publicar com sucesso.
4. Você vai receber um link tipo `https://vistoria-area-cerradao.vercel.app` — esse é o link que você compartilha com o outro time.

## Testando

1. Abra o link em qualquer navegador (celular ou computador).
2. Preencha uma vistoria de teste.
3. Confira nas abas "Vistorias", "Dashboard" e "Relatórios" se aparece certinho.
4. Compartilhe o link com quem for usar — não precisa de login nem conta.

---

## Sobre offline

O app deixa preencher a vistoria mesmo sem sinal (fica guardado no aparelho
até sincronizar), mas **precisa de internet pra salvar de fato** no banco.
Se fechar o navegador antes de sincronizar uma vistoria feita offline, ela
se perde — isso é uma limitação de qualquer app que roda no navegador
(diferente de um aplicativo nativo instalado, que teria armazenamento
próprio no aparelho).

## Atualizando o cadastro de fazendas

A lista de fazendas (código → nome) está no arquivo `lib/farms.json`.
Pra atualizar, edite esse arquivo (adicionar, remover ou corrigir uma
fazenda) e suba a alteração pro GitHub — o Vercel publica a atualização
sozinho em poucos minutos. Se quiser, no futuro dá pra migrar isso pra
uma tabela no banco também (editável direto pela tela), mas por enquanto
está como arquivo fixo, igual ao protótipo original.

## Estrutura do projeto

```
app/
  page.js              → tela principal do app (formulário, lista, dashboard, relatórios)
  layout.js            → layout raiz do Next.js
  globals.css          → estilos base (Tailwind)
  api/visitas/route.js → API que salva e lista vistorias no banco
lib/
  scoring.js           → critério de pontuação (mesma lógica do protótipo)
  db.js                → conexão com o banco Postgres
  farms.json           → cadastro de fazendas (código → nome)
db/
  schema.sql           → script pra criar a tabela do banco
```

## Rodando localmente (opcional, se algum dia tiver alguém de TI ajudando)

```
npm install
npm run dev
```

Precisa de uma variável `POSTGRES_URL` no arquivo `.env.local` apontando
pro mesmo banco do Vercel (ou outro banco Postgres de teste).
