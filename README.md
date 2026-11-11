# AEGIS — Frontend

Interface local do AEGIS, desenvolvida em **React, Tailwind CSS e Node.js com Vite**. Conecta-se ao backend Java do repositório [GS2_JAVA](https://github.com/jovexdev/GS2_JAVA). A logo original enviada para o projeto está em `public/aegis-original.png`.

## 1. Preparar o backend no IntelliJ

1. Atualize o backend com `git pull --ff-only`.
2. Configure seu usuário Oracle em `ConexaoFactory.java` e a chave da OpenAI em `OpenAiService.java`, na sua cópia local.
3. Em uma base nova, execute `database/01_schema.sql` uma vez no SQL Developer. Para usar as contas de teste abaixo, execute também a carga opcional `database/DadosFicticios.sql`. Não execute a carga novamente se ela já estiver instalada.
4. Execute o `main()` de **`br.com.fiap.AegisApplication`** pelo IntelliJ e mantenha a aplicação aberta. A API deve estar em **http://127.0.0.1:8080/api/saude**.

Para o frontend, use `AegisApplication`. O `AegisTerminal` também abre a API, mas escolhe uma porta livre; nesse caso, configure a porta exibida no arquivo `.env` do frontend, conforme a seção abaixo.

## 2. Clonar e abrir no VS Code

Instale o Git e o **Node.js 24 LTS** pelo [site oficial](https://nodejs.org/). O projeto exige Node.js a partir de 22.12.

Abra um terminal na pasta onde deseja salvar o projeto:

```powershell
git clone https://github.com/jovexdev/GS2_JAVA_FRONT.git
cd GS2_JAVA_FRONT
code .
```

Se `code` não estiver disponível, abra o VS Code e use **Arquivo > Abrir Pasta > GS2_JAVA_FRONT**. O repositório é privado; use sua conta autorizada do GitHub quando o Git solicitar acesso.

No terminal integrado do VS Code:

```powershell
npm install
npm run dev
```

Abra **http://127.0.0.1:5173**. No PowerShell, se houver bloqueio do arquivo `npm.ps1`, use `npm.cmd install` e `npm.cmd run dev`.

A página inicial permite escolher Gestor, Agente, Cidadão ou Empresa. Clique em uma conta de teste para preencher o e-mail e a senha, depois clique em **Entrar**. As contas são autenticadas pelo backend e precisam existir no Oracle. Não há login simulado nem dados de atendimento inventados no frontend.

## Contas de demonstração

Todas usam a senha **`AegisDemo2026`**.

| Perfil       | E-mail                         |
| ------------ | ------------------------------ |
| Gestor       | `gestor@demo.aegis.test`       |
| Agente Norte | `agente.norte@demo.aegis.test` |
| Agente Sul   | `agente.sul@demo.aegis.test`   |
| Cidadão      | `cidadao@demo.aegis.test`      |
| Empresa      | `empresa@demo.aegis.test`      |

Novos cidadãos e empresas podem se cadastrar pela interface. A criação dos perfis administrativos continua no terminal Java, com autorização do gestor, conforme as regras existentes do backend.

## O que está conectado

- Login, restauração da sessão e saída, com cookie de sessão do Java.
- Cadastro público de cidadão e empresa.
- Painel de cada perfil, com números calculados a partir dos registros retornados pela API.
- Registro, consulta, edição e exclusão de ocorrências sem atendimento vinculado.
- Empresa com edição do estabelecimento, classificação preliminar e solicitação de vistoria.
- Gestor com análise dos relatos, revisão de prioridade, designação individual de agente, agendamento e encerramento administrativo.
- Agente com atendimentos atribuídos, localização, início, inspeção, recomendações e conclusão.
- Histórico e resultados autorizados para o solicitante.
- GeoRadar do município piloto de São Paulo, com indicadores e gráfico do InfoDengue, mapa base OpenStreetMap e acesso ao mapa epidemiológico oficial.
- LIA conectada à rota Java que usa a OpenAI. Se a chave estiver ausente ou inválida, a interface exibe a falha retornada pelo serviço.

O agendamento usa dois campos: **data em DD/MM/AAAA** e **hora em HH:MM**. O backend valida a data futura e a disponibilidade da equipe no horário de São Paulo.

O mapa base não representa a localização individual dos relatos. Os dados epidemiológicos exibidos correspondem ao ano escolhido; a previsão é a estimativa acadêmica que já existe no backend. Mapa e dados externos dependem de conexão à internet.

## Conexão local

O frontend já aponta para a API em `http://127.0.0.1:8080`. O Vite encaminha as chamadas de `/api` para o Java, incluindo o cookie da sessão. Isso permite trabalhar localmente sem alterar CORS no backend.

Se a API usar outra porta, copie o arquivo de exemplo:

```powershell
Copy-Item .env.example .env
```

Altere somente `API_TARGET` no `.env`, por exemplo `API_TARGET=http://127.0.0.1:8090`, e reinicie `npm run dev`. Esse ajuste é opcional; não precisa dele com a porta padrão 8080.

A senha Oracle e a chave OpenAI ficam no Java. Não coloque essas credenciais em variáveis do frontend, código React ou arquivos publicados.

## Verificações

```powershell
npm test
npm run build
npm run preview
```

Os testes verificam o contrato de login, o encerramento de sessão ao escolher um perfil incorreto, mensagens de erro e conversão da data/hora. A compilação gera a pasta `dist`. O preview local usa **http://127.0.0.1:4173**, com o mesmo encaminhamento de API.

Para atualizar depois de novas alterações:

```powershell
git pull --ff-only
npm install
npm run dev
```

## Organização

`src/pages` contém as telas; `src/components`, os componentes comuns; `src/api.js`, a comunicação HTTP; `src/auth.jsx`, a sessão; e `src/styles.css`, o tema com Tailwind. O `package-lock.json` fixa as versões instaladas.

A documentação das ferramentas está em [React](https://react.dev/learn/build-a-react-app-from-scratch), [Vite](https://vite.dev/guide/) e [Tailwind com Vite](https://tailwindcss.com/docs/installation/using-vite).
