const registros = [];
const feriados = ["2025-01-01", "2025-04-21", "2025-05-01", "2025-09-07", "2025-10-12", "2025-11-02", "2025-11-15", "2025-12-25"];

document.getElementById('data').addEventListener('change', function () {
  const data = this.value;
  const diaSemana = new Date(data).getDay();
  const isFeriado = feriados.includes(data);

  if (diaSemana >= 1 && diaSemana <= 5 && !isFeriado) {
    document.getElementById('inicio').value = '17:24';
    document.getElementById('inicio').readOnly = true;
  } else {
    document.getElementById('inicio').value = '';
    document.getElementById('inicio').readOnly = false;
  }
});

document.getElementById('registro-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const data = document.getElementById('data').value;
  const inicio = document.getElementById('inicio').value;
  const fim = document.getElementById('fim').value;
  const salario = parseFloat(document.getElementById('salario').value.replace(',', '.'));
  const motivo = document.getElementById('motivo').value;
  const usuario = document.getElementById('usuario').value;

  const dia = new Date(data).getDay();
  const isFeriado = feriados.includes(data);
  const isSemana = dia >= 1 && dia <= 5 && !isFeriado;

  const inicioData = new Date(`${data}T${inicio}`);
  const fimData = new Date(`${data}T${fim}`);
  const diffMs = fimData - inicioData;
  const diffHoras = diffMs / 1000 / 60 / 60;

  const valorHora = salario / 220;
  let valor75 = 0, valor100 = 0;

  if (isSemana) {
    if (diffHoras <= 2) {
      valor75 = diffHoras * valorHora * 1.75;
    } else {
      valor75 = 2 * valorHora * 1.75;
      valor100 = (diffHoras - 2) * valorHora * 2;
    }
  } else {
    valor100 = diffHoras * valorHora * 2;
  }

  const periodo = getPeriodo(data);

  const registro = {
    data,
    inicio,
    fim,
    horas: diffHoras.toFixed(2),
    valor75: valor75.toFixed(2),
    valor100: valor100.toFixed(2),
    total: (valor75 + valor100).toFixed(2),
    motivo,
    usuario,
    periodo
  };

  registros.push(registro);
  atualizarTabela();
  this.reset();
});

function atualizarTabela() {
  const corpo = document.getElementById('tabela-corpo');
  corpo.innerHTML = '';
  let total75 = 0, total100 = 0, totalGeral = 0;

  registros.forEach(reg => {
    total75 += parseFloat(reg.valor75);
    total100 += parseFloat(reg.valor100);
    totalGeral += parseFloat(reg.total);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${reg.data}</td>
      <td>${reg.inicio}</td>
      <td>${reg.fim}</td>
      <td>${reg.horas}</td>
      <td>R$ ${reg.valor75}</td>
      <td>R$ ${reg.valor100}</td>
      <td>R$ ${reg.total}</td>
      <td>${reg.motivo}</td>
      <td>${reg.usuario}</td>
      <td>${reg.periodo}</td>
    `;
    corpo.appendChild(tr);
  });

  document.getElementById('acumulado75').textContent = `R$ ${total75.toFixed(2)}`;
  document.getElementById('acumulado100').textContent = `R$ ${total100.toFixed(2)}`;
  document.getElementById('acumuladoTotal').textContent = `R$ ${totalGeral.toFixed(2)}`;
}

function getPeriodo(dataStr) {
  const data = new Date(dataStr);
  const dia = data.getDate();
  const mes = data.getMonth();
  const ano = data.getFullYear();

  let inicio, fim;
  if (dia <= 20) {
    inicio = new Date(ano, mes - 1, 21);
    fim = new Date(ano, mes, 20);
  } else {
    inicio = new Date(ano, mes, 21);
    fim = new Date(ano, mes + 1, 20);
  }

  const formatar = d => d.toLocaleDateString('pt-BR');
  return `${formatar(inicio)} - ${formatar(fim)}`;
}

document.getElementById('exportar').addEventListener('click', () => {
  if (registros.length === 0) return;

  const XLSX = window.XLSX;

  registros.forEach(reg => {
    const wb = XLSX.utils.book_new();
    const wsData = [
      ["Usuário", reg.usuario],
      ["Data", reg.data],
      ["Hora Início", reg.inicio],
      ["Hora Fim", reg.fim],
      ["Quantidade de Horas", reg.horas],
      ["Justificativa", reg.motivo]
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "HE");

    const nomeArquivo = `formulario_HE_${reg.usuario}_${reg.data}.xlsx`;
    XLSX.writeFile(wb, nomeArquivo);
  });
});
