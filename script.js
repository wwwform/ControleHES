// Funções utilitárias
function formatarDataParaPeriodo(dataStr) {
  const data = new Date(dataStr);
  let ano = data.getFullYear();
  let mes = data.getMonth() + 1;
  let dia = data.getDate();
  if (dia <= 20) {
    const fimMes = new Date(ano, mes - 1, 20);
    const inicio = new Date(fimMes);
    inicio.setMonth(inicio.getMonth() - 1);
    inicio.setDate(21);
    return `${inicio.toLocaleDateString()} a ${fimMes.toLocaleDateString()}`;
  } else {
    const inicio = new Date(ano, mes - 1, 21);
    const fim = new Date(ano, mes, 20);
    return `${inicio.toLocaleDateString()} a ${fim.toLocaleDateString()}`;
  }
}

function calcularHoras(inicio, fim) {
  const [h1, m1] = inicio.split(":").map(Number);
  const [h2, m2] = fim.split(":").map(Number);
  return ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
}

function isFimDeSemanaOuFeriado(dataStr) {
  const data = new Date(dataStr);
  const dia = data.getDay();
  return dia === 0 || dia === 6;
}

function calcularValorHora(salario) {
  const diasUteis = 22;
  const horasDia = 8.8;
  return salario / (diasUteis * horasDia);
}

function formatarValor(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Salvando dados
const registros = [];

document.getElementById("registro-form").addEventListener("submit", function(e) {
  e.preventDefault();

  const data = document.getElementById("data").value;
  let inicio = document.getElementById("inicio").value;
  const fim = document.getElementById("fim").value;
  const salario = parseFloat(document.getElementById("salario").value);
  const motivo = document.getElementById("motivo").value;
  const usuario = document.getElementById("usuario").value;

  if (!isFimDeSemanaOuFeriado(data)) {
    inicio = "17:24";
    document.getElementById("inicio").value = inicio;
  }

  const horas = calcularHoras(inicio, fim);
  const valorHora = calcularValorHora(salario);

  let valor75 = 0, valor100 = 0;
  if (!isFimDeSemanaOuFeriado(data)) {
    if (horas <= 2) valor75 = horas * valorHora * 1.75;
    else {
      valor75 = 2 * valorHora * 1.75;
      valor100 = (horas - 2) * valorHora * 2;
    }
  } else {
    valor100 = horas * valorHora * 2;
  }

  const total = valor75 + valor100;
  const periodo = formatarDataParaPeriodo(data);

  const registro = { data, inicio, fim, horas, valor75, valor100, total, motivo, usuario, periodo };
  registros.push(registro);

  atualizarTabela();
});

function atualizarTabela() {
  const corpo = document.getElementById("tabela-corpo");
  corpo.innerHTML = "";
  let total75 = 0, total100 = 0;

  registros.forEach(r => {
    total75 += r.valor75;
    total100 += r.valor100;

    const linha = `<tr>
      <td>${r.data}</td><td>${r.inicio}</td><td>${r.fim}</td>
      <td>${r.horas.toFixed(2)}</td><td>${formatarValor(r.valor75)}</td>
      <td>${formatarValor(r.valor100)}</td><td>${formatarValor(r.total)}</td>
      <td>${r.motivo}</td><td>${r.usuario}</td><td>${r.periodo}</td>
    </tr>`;
    corpo.insertAdjacentHTML("beforeend", linha);
  });

  document.getElementById("acumulado75").textContent = formatarValor(total75);
  document.getElementById("acumulado100").textContent = formatarValor(total100);
  document.getElementById("acumuladoTotal").textContent = formatarValor(total75 + total100);
}

document.getElementById("exportar").addEventListener("click", function() {
  if (registros.length === 0) return alert("Nenhum dado para exportar.");
  registros.forEach(r => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["Usuário", r.usuario],
      ["Data", r.data],
      ["Hora Início", r.inicio],
      ["Hora Fim", r.fim],
      ["Quantidade de Horas", r.horas.toFixed(2)],
      ["Justificativa", r.motivo]
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Registro");
    XLSX.writeFile(wb, `formulario_HE_${r.data}.xlsx`);
  });
});