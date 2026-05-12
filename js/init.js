// ==========================================================
// GVC Analytics — Vendas | Inicialização da página
// Arquivo: js/init.js
// Contém: listener DOMContentLoaded — ponto de entrada da
//          aplicação. Conecta filtros, vídeo de fundo e
//          dispara a primeira renderização do dashboard.
// ==========================================================
document.addEventListener('DOMContentLoaded',()=>{
  populateEmpresaFilter([]);
  document.getElementById('current-date').textContent=TODAY.toLocaleDateString('pt-BR');
  // Inicializa inputs de data com valores dinâmicos do mês atual
  const dtFrom=document.getElementById('dt-from');const dtTo=document.getElementById('dt-to');
  if(dtFrom&&!dtFrom.value)dtFrom.value=DEFAULT_DATE_FROM;
  if(dtTo)dtTo.value=DEFAULT_DATE_TO;
  const pl=document.getElementById('period-label');if(pl)pl.textContent=`${DEFAULT_DATE_FROM} → ${DEFAULT_DATE_TO}`;
  if(typeof Chart!=='undefined'){Chart.defaults.color='rgba(255,255,255,.82)';Chart.defaults.font.family='Poppins';}
  // carregarDadosPloomes() é chamado após autenticação (login overlay)
  /* Ensure video plays */
  const vid=document.querySelector('video.bg-video');
  if(vid){
    vid.addEventListener('loadedmetadata',()=>{try{vid.play();}catch(e){}});
    document.addEventListener('click',()=>{try{vid.play();}catch(e){}},{once:true});
  }
});