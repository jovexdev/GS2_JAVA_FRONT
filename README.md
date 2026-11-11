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
- GeoRadar com busca pelo nome e UF dos municípios brasileiros, limite municipal do IBGE, preenchimento por classificação AEGIS, indicadores e gráficos do InfoDengue.
- LIA conectada à rota Java que usa a OpenAI. Se a chave estiver ausente ou inválida, a interface exibe a falha retornada pelo serviço.

O agendamento usa dois campos: **data em DD/MM/AAAA** e **hora em HH:MM**. O backend valida a data futura e a disponibilidade da equipe no horário de São Paulo.

O mapa colore o território municipal e não representa a localização individual dos relatos. Os dados epidemiológicos exibidos correspondem ao ano escolhido; a previsão é a estimativa acadêmica que já existe no backend. Mapa e dados externos dependem de conexão à internet.

## GeoRadar por município

Digite o nome do município, com ou sem acento, e escolha o resultado com a UF correta. A seleção atualiza automaticamente o mapa, os casos, o gráfico e a previsão. O código oficial é resolvido internamente; o usuário não precisa digitá-lo. O ano dos dados também pode ser alterado.

O mapa usa Leaflet e contornos oficiais da API de malhas do IBGE. O zoom se ajusta ao limite selecionado, o contorno fica azul e o preenchimento segue a classificação AEGIS. Clique no território para consultar o resumo ou use **Centralizar** para reenquadrá-lo.

A métrica acadêmica usa os **casos notificados da última semana disponível no ano selecionado**:

| Classificação AEGIS | Casos na semana                      | Cor      |
| ------------------- | ------------------------------------ | -------- |
| OK                  | 0 a 99                               | Verde    |
| Instável            | 100 a 299                            | Amarelo  |
| Crítico             | 300 ou mais                          | Vermelho |
| Sem dados           | Ausência de casos válidos no período | Cinza    |

Os limites estão em `LIMITES_AEGIS`, no arquivo `src/georadar.js`. A legenda é calculada a partir desses mesmos valores. São limites de demonstração do protótipo e não representam uma classificação epidemiológica oficial. O alerta original do InfoDengue permanece identificado separadamente, com link para a fonte. Zero casos é diferente de ausência de informação.

A interface mostra a semana e o ano de referência. Ao trocar de cidade, respostas antigas são descartadas e a cor anterior é removida até a consulta terminar. Se não houver indicadores ou a API falhar, o limite municipal continua disponível, em cinza. Busca, contorno e mapa base dependem dos serviços externos; uma falha tem mensagem e opção de tentar novamente.

Fontes: [municípios do IBGE](https://servicodados.ibge.gov.br/api/docs/localidades), [malhas simplificadas do IBGE](https://servicodados.ibge.gov.br/api/docs/malhas?versao=3), [indicadores do InfoDengue](https://info.dengue.mat.br/services/api), [metodologia do alerta original](https://info.dengue.mat.br/informacoes/) e [Leaflet](https://leafletjs.com/reference-1.9.4.html).

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

Os testes verificam as faixas de classificação, busca sem acentos e com UF, contornos GeoJSON e escolha da última semana disponível, além do contrato de login, o encerramento de sessão ao escolher um perfil incorreto, mensagens de erro e conversão da data/hora. A compilação gera a pasta `dist`. O preview local usa **http://127.0.0.1:4173**, com o mesmo encaminhamento de API.

Para atualizar depois de novas alterações:

```powershell
git pull --ff-only
npm install
npm run dev
```

## Organização

`src/pages` contém as telas; `src/components`, os componentes comuns; `src/api.js`, a comunicação HTTP; `src/auth.jsx`, a sessão; e `src/styles.css`, o tema com Tailwind. O `package-lock.json` fixa as versões instaladas.

A documentação das ferramentas está em [React](https://react.dev/learn/build-a-react-app-from-scratch), [Vite](https://vite.dev/guide/) e [Tailwind com Vite](https://tailwindcss.com/docs/installation/using-vite).

## Minha saúde — área do cidadão

Entre como **Cidadão** e abra **Minha saúde** no menu. Esta aba reúne:

- Questionário escrito para a LIA organizar sintomas e orientar a procura de atendimento, sem confirmar ou descartar dengue.
- Identificação inicial de sinais de alarme: a orientação para buscar urgência aparece imediatamente, sem esperar pelo GPT.
- Busca pelo nome e UF do município, com filtro por bairro ou nome da unidade.
- UPAs e pronto atendimento SUS ativos no CNES, apresentados em mapa e lista, com endereço, telefone e horário cadastrado quando disponíveis.
- Localização opcional para ordenar por distância em linha reta, com trajetos de carro ou a pé abertos no Google Maps.

As rotas novas são `GET /api/cidadao/unidades-saude` e `POST /api/cidadao/orientacao`, ambas autenticadas e exclusivas do cidadão. Execute o **AegisApplication** atualizado no IntelliJ e o frontend no VS Code. Não é necessário rodar outro SQL ou instalar dependências novas.

O CNES e os links de mapas não exigem chave paga ou faturamento. O questionário pede autorização antes de enviar as respostas à OpenAI e usa os créditos da chave GPT já configurada no Java. As respostas não são gravadas no banco do AEGIS. Se a IA estiver indisponível, a tela informa isso e exibe uma orientação de referência.

A localização não é enviada ao Java ou ao GPT; fica no navegador e entra no link de navegação somente ao abrir uma rota. Você pode usar apenas município e bairro. O AEGIS não calcula tempo de trajeto nem filas, e os dados cadastrais do CNES não confirmam atendimento em tempo real. Unidades sem coordenadas continuam disponíveis na lista, com rota baseada no endereço.

A implementação está em `src/pages/MinhaSaude.jsx`, `src/components/UnidadesSaudeMap.jsx` e `src/saude.js`. Os testes em `tests/saude.test.js` verificam busca sem acentos, distância e geração do link sem credenciais ou respostas de saúde.
