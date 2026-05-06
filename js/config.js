// ==========================================================
// GVC Analytics — Vendas | Configuração e Utilitários
// Arquivo: js/config.js
// Contém: constantes, estado global (AppState), funções
//          utilitárias, normalização e parsing de dados.
// ==========================================================
'use strict';

'use strict';
// ── CONSTANTS ────────────────────────────────────────────
const TODAY=new Date();
const CURRENT_MONTH=TODAY.getMonth()+1,CURRENT_YEAR=TODAY.getFullYear();
const DEFAULT_DATE_FROM=`${CURRENT_YEAR}-01-01`;
const DEFAULT_DATE_TO=`${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2,'0')}-${String(new Date(CURRENT_YEAR,CURRENT_MONTH,0).getDate()).padStart(2,'0')}`;
const MONTH_NAMES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const METAS_CONSULTOR={
  'MARIANE ALMEIDA':     {RSS:2000, Gerenciamento:22400,Consultoria:600, total:25000},
  'Jefferson Ferreira':  {RSS:20000,Gerenciamento:32000,Consultoria:3000,total:55000},
  'ELIS ADRIELE':        {RSS:9400, Gerenciamento:25000,Consultoria:600, total:35000},
  'Laila Nunes':         {RSS:18000,Gerenciamento:24000,Consultoria:3000,total:45000},
  'Luciane Cruz Santana':{RSS:7600, Gerenciamento:34400,Consultoria:3000,total:45000},
  'Jacqueline Bastos':   {RSS:18000,Gerenciamento:24000,Consultoria:3000,total:45000},
  'Daniel Leles':        {RSS:9400, Gerenciamento:25000,Consultoria:600, total:35000},
  'Ivson Cavalcanti':    {RSS:10000,Gerenciamento:20000,Consultoria:0,   total:30000}
};
const META_TIME_MES=335000;
const METAS_ORIGEM=[
  {origem:'Já é cliente',     pct:25,retec_sa:60000, retec_oeste:23750,total:83750 },
  {origem:'Prospecção',       pct:35,retec_sa:84000, retec_oeste:33250,total:117250},
  {origem:'Indicação Externa',pct:15,retec_sa:36000, retec_oeste:14250,total:50250 },
  {origem:'Indicação Interna',pct:5, retec_sa:12000, retec_oeste:4750, total:16750 },
  {origem:'Google',           pct:15,retec_sa:36000, retec_oeste:14250,total:50250 },
  {origem:'Licitação',        pct:5, retec_sa:12000, retec_oeste:4750, total:16750 }
];
const FUNIL_ORDER=['Novos Leads','Conexão','Agendamento','Reunião Agendada','Reunião','Negociação','Forcast','Forecast','Contrato','Fechamento'];
const EMPRESAS_PADRAO=['Retec Resíduos','Ultra Ambiental','Retec Oeste','CVR Oeste','CVR São Francisco','CVR Alto Sertão','RETEC','Eco Gestão'];
/* Bloom palette for series — grayscale whites with subtle accent tones */
const SELLER_COLORS=['#ffffff','#bcd6ff','#9effd4','#ffd79e','#d9c8ff','#ff9eb2','#a8e0d4','#f5c7b8'];

// ── APP STATE ────────────────────────────────────────────
const AppState={rawData:[],filteredData:[],filters:{dateFrom:DEFAULT_DATE_FROM,dateTo:DEFAULT_DATE_TO,empresa:[],consultor:''},currentTab:'consolidado',importMeta:null,charts:{}};

// ── UTILITIES ────────────────────────────────────────────
const fmt=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(v||0);
const fmtPct=v=>(+(v||0)).toFixed(1)+'%';
const fmtN=v=>new Intl.NumberFormat('pt-BR').format(v||0);
function pctColor(p){return p>=70?'var(--ok)':p>=40?'var(--warn)':'var(--bad)';}
function pctBadge(p){const c=p>=70?'bg':p>=40?'bo':'br';return `<span class="badge ${c}">${fmtPct(p)}</span>`;}
function gaugeColor(p){return p>=70?'#9effd4':p>=40?'#ffd79e':'#ff9eb2';}
function buildGaugeSVG(pct,sublabel,size){
  const c=Math.max(0,pct||0),disp=Math.min(100,c),col=gaugeColor(c);
  const sa=(disp/100)*Math.PI,r=78,cx=100,cy=100;
  const ea=Math.PI-sa,ex=cx+r*Math.cos(ea),ey=cy-r*Math.sin(ea),la=sa>Math.PI?1:0;
  return `<svg viewBox="-5 -12 210 140" overflow="visible" style="width:${size||'100%'};max-width:200px;display:block;margin:0 auto">
    <path d="M ${cx-r} ${cy} A ${r} ${r} 0 0 0 ${cx+r} ${cy}" fill="none" stroke="rgba(255,255,255,.10)" stroke-width="14" stroke-linecap="round"/>
    ${disp>0?`<path d="M ${cx-r} ${cy} A ${r} ${r} 0 ${la} 0 ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="${col}" stroke-width="14" stroke-linecap="round"/>`:''}
    <text x="${cx}" y="${cy-8}" text-anchor="middle" fill="#FFFFFF" font-family="Poppins,sans-serif" font-weight="500" font-size="30" letter-spacing="-1">${c.toFixed(1)}%</text>
    ${sublabel?`<text x="${cx}" y="${cy+12}" text-anchor="middle" fill="rgba(255,255,255,.7)" font-family="Poppins,sans-serif" font-size="9">${sublabel}</text>`:''}
  </svg>`;
}
function mapProduto(m){const u=(m||'').toUpperCase();if(u.includes('RSS'))return 'RSS';if(u.includes('CONSULTORIA'))return 'Consultoria';return 'Gerenciamento';}
function mapPorte(v){return (v||0)>5000?'LQ':'SQ';}
function isOeste(e){return (e||'').toLowerCase().includes('oeste');}
function stripAccents(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
function parseMoeda(v){
  if(v===null||v===undefined||v==='')return 0;
  if(typeof v==='number')return isNaN(v)?0:v;
  const s=String(v).replace(/R\$\s*/gi,'').trim();
  if(!s)return 0;
  if(s.includes(','))return parseFloat(s.replace(/\./g,'').replace(',','.'))||0;
  return parseFloat(s.replace(/[^\d.]/g,''))||0;
}
function parseDate(s){
  if(!s)return null;
  if(s instanceof Date)return isNaN(s)?null:s;
  if(typeof s==='number'){
    if(s<1||s>2958465)return null;
    const d=new Date(Math.round((s-25569)*86400*1000));
    return isNaN(d)?null:d;
  }
  const str=String(s).trim();if(!str)return null;
  if(/^\d{4}-\d{2}-\d{2}/.test(str))return new Date(str.substring(0,10)+'T00:00:00');
  const m=str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if(m)return new Date(`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}T00:00:00`);
  const d=new Date(str);return isNaN(d)?null:d;
}
function getMonthKey(d){if(!d||isNaN(d))return null;return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}
function monthsInRange(from7,to7){
  const r=[];let[y,m]=from7.split('-').map(Number);const[ty,tm]=to7.split('-').map(Number);
  while(y<ty||(y===ty&&m<=tm)){r.push(`${y}-${String(m).padStart(2,'0')}`);m++;if(m>12){m=1;y++;}}return r;
}
function getMetaTime(from,to){return META_TIME_MES*monthsInRange(from.substring(0,7),to.substring(0,7)).length;}
function noDataHtml(msg){return `<div style="text-align:center;padding:34px 20px;color:var(--text3);font-size:12.5px;letter-spacing:.01em">${msg||'Importe o arquivo Panorama CRM para visualizar os dados'}</div>`;}
function kpiCard(label,value,sub,colorClass,progPct){
  const prog=progPct!=null?`<div class="prog" style="margin-top:8px"><div class="prog-fill pf${colorClass||'c'}" style="width:${Math.min(100,Math.max(0,progPct||0))}%"></div></div>`:'';
  return `<div class="kpi${colorClass?' '+colorClass:''}"><div class="kpi-l">${label}</div><div class="kpi-v">${value}</div>${sub?`<div class="kpi-s">${sub}</div>`:''}${prog}</div>`;
}
function dc(id){const ex=Chart.getChart(id);if(ex)ex.destroy();}
function chartDefaults(){
  return {responsive:true,maintainAspectRatio:false,
    plugins:{legend:{labels:{color:'rgba(255,255,255,.82)',font:{family:'Poppins',size:11,weight:'500'}}}},
    scales:{x:{ticks:{color:'rgba(255,255,255,.55)',font:{family:'Poppins',size:10}},grid:{color:'rgba(255,255,255,.06)'}},
            y:{ticks:{color:'rgba(255,255,255,.55)',font:{family:'Poppins',size:10}},grid:{color:'rgba(255,255,255,.06)'}}}};
}
function alertaBadge(a,d){const cls=a==='OK'?'bg':a==='ATENCAO'?'bo':'br';return `<span class="badge ${cls}">${d}d · ${a}</span>`;}

// ── CONSULTANT NORMALIZATION ────────────────────────────
function matchConsultor(raw){
  if(!raw)return raw;
  const rn=stripAccents(String(raw));
  for(const key of Object.keys(METAS_CONSULTOR)){if(stripAccents(key)===rn)return key;}
  for(const key of Object.keys(METAS_CONSULTOR)){if(stripAccents(key).split(' ')[0]===rn.split(' ')[0])return key;}
  for(const key of Object.keys(METAS_CONSULTOR)){if(rn.includes(stripAccents(key).split(' ')[0])||stripAccents(key).includes(rn.split(' ')[0]))return key;}
  return raw;
}

function businessDaysLeft(){
  const endOfMonth=new Date(CURRENT_YEAR,CURRENT_MONTH,0);
  let count=0;
  const d=new Date(TODAY);d.setDate(d.getDate()+1);
  while(d<=endOfMonth){const dow=d.getDay();if(dow!==0&&dow!==6)count++;d.setDate(d.getDate()+1);}
  return count;
}

function normalizeRow(raw){
  if(!raw||typeof raw!=='object')return null;
  const cols=Object.keys(raw);
  function get(...keys){
    for(const k of keys){
      const needle=stripAccents(k);
      for(const rk of cols){
        if(stripAccents(rk)===needle&&raw[rk]!==''&&raw[rk]!=null)return raw[rk];
      }
    }
    for(const k of keys){
      const needle=stripAccents(k);
      const found=cols.find(rk=>stripAccents(rk).includes(needle)&&raw[rk]!==''&&raw[rk]!=null);
      if(found)return raw[found];
    }
    return '';
  }
  const rawSituacao=get('Situação','Situacao','Status do Negócio','Status','Fase','Estado','Situação do Negócio','Situacao do Negocio','Stage','Resultado');
  const sitU=(rawSituacao||'').toUpperCase().trim();
  let status='pipeline';
  if(sitU.includes('GANH')||sitU==='WON'||sitU==='CLOSED WON'||sitU==='GANHO')status='ganho';
  else if(sitU.includes('PERDID')||sitU==='LOST'||sitU==='CLOSED LOST'||sitU==='PERDIDO')status='perdido';
  const rawStageRaw=get('Estágio','Estagio','Etapa do Funil','Etapa do funil','Etapa','Stage','Fase do Funil','Pipeline Stage','Fase')||(status==='ganho'?'Fechamento':status==='perdido'?'Perdido':'Em aberto');
  const rawStage=(rawStageRaw==='Forcast'||rawStageRaw==='forcast')?'Forecast':rawStageRaw;
  const rawValor=get('Valor','Valor da Última venda','Valor da Ultima venda','Valor da última venda','Valor da Ultima Venda','Valor do Negócio','Valor do Negocio','Valor (R$)','Valor Total','Montante','Value','Amount','Deal Value','Receita');
  const valor=parseMoeda(rawValor);
  const rawProp=get('Valor da Proposta','Valor Proposta','Proposta','Valor Original','Proposta de Valor','Valor Estimado');
  const prop=rawProp?parseMoeda(rawProp):valor;
  const rawTermino=get('Data de Fechamento','Término','Termino','Data Fechamento','Data de Competência','Competência','Data Prevista de Fechamento','Data Prevista','Prazo','Close Date','Expected Close','Vencimento');
  const dd=parseDate(rawTermino);
  const rawUltAtual=get('Última atualização','Ultima atualizacao','Ultima Atualizacao','Last Update','Atualizado em');
  const dultAtual=parseDate(rawUltAtual);
  // AJUSTE V4 – usar sempre Término como referência de mês (não Última atualização)
  const ddFinal=dd&&!isNaN(dd)?dd:null;
  const dataStr=ddFinal&&!isNaN(ddFinal)?ddFinal.toISOString().substring(0,10):'';
  const monthKey=ddFinal&&!isNaN(ddFinal)?getMonthKey(ddFinal):'';
  const rawCriado=get('Data de criação','Data de Criação','Data Criação','Criado em','Criado Em','Início','Inicio','Abertura','Created At','Created','Data de Início');
  const dcriado=parseDate(rawCriado);
  const rawDiasEstagio=get('Dias no estágio','Dias no Estagio','Dias no estagio','Dias no Estágio');
  let dias=0;
  if(rawDiasEstagio!==''&&rawDiasEstagio!=null){
    const pd=parseInt(String(rawDiasEstagio).replace(/[^\d]/g,''));
    if(!isNaN(pd))dias=Math.max(0,pd);
    else if(dcriado&&!isNaN(dcriado))dias=Math.max(0,Math.floor((TODAY-dcriado)/(1000*60*60*24)));
  }else if(dcriado&&!isNaN(dcriado)){dias=Math.max(0,Math.floor((TODAY-dcriado)/(1000*60*60*24)));}
  else if(dd&&!isNaN(dd)&&status==='pipeline'){dias=Math.max(0,Math.floor((TODAY-dd)/(1000*60*60*24)));}
  const alerta=dias<=7?'OK':dias<=30?'ATENCAO':'CRITICO';
  const tipoVendaRaw=get('Tipo de Venda','Tipo Venda','TipoVenda');
  const modeloPropostaRaw=get('Modelo da Proposta','Modelo Proposta','Tipo de Proposta','modelo');
  const modelo=tipoVendaRaw||modeloPropostaRaw;
  let produto;
  if(tipoVendaRaw){produto=tipoVendaRaw;}
  else if(modeloPropostaRaw){produto=mapProduto(modeloPropostaRaw);}
  else{produto='Não informado';}
  const tituloRaw=get('Título','Titulo','Nome do Negócio','Nome','Deal Name','Title');
  const clienteRaw=get('Cliente','Empresa do Cliente','Empresa do Contato','Contato','Título','Titulo','Nome do Negócio','Nome','Deal Name','Contact','Account','Razão Social','Razao Social');
  const consultorRaw=get('Responsável','Responsavel','Responsável da Última venda','Responsável da Ultima venda','Responsavel da Ultima venda','Responsável da última venda','Responsável da Ultima Venda','Proprietário','Proprietario','Consultor','Owner','Vendedor','Atribuído a','Atribuido a','Criado por');
  const empresaRaw=get('Empresa Vendedora','Empresa do Vendedor','Vendedor Empresa','Empresa','Company','Organização','Organizacao','Equipe');
  const origemRaw=get('Origem','Source','Lead Source','Canal de Aquisição','Canal','Origem do Lead','Como nos Conheceu');
  const motivoPerdaRaw=get('Motivo de perda','Motivo de Perda','Motivo Perda','Lost Reason','Razão da Perda','Razao da Perda','Por que perdeu');
  const marcadoresRaw=get('Marcadores','Tags','Etiquetas','Labels','Label','Marcador');
  const statusAltRaw=get('Situação*','Situacao*','Situação Alternativa','Situacao Alternativa');
  const meioContatoRaw=get('Meio de contato','Meio de Contato','Meio Contato','Canal de Contato');
  const cidadeColetaRaw=get('Cidade da Coleta','Cidade Coleta','Cidade');
  const consultorNorm=matchConsultor(consultorRaw);
  return {
    titulo:tituloRaw,cliente:clienteRaw,consultor:consultorNorm,responsavel:consultorNorm,empresa:empresaRaw,empresaVendedora:empresaRaw,origem:origemRaw,motivoPerda:motivoPerdaRaw,motivoDePerda:motivoPerdaRaw,produto,tipoVenda:tipoVendaRaw||produto,tipoNegocio:produto,modelo,etapa:rawStage,estagio:rawStage,situacao:rawSituacao,statusAlternativo:statusAltRaw,status,valor,prop,dias,diasNoEstagio:dias,alerta,data:dataStr,dataFechamento:dataStr,monthKey,porte:mapPorte(valor),marcadores:marcadoresRaw,dataCriacao:dcriado&&!isNaN(dcriado)?dcriado.toISOString().substring(0,10):'',ultimaAtualizacao:dultAtual&&!isNaN(dultAtual)?dultAtual.toISOString().substring(0,10):'',meioContato:meioContatoRaw,cidadeColeta:cidadeColetaRaw
  };
}

// ── FILE HANDLING ───────────────────────────────────────
function handleFileUpload(file){
  if(!file)return;
  const inp=document.getElementById('crm-file-input');if(inp)inp.value='';
  const name=file.name.toLowerCase();
  setImportStatus('Processando…','var(--warn)');
  if(name.endsWith('.csv')){
    const r=new FileReader();
    r.onerror=()=>setImportStatus('Erro ao ler o arquivo CSV','var(--bad)');
    r.onload=e=>{
      try{
        const content=e.target.result;
        if(/Ã[§£¢¡]|â€/.test(content)){
          const r2=new FileReader();
          r2.onerror=()=>setImportStatus('Erro ao ler o arquivo CSV (encoding)','var(--bad)');
          r2.onload=e2=>{try{parseCSV(e2.target.result,file.name);}catch(err){setImportStatus('Erro CSV: '+err.message,'var(--bad)');}};
          r2.readAsText(file,'windows-1252');
        }else parseCSV(content,file.name);
      }catch(err){setImportStatus('Erro CSV: '+err.message,'var(--bad)');}
    };
    r.readAsText(file,'UTF-8');
  }else if(name.endsWith('.xlsx')||name.endsWith('.xls')){
    const r=new FileReader();
    r.onerror=()=>setImportStatus('Erro ao ler o arquivo XLSX','var(--bad)');
    r.onload=e=>{try{parseXLSX(e.target.result,file.name);}catch(err){setImportStatus('Erro XLSX: '+err.message,'var(--bad)');console.error(err);}};
    r.readAsArrayBuffer(file);
  }else setImportStatus('Formato inválido. Use .xlsx ou .csv','var(--bad)');
}
function setImportStatus(msg,color){const el=document.getElementById('import-status');if(el){el.textContent=msg;el.style.color=color||'var(--text3)';}}
function parseCSV(content,filename){
  try{const r=Papa.parse(content,{header:true,skipEmptyLines:true,dynamicTyping:false,delimitersToGuess:[';',',','\t','|']});processRawRows(r.data,filename);}
  catch(err){setImportStatus('Erro CSV: '+err.message,'var(--bad)');}
}
function parseXLSX(buffer,filename){
  try{
    if(!buffer||buffer.byteLength===0)throw new Error('Arquivo vazio');
    const wb=XLSX.read(buffer,{type:'array'});
    if(!wb||!wb.SheetNames||!wb.SheetNames.length)throw new Error('Nenhuma planilha encontrada');
    const sheetName=wb.SheetNames[0];const sheet=wb.Sheets[sheetName];
    if(!sheet)throw new Error('Planilha vazia');
    let rows=[];
    try{rows=XLSX.utils.sheet_to_json(sheet,{raw:false,defval:''});}
    catch(e){rows=XLSX.utils.sheet_to_json(sheet,{raw:true,defval:''});}
    processRawRows(rows,filename);
  }catch(err){setImportStatus('Erro XLSX: '+err.message,'var(--bad)');console.error(err);}
}
function processRawRows(rows,filename){
  try{
    if(!rows||!rows.length){setImportStatus('Arquivo vazio ou sem dados','var(--warn)');return;}
    if(rows[0]){
      const colsEssenciais=['Título','Cliente','Valor','Responsável','Situação','Estágio','Data de Fechamento','Empresa Vendedora','Origem','Tipo de Venda','Motivo de perda','Marcadores','Dias no estágio'];
      const rowCols=Object.keys(rows[0]).map(c=>stripAccents(c));
      const ausentes=colsEssenciais.filter(ec=>!rowCols.some(rc=>rc===stripAccents(ec)||rc.includes(stripAccents(ec))));
      if(ausentes.length){console.warn('Colunas ausentes no Panorama:',ausentes);}
    }
    const normalized=[];let erros=0;
    for(const row of rows){try{const n=normalizeRow(row);if(n)normalized.push(n);}catch(e){erros++;}}
    const valid=normalized.filter(r=>r.cliente||r.consultor||r.valor>0);
    if(!valid.length){
      const sampleCols=rows[0]?Object.keys(rows[0]).slice(0,10).join(' | '):'(sem colunas)';
      setImportStatus('Nenhum registro. Colunas: '+sampleCols,'var(--bad)');return;
    }
    const semDataFechado=valid.filter(r=>(r.status==='ganho'||r.status==='perdido')&&!r.data).length;
    if(semDataFechado>0){console.warn('Atenção: '+semDataFechado+' negócios ganhos/perdidos sem Data de Fechamento.');}
    const nG=valid.filter(r=>r.status==='ganho').length;
    const nP=valid.filter(r=>r.status==='perdido').length;
    const nPl=valid.filter(r=>r.status==='pipeline').length;
    AppState.rawData=valid;
    AppState.importMeta={filename,importedAt:new Date().toLocaleString('pt-BR'),recordCount:valid.length,semDataFechado};
    const emps=[...new Set(valid.map(r=>r.empresa).filter(Boolean))];
    populateEmpresaFilter(emps);
    const cons=[...new Set(valid.map(r=>r.consultor).filter(Boolean))].sort();
    populateConsultorFilter(cons);populateGestorSelect();
    const allDates=valid.filter(r=>r.data).map(r=>r.data).sort();
    if(allDates.length){
      const[minY,minM]=allDates[0].split('-');const[maxY,maxM]=allDates[allDates.length-1].split('-');
      const fromVal=`${minY}-${minM}-01`;
      const lastDay=new Date(parseInt(maxY),parseInt(maxM),0).getDate();
      const toVal=`${maxY}-${maxM}-${String(lastDay).padStart(2,'0')}`;
      const df=document.getElementById('dt-from');const dt=document.getElementById('dt-to');
      if(df)df.value=fromVal;if(dt)dt.value=toVal;
      const v=allDates[allDates.length-1];
      ['data-ate','data-ate-h'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=v;});
    }
    saveLS();
    try{applyFilters();}catch(e){console.error(e);}
    const errMsg=erros>0?` · ${erros} linhas ignoradas`:'';
    const warnData=semDataFechado>0?` · ⚠ ${semDataFechado} sem data de fechamento`:'';
    setImportStatus(`✓ ${filename} — ${valid.length} reg (${nG}G · ${nP}P · ${nPl}Pipe)${errMsg}${warnData}`,'var(--ok)');
  }catch(err){setImportStatus('Erro interno: '+err.message,'var(--bad)');console.error(err);}
}
function populateEmpresaFilter(emps){
  const c=document.getElementById('empresa-checkboxes');if(!c)return;
  const all=[...new Set([...EMPRESAS_PADRAO,...emps])].sort();
  c.innerHTML=all.map(e=>`<label class="chk-label"><input type="checkbox" value="${e.replace(/"/g,'&quot;')}" onchange="applyFilters()"><span>${e}</span></label>`).join('');
}
function populateConsultorFilter(cons){
  const s=document.getElementById('sel-resp');if(!s)return;
  const cv=s.value;
  s.innerHTML='<option value="">Todos</option>'+cons.map(c=>`<option value="${c}">${c}</option>`).join('');
  s.value=cv;
}
function populateGestorSelect(){
  const s=document.getElementById('gestor-seller-select');if(!s)return;
  const cv=s.value;
  s.innerHTML='<option value="">— Selecione —</option>'+Object.keys(METAS_CONSULTOR).map(c=>`<option value="${c}">${c}</option>`).join('');
  if(cv)s.value=cv;
}
function saveLS(){try{localStorage.setItem('gvc_crm_data',JSON.stringify(AppState.rawData));localStorage.setItem('gvc_crm_meta',JSON.stringify(AppState.importMeta));}catch(e){}}
function loadLS(){
  try{
    const d=localStorage.getItem('gvc_crm_data');const m=localStorage.getItem('gvc_crm_meta');
    if(d&&m){
      AppState.rawData=JSON.parse(d);AppState.importMeta=JSON.parse(m);
      setImportStatus(`${AppState.importMeta.filename} · ${AppState.importMeta.importedAt}`,'var(--info)');
      const emps=[...new Set(AppState.rawData.map(r=>r.empresa).filter(Boolean))];populateEmpresaFilter(emps);
      const cons=[...new Set(AppState.rawData.map(r=>r.consultor).filter(Boolean))].sort();
      populateConsultorFilter(cons);populateGestorSelect();
      const dates=AppState.rawData.filter(r=>r.data).map(r=>r.data).sort();
      if(dates.length){const v=dates[dates.length-1];['data-ate','data-ate-h'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=v;});}
      return true;
    }
  }catch(e){}return false;
}
function applyFilters(){
  const from=document.getElementById('dt-from').value||DEFAULT_DATE_FROM;
  const to=document.getElementById('dt-to').value||DEFAULT_DATE_TO;
  const consultor=document.getElementById('sel-resp').value;
  const checked=Array.from(document.querySelectorAll('#empresa-checkboxes input:checked')).map(i=>i.value);
  AppState.filters={dateFrom:from,dateTo:to,consultor,empresa:checked};
  AppState.filteredData=AppState.rawData.filter(r=>{
    if(r.data&&r.data<from)return false;
    if(r.data&&r.data>to)return false;
    if(consultor&&r.consultor!==consultor)return false;
    if(checked.length>0&&!checked.includes(r.empresa))return false;
    return true;
  });
  const active=from!==DEFAULT_DATE_FROM||to!==DEFAULT_DATE_TO||consultor||checked.length>0;
  const fa=document.getElementById('filter-active');if(fa)fa.style.display=active?'flex':'none';
  const pl=document.getElementById('period-label');if(pl)pl.textContent=`${from} → ${to}`;
  updateDashboard();
}
function clearFilters(){
  document.getElementById('dt-from').value=DEFAULT_DATE_FROM;
  document.getElementById('dt-to').value=DEFAULT_DATE_TO;
  document.getElementById('sel-resp').value='';
  document.querySelectorAll('#empresa-checkboxes input').forEach(i=>i.checked=false);
  applyFilters();
}
function updateDashboard(){
  const t=AppState.currentTab;
  if(t==='consolidado')renderConsolidado();
  else if(t==='ranking')renderRanking();
  else if(t==='funil')renderFunil();
  else if(t==='seller')renderSeller();
  else if(t==='gestor')renderGestor();
  else if(t==='origem')renderOrigem();
  else if(t==='porte')renderPorte();
  else if(t==='tipo')renderTipo();
  else if(t==='evolutivo')renderEvolutivo();
  else if(t==='marcadores')renderMarcadores();
}
function showTab(id,el){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(a=>a.classList.remove('active'));
  const sec=document.getElementById('tab-'+id);if(sec)sec.classList.add('active');
  if(el)el.classList.add('active');
  AppState.currentTab=id;updateDashboard();
}


function renderMarcadores(){
  const fd=AppState.filteredData.filter(r=>r.monthKey&&r.monthKey.startsWith('2026'));
  const ganhos=fd.filter(r=>r.status==='ganho');
  const no=AppState.rawData.length===0;
  const kpisEl=document.getElementById('marc-kpis');
  if(no){
    if(kpisEl)kpisEl.innerHTML=noDataHtml();
    ['marc-dist-table','marc-detail-table','marc-consultor-table'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML='';});
    return;
  }
  const from=AppState.filters.dateFrom,to=AppState.filters.dateTo;
  const months=monthsInRange(from.substring(0,7),to.substring(0,7));
  const MARCADORES=['Contrato','Coleta Emergencial','Consultoria'];
  const totalVal=ganhos.reduce((s,r)=>s+r.valor,0);
  const totalDeals=ganhos.length;
  const totalTicket=totalDeals>0?totalVal/totalDeals:0;
  const curMK=`${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2,'0')}`;
  const curMonthName=MONTH_NAMES[CURRENT_MONTH-1];
  const curGanhos=ganhos.filter(r=>r.monthKey===curMK);
  const curVal=curGanhos.reduce((s,r)=>s+r.valor,0);
  const mRows=MARCADORES.map(m=>{
    const mg=ganhos.filter(r=>(r.marcadores||'')===m);
    const val=mg.reduce((s,r)=>s+r.valor,0);
    const deals=mg.length;
    const ticket=deals>0?val/deals:0;
    const pct=totalVal>0?val/totalVal*100:0;
    const curMG=mg.filter(r=>r.monthKey===curMK);
    const curMVal=curMG.reduce((s,r)=>s+r.valor,0);
    return {m,val,deals,ticket,pct,curMVal,curMDeals:curMG.length};
  });
  if(kpisEl)kpisEl.innerHTML=[
    kpiCard('Total Acumulado',fmt(totalVal),`${fmtN(totalDeals)} deals ganhos · Mês Atual: ${fmt(curVal)}`,'c',totalVal>0?100:0),
    ...mRows.map(r=>kpiCard(r.m,fmt(r.val),`${fmtN(r.deals)} deals · Ticket: ${fmt(r.ticket)} · ${fmtPct(r.pct)} do total`,'',r.pct))
  ].join('');
  const detailEl=document.getElementById('marc-detail-table');
  if(detailEl)detailEl.innerHTML=`<table class="dt"><thead><tr>
    <th>Marcador</th><th class="num">Deals</th><th class="num">Receita</th>
    <th class="num">% Receita</th><th class="num">Ticket Médio</th>
    <th class="num">Mês Atual (${curMonthName})</th><th class="num">Deals Mês</th>
  </tr></thead><tbody>${mRows.map(r=>`<tr>
    <td><strong style="color:var(--text)">${r.m}</strong></td>
    <td class="num">${fmtN(r.deals)}</td>
    <td class="num">${fmt(r.val)}</td>
    <td class="num">${pctBadge(r.pct)}</td>
    <td class="num">${fmt(r.ticket)}</td>
    <td class="num">${fmt(r.curMVal)}</td>
    <td class="num">${fmtN(r.curMDeals)}</td>
  </tr>`).join('')}
  <tr style="border-top:2px solid var(--border-soft);font-weight:700">
    <td><strong>TOTAL</strong></td>
    <td class="num"><strong>${fmtN(totalDeals)}</strong></td>
    <td class="num"><strong>${fmt(totalVal)}</strong></td>
    <td class="num">${pctBadge(100)}</td>
    <td class="num"><strong>${fmt(totalTicket)}</strong></td>
    <td class="num"><strong>${fmt(curVal)}</strong></td>
    <td class="num"><strong>${fmtN(curGanhos.length)}</strong></td>
  </tr></tbody></table>`;
  const distEl=document.getElementById('marc-dist-table');
  if(distEl){
    const monthRows=months.map(mk=>{
      const mg=ganhos.filter(r=>r.monthKey===mk);
      const mv=mg.reduce((s,r)=>s+r.valor,0);
      const [y,m]=mk.split('-');
      const label=MONTH_NAMES[+m-1].substring(0,3)+'/'+y.slice(2);
      const byM=MARCADORES.map(marc=>{const mm=mg.filter(r=>(r.marcadores||'')===marc);return {val:mm.reduce((s,r)=>s+r.valor,0),deals:mm.length};});
      return {label,mv,byM,deals:mg.length};
    });
    const totByM=MARCADORES.map((_,i)=>({val:monthRows.reduce((s,r)=>s+r.byM[i].val,0),deals:monthRows.reduce((s,r)=>s+r.byM[i].deals,0)}));
    distEl.innerHTML=`<table class="dt"><thead>
      <tr><th rowspan="2">Mês</th>${MARCADORES.map(m=>`<th class="num" colspan="2">${m}</th>`).join('')}<th class="num" rowspan="2">Total R$</th></tr>
      <tr>${MARCADORES.map(()=>'<th class="num">R$</th><th class="num">#</th>').join('')}</tr>
    </thead><tbody>${monthRows.map(r=>`<tr>
      <td>${r.label}</td>
      ${r.byM.map(b=>`<td class="num">${fmt(b.val)}</td><td class="num">${fmtN(b.deals)}</td>`).join('')}
      <td class="num"><strong>${fmt(r.mv)}</strong></td>
    </tr>`).join('')}
    <tr style="border-top:2px solid var(--border-soft);font-weight:700">
      <td><strong>TOTAL</strong></td>
      ${totByM.map(b=>`<td class="num"><strong>${fmt(b.val)}</strong></td><td class="num"><strong>${fmtN(b.deals)}</strong></td>`).join('')}
      <td class="num"><strong>${fmt(totalVal)}</strong></td>
    </tr></tbody></table>`;
  }
  if(typeof Chart!=='undefined'){
    dc('chart-marc-evo');
    const cEl=document.getElementById('chart-marc-evo');
    if(cEl){
      const colors=['#bcd6ff','#ffd79e','#d9c8ff'];
      const fixedMonths=monthsInRange(`${CURRENT_YEAR}-01`,`${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2,'0')}`);
      const allG2026=AppState.rawData.filter(r=>r.status==='ganho'&&r.monthKey&&r.monthKey.startsWith(String(CURRENT_YEAR)));
      const datasets=MARCADORES.map((marc,i)=>({
        label:marc,
        data:fixedMonths.map(mk=>allG2026.filter(r=>(r.marcadores||'')===marc&&r.monthKey===mk).reduce((s,r)=>s+r.valor,0)),
        borderColor:colors[i],backgroundColor:colors[i]+'22',fill:true,tension:.3,pointRadius:3
      }));
      new Chart(cEl,{type:'line',
        data:{labels:fixedMonths.map(mk=>{const[y,m]=mk.split('-');return MONTH_NAMES[+m-1].substring(0,3)+'/'+y.slice(2);}),datasets},
        options:{...chartDefaults(),plugins:{...chartDefaults().plugins,
          legend:{...chartDefaults().plugins.legend,display:true},
          tooltip:{callbacks:{label:ctx=>`${ctx.dataset.label}: ${fmt(ctx.raw)}`}},
          title:{display:true,text:'Evolutivo 2026 — não afetado por filtros',color:'rgba(255,255,255,.55)',font:{size:10}}
        }}});
    }
  }
  const consEl=document.getElementById('marc-consultor-table');
  if(consEl){
    const sellers=[...new Set(ganhos.map(r=>r.consultor).filter(Boolean))].sort();
    const cRows=sellers.map(sel=>{
      const sg=ganhos.filter(r=>r.consultor===sel);
      const totalSel=sg.reduce((s,r)=>s+r.valor,0);
      const cols=MARCADORES.map(marc=>{const mm=sg.filter(r=>(r.marcadores||'')===marc);return {val:mm.reduce((s,r)=>s+r.valor,0),deals:mm.length};});
      return {sel,totalSel,deals:sg.length,cols};
    }).sort((a,b)=>b.totalSel-a.totalSel);
    const totCols=MARCADORES.map((_,i)=>({val:cRows.reduce((s,r)=>s+r.cols[i].val,0),deals:cRows.reduce((s,r)=>s+r.cols[i].deals,0)}));
    consEl.innerHTML=cRows.length?`<table class="dt"><thead>
      <tr><th rowspan="2">Consultor</th>${MARCADORES.map(m=>`<th class="num" colspan="2">${m}</th>`).join('')}<th class="num" rowspan="2">Total</th></tr>
      <tr>${MARCADORES.map(()=>'<th class="num">R$</th><th class="num">#</th>').join('')}</tr>
    </thead><tbody>${cRows.map(r=>`<tr>
      <td>${r.sel}</td>
      ${r.cols.map(c=>`<td class="num">${fmt(c.val)}</td><td class="num">${fmtN(c.deals)}</td>`).join('')}
      <td class="num"><strong>${fmt(r.totalSel)}</strong></td>
    </tr>`).join('')}
    <tr style="border-top:2px solid var(--border-soft);font-weight:700">
      <td><strong>TOTAL</strong></td>
      ${totCols.map(c=>`<td class="num"><strong>${fmt(c.val)}</strong></td><td class="num"><strong>${fmtN(c.deals)}</strong></td>`).join('')}
      <td class="num"><strong>${fmt(cRows.reduce((s,r)=>s+r.totalSel,0))}</strong></td>
    </tr></tbody></table>`:noDataHtml('Sem dados no período');
  }
}