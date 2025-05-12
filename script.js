const form = document.getElementById('extraForm');
const registrosDiv = document.getElementById('registros');
const resumoDiv = document.getElementById('resumo');

let registros = JSON.parse(localStorage.getItem('registros')) || [];

form.addEventListener('submit', function (e) {
  e.preventDefault();

  const data = document.getElementById('data').value;
  const inicio = document.getElementById('horaInicio').value;
  const fim = document.getElementById('horaFim').value;
  const salario = parseFloat(document.getElementById('salario').value);

  if (!data || !inicio || !fim || isNaN(salario)) return;

  const inicioMin = toMinutes(inicio);
  const fimMin = toMinutes(fim);
  const totalMin = fimMin - inicioMin;

  let h75 = 0, h100 = 0;
  if (totalMin <= 120) {
    h75 = totalMin / 60;
  } else {
    h75 = 2;
    h100 = (totalMin - 120) / 60;
  }

  registros.push({ data, inicio, fim, h75, h100, salario });
  localStorage.setItem('registros', JSON.stringify(registros));

  renderizar();
  form.reset();
});

function toMinutes(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function calcularResumo(fechamentoDia = 20) {
  const periodos = {};

  registros.forEach(r => {
    const [ano, mes, dia] = r.data.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia);

    let chave;
    if (dia <= fechamentoDia) {
      chave = `${ano}-${String(mes).padStart(2, '0')}`;
    } else {
      const next = new Date(ano, mes, 1);
      chave = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!periodos[chave]) periodos[chave] = [];
    periodos[chave].push(r);
  });

  return Object.entries(periodos).map(([periodo, dados]) => {
    const h75 = dados.reduce((acc, r) => acc + r.h75, 0);
    const h100 = dados.reduce((acc, r) => acc + r.h100, 0);
    const total = h75 + h100;
    const salario = dados[dados.length - 1].salario;
    const valorHora = salario / 220;
    const valorTotal = (h75 * valorHora * 1.75) + (h100 * valorHora * 2);

    return { periodo, h75, h100, total, valorTotal, registros: dados };
  });
}

function renderizar() {
  const resumos = calcularResumo();

  resumoDiv.innerHTML = resumos.map(r => `
    <h2>Período: ${r.periodo}</h2>
    <p>Horas com 75%: ${r.h75.toFixed(2)}h</p>
    <p>Horas com 100%: ${r.h100.toFixed(2)}h</p>
    <p>Total Geral: ${r.total.toFixed(2)}h</p>
    <p>Valor total (R$): ${r.valorTotal.toFixed(2)}</p>
  `).join('');

  registrosDiv.innerHTML = `<h2>Registros</h2><ul>${registros.map(r =>
    `<li>${r.data}: ${r.inicio} - ${r.fim} | 75%: ${r.h75.toFixed(2)}h, 100%: ${r.h100.toFixed(2)}h</li>`).join('')}</ul>`;
}

function limparTudo() {
  if (confirm('Deseja realmente limpar todos os dados?')) {
    registros = [];
    localStorage.removeItem('registros');
    renderizar();
  }
}

function exportarExcel() {
  let csv = 'Data,Inicio,Fim,Horas 75%,Horas 100%,Salario\n';
  registros.forEach(r => {
    csv += `${r.data},${r.inicio},${r.fim},${r.h75.toFixed(2)},${r.h100.toFixed(2)},${r.salario}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'registros_horas_extras.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

renderizar();
