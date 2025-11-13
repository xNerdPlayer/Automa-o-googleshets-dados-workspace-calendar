/**
 * Grupo PI
 * 
 *
 *
 * Versão 3.2 - Ajustes finais no relatório de técnicos.
 * ultimo dia att. 2025-11-12
 */

// ====================================================================================
// CONFIGURAÇÕES
// .
// ====================================================================================
const CONFIG = {
  CALENDARIOS: {
    ATENDIMENTO: 'ID DA AGENDA ATENDIMENTO',
    VENDAS: 'ID DA AGENDA DE VENDAS'
  },
  PLANILHAS: {
    FECHAMENTO: 'Fechamento',
    VENDAS: 'Vendas',
    RESUMO: 'Resumo',
    OBRA: 'Obra',
    SERVICOS_AVULSOS: 'Serviços Avulsos',
    CONTROLE_CONTRATOS: 'Controle de Contratos',
    CONTROLE_TECNICOS: 'Controle de Técnicos',
    LOGS: 'LOGS'
  },
  LISTAS: {
    TECNICOS: ["Luiz", "Carlos", "Eduardo", "Leo", "Jeferson", "Israel", "Clauser"],
    EMPRESAS_CONTRATO: ["EMPRESAS", "EMPRESAS", "EMPRESAS", "EMPRESAS", "EMPRESAS", "EMPRESAS", "EMPRESAS", "EMPRESAS", "EMPRESAS", "EMPRESAS", "EMPRESAS", "EMPRESAS", "EMPRESAS", "EMPRESAS", "EMPRESAS", "EMPRESAS", "REMPRESAS", "EMPRESAS", "EMPRESAS", "EMPRESAS"]
  },
  VENDAS: {
    TAXA_CONVERSAO_HORA: 100, // R$ 100 por hora
    REGEX: {
      VENDA: /VALOR\s+DE\s+VENDA\s+R\$\s*([\d\.,]+)/i,
      CUSTO: /VALOR\s+DE\s+CUSTO\s+R\$\s*([\d\.,]+)/i,
      MARGEM: /VALOR\s+DE\s+MARGEM\s+R\$\s*([\d\.,]+)/i
    }
  }
};

// ====================================================================================
// FUNÇÕES PRINCIPAIS (ORQUESTRADORES)
// ====================================================================================

/**
 * Função mestre para executar todas as tarefas de geração de relatório em ordem.
 */
function gerarTodosRelatorios() {
  const ui = SpreadsheetApp.getUi();
  try {
    ui.alert('Iniciando a geração de relatórios. Este processo pode levar alguns minutos. Por favor, aguarde.');
    exportarEventosAtendimento();
    processarEventosVendas();
    gerarDashboards();
    ui.alert('Relatórios gerados com sucesso!');
  } catch (e) {
    Logger.log(`Erro fatal na execução: ${e.toString()}\n${e.stack}`);
    ui.alert(`Ocorreu um erro: ${e.message}. Verifique os logs para mais detalhes.`);
  }
}


/**
 * FUNÇÃO 1: Exporta os eventos de Atendimento Técnico para a aba 'Fechamento'.
 */
function exportarEventosAtendimento() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const calendario = CalendarApp.getCalendarById(CONFIG.CALENDARIOS.ATENDIMENTO);
  
  if (!calendario) {
    throw new Error(`Calendário de Atendimento não encontrado. Verifique o ID: ${CONFIG.CALENDARIOS.ATENDIMENTO}`);
  }

  const [primeiroDia, ultimoDia] = _getIntervaloMesAtual();
  const eventos = calendario.getEvents(primeiroDia, ultimoDia);

  const dados = [['Data', 'Título', 'Descrição', 'Localização']];
  eventos.forEach(evento => {
    dados.push([
      evento.getStartTime(),
      evento.getTitle(),
      evento.getDescription(),
      evento.getLocation()
    ]);
  });

  const abaFechamento = _obterOuCriarAba(planilha, CONFIG.PLANILHAS.FECHAMENTO);
  abaFechamento.clear();
  if (dados.length > 1) {
      abaFechamento.getRange(1, 1, dados.length, dados[0].length).setValues(dados);
      abaFechamento.autoResizeColumns(1, dados[0].length);
  }
  _registrarLog(`Total de Eventos de Atendimento Processados: ${eventos.length}`);
}


/**
 * FUNÇÃO 2: Processa a agenda de Vendas, calcula margens e gera o relatório na aba 'Vendas'.
 */
function processarEventosVendas() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const abaVendas = _obterOuCriarAba(planilha, CONFIG.PLANILHAS.VENDAS);
  abaVendas.clear();

  const headers = ['Data', 'Empresa', 'Técnico', 'Valor de Venda (R$)', 'Valor de Custo (R$)', 'Valor de Margem (R$)'];
  abaVendas.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');

  const calendarioVendas = CalendarApp.getCalendarById(CONFIG.CALENDARIOS.VENDAS);
  if (!calendarioVendas) {
    throw new Error(`Calendário de Vendas não encontrado. Verifique o ID: ${CONFIG.CALENDARIOS.VENDAS}`);
  }

  const [primeiroDia, ultimoDia] = _getIntervaloMesAtual();
  const eventos = calendarioVendas.getEvents(primeiroDia, ultimoDia);

  const dadosVendas = [];
  const totaisPorTecnico = CONFIG.LISTAS.TECNICOS.reduce((acc, tecnico) => {
    acc[tecnico] = { venda: 0, custo: 0, margem: 0 };
    return acc;
  }, {});

  eventos.forEach(evento => {
    const titulo = evento.getTitle() || '';
    const descricao = evento.getDescription() || '';
    const textoCompleto = `${titulo} ${descricao}`;

    let venda = _extrairValor(textoCompleto, CONFIG.VENDAS.REGEX.VENDA);
    let custo = _extrairValor(textoCompleto, CONFIG.VENDAS.REGEX.CUSTO);
    let margem = _extrairValor(textoCompleto, CONFIG.VENDAS.REGEX.MARGEM);

    if (margem === 0 && venda > 0 && custo > 0) {
      margem = venda - custo;
    }

    if (venda > 0 || custo > 0 || margem > 0) {
      const partesTitulo = titulo.split(/\s*-\s*/);
      const empresa = partesTitulo[0]?.trim() || '';
      const tecnicoNome = partesTitulo[2]?.trim() || '';
      
      dadosVendas.push([evento.getStartTime(), empresa, tecnicoNome, venda, custo, margem]);
      
      const nomeCanonico = CONFIG.LISTAS.TECNICOS.find(t => t.toLowerCase() === tecnicoNome.toLowerCase());
      if (nomeCanonico) {
        totaisPorTecnico[nomeCanonico].venda += venda;
        totaisPorTecnico[nomeCanonico].custo += custo;
        totaisPorTecnico[nomeCanonico].margem += margem;
      }
    }
  });

  if (dadosVendas.length > 0) {
    abaVendas.getRange(2, 1, dadosVendas.length, headers.length).setValues(dadosVendas);
    abaVendas.getRange(2, 4, dadosVendas.length, 3).setNumberFormat('"R$" #,##0.00');
  } else {
    abaVendas.getRange(2, 1).setValue("Nenhum evento com dados financeiros encontrado para o período.");
  }
  
  _criarResumosVendas(abaVendas, dadosVendas, totaisPorTecnico);
  
  abaVendas.autoResizeColumns(1, headers.length);
  abaVendas.autoResizeColumns(8, 5);
}


/**
 * FUNÇÃO 3: Gera os dashboards de Resumo, Obra, Contratos e Técnicos a partir da aba 'Fechamento'.
 */
function gerarDashboards() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const abaFechamento = planilha.getSheetByName(CONFIG.PLANILHAS.FECHAMENTO);

  if (!abaFechamento || abaFechamento.getLastRow() < 2) {
    throw new Error('A aba "Fechamento" está vazia ou não existe. Execute "exportarEventosAtendimento" primeiro.');
  }

  const dadosFechamento = abaFechamento.getRange(2, 1, abaFechamento.getLastRow() - 1, 4).getValues();
  
  const relatorios = {
    resumo: [],
    obra: [],
    servicosAvulsos: [],
    statsContratos: {},
    statsTecnicos: {},
    statsGerais: { obra: { total: 0, minutos: 0 }, avulso: { total: 0, minutos: 0 } }
  };

  const empresasContratoSet = new Set(CONFIG.LISTAS.EMPRESAS_CONTRATO.map(e => e.toLowerCase()));

  dadosFechamento.forEach(linha => {
    const [dataEvento, info, descricao] = linha;
    const infoStr = String(info);
    
    const partes = infoStr.split(/\s*-\s*/);
    const nomeEmpresa = (partes[0] || '').replace(/\s*\(.*?\)\s*/g, '').trim();
    const tempoStr = partes[1] || '0:0';
    const tecnico = partes[2] || 'Não especificado';
    const resumoAtendimento = partes[3] || '';
    const minutos = _parseDuracaoEmMinutos(tempoStr);

    relatorios.resumo.push([dataEvento, nomeEmpresa, tempoStr, tecnico, resumoAtendimento]);

    if (resumoAtendimento.toLowerCase().includes('obra') || infoStr.toLowerCase().includes('obra')) {
      relatorios.obra.push([dataEvento, resumoAtendimento, descricao, tecnico, tempoStr]);
      relatorios.statsGerais.obra.total++;
      relatorios.statsGerais.obra.minutos += minutos;
    }

    if (infoStr.toLowerCase().includes('avulso')) {
      relatorios.servicosAvulsos.push([nomeEmpresa, descricao, tecnico, tempoStr]);
      relatorios.statsGerais.avulso.total++;
      relatorios.statsGerais.avulso.minutos += minutos;
    }

    const nomeEmpresaLower = nomeEmpresa.toLowerCase();
    if (empresasContratoSet.has(nomeEmpresaLower)) {
      if (!relatorios.statsContratos[nomeEmpresaLower]) relatorios.statsContratos[nomeEmpresaLower] = { ocorrencias: 0, minutos: 0 };
      relatorios.statsContratos[nomeEmpresaLower].ocorrencias++;
      relatorios.statsContratos[nomeEmpresaLower].minutos += minutos;
    }

    const nomeTecnicoLower = tecnico.toLowerCase();
    const nomeCanonico = CONFIG.LISTAS.TECNICOS.find(t => t.toLowerCase() === nomeTecnicoLower);
    if (nomeCanonico) {
      if (!relatorios.statsTecnicos[nomeCanonico]) relatorios.statsTecnicos[nomeCanonico] = { ocorrencias: 0, minutos: 0 };
      relatorios.statsTecnicos[nomeCanonico].ocorrencias++;
      relatorios.statsTecnicos[nomeCanonico].minutos += minutos;
    }
  });

  _criarRelatorioSimples(planilha, CONFIG.PLANILHAS.RESUMO, ['Data', 'Nome da Empresa', 'Tempo', 'Técnico', 'Resumo'], relatorios.resumo);
  _criarRelatorioSimples(planilha, CONFIG.PLANILHAS.OBRA, ['Data', 'Projeto/Obra', 'Descrição', 'Técnico', 'Tempo'], relatorios.obra);
  _criarRelatorioSimples(planilha, CONFIG.PLANILHAS.SERVICOS_AVULSOS, ['Cliente', 'Descrição', 'Técnico', 'Tempo'], relatorios.servicosAvulsos);
  
  _criarRelatorioContratos(planilha, relatorios.statsContratos, relatorios.statsGerais);
  _criarRelatorioTecnicos(planilha, relatorios.statsTecnicos);
  
  _registrarLog('Dashboards gerados com sucesso.');
}

// ====================================================================================
// FUNÇÕES AUXILIARES DE PROCESSAMENTO (prefixadas com _)
// ====================================================================================

/**
 * Cria os resumos (Geral e por Técnico) na aba de Vendas.
 */
function _criarResumosVendas(abaVendas, dadosVendas, totaisPorTecnico) {
  const totaisGerais = dadosVendas.reduce((acc, row) => {
    acc.venda += row[3];
    acc.custo += row[4];
    acc.margem += row[5];
    return acc;
  }, { venda: 0, custo: 0, margem: 0 });

  const proximaLinha = abaVendas.getLastRow() + 2;
  const resumoGeralData = [
    ['Total Geral Vendas:', totaisGerais.venda],
    ['Total Geral Custos:', totaisGerais.custo],
    ['Total Geral Margem:', totaisGerais.margem]
  ];
  const rangeTotais = abaVendas.getRange(proximaLinha, 4, 3, 2);
  rangeTotais.setValues(resumoGeralData).setFontWeight('bold');
  abaVendas.getRange(proximaLinha, 5, 3, 1).setNumberFormat('"R$" #,##0.00');
  
  const dadosResumoTecnico = [['Técnico', 'Total Venda (R$)', 'Total Custo (R$)', 'Total Margem (R$)', 'Horas Convertidas']];
  const tecnicosArray = Object.keys(totaisPorTecnico).map(nomeTecnico => {
    const totais = totaisPorTecnico[nomeTecnico];
    const horasDecimais = totais.margem / CONFIG.VENDAS.TAXA_CONVERSAO_HORA;
    const minutosTotais = Math.round(horasDecimais * 60);
    const tempoFormatado = _formatarDuracaoEmHorasMinutos(minutosTotais);
    
    return [nomeTecnico, totais.venda, totais.custo, totais.margem, tempoFormatado];
  });

  tecnicosArray.sort((a, b) => b[3] - a[3]); // Ordena pela margem (índice 3)
  const dadosFinais = dadosResumoTecnico.concat(tecnicosArray);

  if (dadosFinais.length > 1) {
    const rangeResumo = abaVendas.getRange(1, 8, dadosFinais.length, 5);
    rangeResumo.setValues(dadosFinais);
    rangeResumo.offset(0, 0, 1, 5).setFontWeight('bold');
    rangeResumo.offset(1, 1, dadosFinais.length - 1, 3).setNumberFormat('"R$" #,##0.00');
    rangeResumo.offset(1, 4, dadosFinais.length - 1, 1).setHorizontalAlignment('center');
  }

  _registrarLog(`Vendas Processadas - Venda: ${totaisGerais.venda.toFixed(2)}, Custo: ${totaisGerais.custo.toFixed(2)}, Margem: ${totaisGerais.margem.toFixed(2)}`);
}

/**
 * Cria e preenche a aba de Controle de Contratos.
 */
function _criarRelatorioContratos(planilha, statsContratos, statsGerais) {
  const headers = ['Nome da Empresa', 'Nº de Ocorrências', 'Total de Horas'];
  
  const dados = CONFIG.LISTAS.EMPRESAS_CONTRATO.map(empresa => {
    const stats = statsContratos[empresa.toLowerCase()] || { ocorrencias: 0, minutos: 0 };
    return [empresa, stats.ocorrencias, _formatarDuracaoEmHorasMinutos(stats.minutos)];
  });

  dados.push(['Avulsos', statsGerais.avulso.total, _formatarDuracaoEmHorasMinutos(statsGerais.avulso.minutos)]);
  dados.push(['Obra', statsGerais.obra.total, _formatarDuracaoEmHorasMinutos(statsGerais.obra.minutos)]);
  
  const aba = _obterOuCriarAba(planilha, CONFIG.PLANILHAS.CONTROLE_CONTRATOS);
  aba.clear();
  aba.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  const rangeDados = aba.getRange(2, 1, dados.length, headers.length);
  rangeDados.setValues(dados);
  rangeDados.sort({ column: 3, ascending: false }); // Ordena por Total de Horas
  aba.autoResizeColumns(1, headers.length);
}

/**
 * Cria e preenche a aba de Controle de Técnicos.
 */
function _criarRelatorioTecnicos(planilha, statsTecnicos) {
  const headers = ['Nome do Técnico', 'Nº de Ocorrências', 'Total de Horas'];
  
  const valoresTecnicos = {
    "luiz": "110",
    "eduardo": "110",
    "carlos": "110",
    "jeferson": "110",
    "leo": "145",
    "israel": "118"
  };

  const dados = CONFIG.LISTAS.TECNICOS.map(tecnico => {
    const stats = statsTecnicos[tecnico] || { ocorrencias: 0, minutos: 0 };
    
    let nomeExibido = tecnico;
    const valor = valoresTecnicos[tecnico.toLowerCase()];
    if (valor) {
        nomeExibido = `${tecnico} ${valor}`;
    }
    
    return [nomeExibido, stats.ocorrencias, _formatarDuracaoEmHorasMinutos(stats.minutos)];
  });

  const aba = _obterOuCriarAba(planilha, CONFIG.PLANILHAS.CONTROLE_TECNICOS);
  aba.clear();
  aba.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  const rangeDados = aba.getRange(2, 1, dados.length, headers.length);
  rangeDados.setValues(dados);
  rangeDados.sort({ column: 3, ascending: false }); // Ordena por Total de Horas
  aba.autoResizeColumns(1, headers.length);
}

/**
 * Função genérica para criar relatórios simples com cabeçalho e dados.
 */
function _criarRelatorioSimples(planilha, nomeAba, headers, dados) {
  const aba = _obterOuCriarAba(planilha, nomeAba);
  aba.clear();
  aba.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  if (dados.length > 0) {
    aba.getRange(2, 1, dados.length, headers.length).setValues(dados);
  }
  aba.autoResizeColumns(1, headers.length);
}


// ====================================================================================
// FUNÇÕES UTILITÁRIAS 
// ====================================================================================

/**
 * Obtém uma aba pelo nome ou a cria se não existir.
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} planilha A planilha ativa.
 * @param {string} nomeAba O nome da aba desejada.
 * @return {GoogleAppsScript.Spreadsheet.Sheet} A aba encontrada ou criada.
 */
function _obterOuCriarAba(planilha, nomeAba) {
  return planilha.getSheetByName(nomeAba) || planilha.insertSheet(nomeAba);
}

/**
 * Retorna o primeiro e o último dia do mês atual para busca no calendário.
 * @return {Array<Date>} Um array com [primeiroDia, ultimoDia].
 */
function _getIntervaloMesAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 1);
  return [primeiroDia, ultimoDia];
}

/**
 * Extrai um valor monetário de um texto usando uma expressão regular.
 * @param {string} texto O texto de onde o valor será extraído.
 * @param {RegExp} regex A expressão regular para encontrar o valor.
 * @return {number} O valor numérico encontrado ou 0.
 */
function _extrairValor(texto, regex) {
  const match = texto.match(regex);
  if (match && match[1]) {
    const valorString = match[1].replace(/\./g, '').replace(',', '.');
    return parseFloat(valorString) || 0;
  }
  return 0;
}

/**
 * Converte uma string de duração "HH:mm" para o total de minutos.
 * @param {string} tempoStr A string de tempo.
 * @return {number} O total de minutos.
 */
function _parseDuracaoEmMinutos(tempoStr) {
  if (!tempoStr || typeof tempoStr !== 'string') return 0;
  const partes = tempoStr.split(':');
  const horas = parseInt(partes[0], 10) || 0;
  const minutos = parseInt(partes[1], 10) || 0;
  return (horas * 60) + minutos;
}

/**
 * Formata um total de minutos para o formato "HH:mm".
 * @param {number} totalMinutos O total de minutos.
 * @return {string} A duração formatada.
 */
function _formatarDuracaoEmHorasMinutos(totalMinutos) {
  if (!totalMinutos || totalMinutos < 0) return '00:00';
  const horas = Math.floor(totalMinutos / 60);
  const minutos = Math.round(totalMinutos % 60);
  const horasStr = String(horas).padStart(2, '0');
  const minutosStr = String(minutos).padStart(2, '0');
  return `${horasStr}:${minutosStr}`;
}

/**
 * Registra uma mensagem na aba de LOGS e no Logger do Apps Script.
 * @param {string} mensagem A mensagem a ser registrada.
 */
function _registrarLog(mensagem) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const logsSheet = _obterOuCriarAba(planilha, CONFIG.PLANILHAS.LOGS);
  logsSheet.appendRow([new Date(), mensagem]);
  Logger.log(mensagem);
}