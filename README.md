# AEGIS | Frontend

O AEGIS é um projeto acadêmico da **Global Solution 2026.2 da FIAP** voltado à prevenção da dengue. A interface conecta cidadãos, empresas, gestores e agentes, desde o registro de um possível foco até a conclusão da vistoria.

O frontend usa **React, Vite, Tailwind CSS e Leaflet**. O login, os registros e as vistorias são processados pela API Java. [Repositório do backend](https://github.com/jovexdev/GS2_JAVA)

## Funcionalidades

- **Cidadão** — consulta casos por município no GeoRadar, registra e acompanha ocorrências e busca unidades de pronto atendimento do SUS na aba **Minha saúde**.
- **Empresa** — atualiza os dados do estabelecimento, registra condições ambientais, solicita vistoria e acompanha o atendimento.
- **Gestor** — analisa ocorrências, revisa prioridades, designa agentes e agenda ou encerra atendimentos.
- **Agente** — consulta suas vistorias, registra a inspeção e as recomendações e conclui o atendimento em campo.

## Como rodar localmente

### 1. Iniciar o backend

Siga as instruções do repositório Java para configurar o Oracle da FIAP. No IntelliJ, execute **`br.com.fiap.AegisApplication`** e deixe a API rodando na porta **8080**. Se quiser usar as contas de teste localmente, carregue `database/DadosFicticios.sql` seguindo o README do backend. [Instruções do backend](https://github.com/jovexdev/GS2_JAVA) · [Verificar a API local](http://127.0.0.1:8080/api/saude)

### 2. Clonar o frontend

Instale **Git**, **Node.js 22.12 ou superior** e **VS Code**. No PowerShell, execute:

```powershell
git clone https://github.com/jovexdev/GS2_JAVA_FRONT.git
cd GS2_JAVA_FRONT
code .
```

Se `code .` não estiver disponível, abra a pasta `GS2_JAVA_FRONT` pelo menu **Arquivo → Abrir Pasta** no VS Code.

### 3. Instalar e executar

No terminal integrado do VS Code, execute:

```powershell
npm.cmd ci
npm.cmd run dev
```

O frontend abre na porta **5173**. O Vite encaminha automaticamente as chamadas de `/api` para o Java na porta `8080`. [Abrir o AEGIS local](http://127.0.0.1:5173)

Se o Java estiver em outra porta, copie `.env.example` para `.env`, ajuste `API_TARGET` para o endereço da API e reinicie o Vite. Por exemplo, use `API_TARGET=http://127.0.0.1:8090` quando a API estiver na porta `8090`.

## Como testar os perfis

Na tela de login, vá até **Contas de teste**, selecione um perfil e clique em **Entrar**. O formulário preenche o e-mail e a senha. Para trocar de perfil, saia da conta e selecione outra. Na versão local, as contas vêm da carga `DadosFicticios.sql` do backend.

A versão publicada no **Render Free** carrega os dados fictícios automaticamente. Se o servidor estiver iniciando, a tela aguarda a API e continua o login. Cada perfil já tem dados para explorar. [Testar online](https://aegis-fiap.onrender.com/demo/entrar)

## Testar e gerar a versão de produção

```powershell
npm.cmd test
npm.cmd run build
```

A compilação gera os arquivos de produção na pasta `dist`.
