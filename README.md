# Automa-o-googleshets-dados-workspace-calendar
🤖 Apps Script: Automação de Relatórios Financeiros e Técnicos
✨ Visão Geral do Projeto
Este projeto utiliza o Google Apps Script (GAS) para automatizar a coleta, processamento e geração de relatórios de dados de Atendimento Técnico e Vendas diretamente a partir dos calendários Google (Google Calendar) para um Google Sheet centralizado.

O objetivo é transformar eventos agendados (com informações financeiras e de tempo) em dashboards estruturados, eliminando a necessidade de entrada manual de dados e fornecendo um resumo em tempo real da performance técnica e da margem de vendas.

🚀 Funcionalidades Principais
O script orquestra a execução de três funções mestras:

📊 exportarEventosAtendimento():

Coleta eventos do calendário de Atendimento Técnico.

Exporta dados brutos (Data, Título, Descrição) para a aba Fechamento da planilha.

💰 processarEventosVendas():

Coleta eventos do calendário de Vendas.

Extrai Valores: Usa expressões regulares (Regex) na descrição do evento para extrair VALOR DE VENDA, CUSTO e MARGEM.

Gera um relatório detalhado e um Resumo de Vendas por Técnico na aba Vendas.

📈 gerarDashboards():

Processa os dados de Atendimento para criar relatórios estratégicos:

Controle de Contratos: Total de horas e ocorrências por cliente de contrato.

Controle de Técnicos: Ocorrências e horas trabalhadas por técnico.

Resumo de Obras/Avulsos: Separação e totalização dos serviços por categoria.

⚙️ Configuração e Instalação
Para que este script funcione, ele deve ser vinculado a uma Planilha Google e configurado corretamente.

1. Preparação da Planilha
Crie uma nova Planilha Google (ou use a planilha de destino).

No menu superior, vá em Extensões > Apps Script. Uma nova guia será aberta com o editor de código.

Copie e cole todo o código (.gs) do projeto no arquivo Código.gs (ou crie um novo arquivo .gs).

2. Configuração dos IDs (Variável CONFIG)
Você deve atualizar o bloco CONFIG no início do script com os IDs dos seus calendários e os nomes exatos das suas abas:

ℹ️ Como encontrar o ID do Calendário? No Google Calendar, vá em Configurações e Compartilhamento do calendário desejado. O ID estará listado na seção "Integrar agenda".

3. Execução e Autorização
No editor do Apps Script, selecione a função gerarTodosRelatorios no menu suspenso.

Clique no botão ▶️ Executar.

Autorização: Na primeira execução, o Google solicitará permissões para:

Acessar e editar suas Planilhas Google.

Ver e editar eventos nos calendários que você especificou.

Clique em Revisar permissões e Permitir.

4. Automatização (Gatilhos)
Para que os relatórios sejam atualizados automaticamente (por exemplo, todo mês):

No editor do Apps Script, clique no ícone de Relógio (Gatilhos ou Triggers) na barra lateral.

Clique em Adicionar Gatilho.

Configure:

Função a ser executada: gerarTodosRelatorios

Fonte do evento: Baseado em tempo

Tipo de gatilho de tempo: Mês (ou Dia, conforme sua preferência).

Selecione o dia/hora desejado para a execução.

💡 Estrutura de Dados (Calendário)
Para que o script de Vendas funcione corretamente, os eventos no calendário de Vendas devem seguir a seguinte convenção de texto na Descrição:

O script usa uma expressão regular robusta (REGEX) para localizar esses padrões e extrair os valores.

💻 Contribuição
BRUNO ALAN BEZERRA DA CRUZ
CARLOS DOS SANTOS PIMENTEL
LUIZ FERNANDO SALES LEMOS
NELSON ALEJANDRO HERRERA GOMEZ
SANDRA DA CONCEICAO NASCIMENTO
TARIK RIBEIRO CONSTANCIO CAMPESTRINI

Este projeto é um boilerplate de automação e pode ser expandido para incluir mais fontes de dados ou relatórios. Sugestões e Pull Requests são bem-vindos!

Faça um fork do projeto.

Crie sua branch de feature (git checkout -b feature/minha-feature).

Garanta que as alterações de Apps Script estejam na sua branch.

Abra um Pull Request.
