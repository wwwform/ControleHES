
function salvarRegistro() {
  const data = document.getElementById('data').value;
  const inicio = document.getElementById('inicio').value;
  const fim = document.getElementById('fim').value;
  const salario = parseFloat(document.getElementById('salario').value);
  const motivo = document.getElementById('motivo').value;
  const usuario = document.getElementById('usuario').value;

  if (!data || !inicio || !fim || !motivo) return alert("Preencha todos os campos.");

  const dataObj = new Date(data);
  const isDiaUtil = dataObj.getDay() >= 1 && dataObj.getDay() <= 5;

  const inicioHora = parseInt(inicio.split(":")[0]);
  const inicioMin = parseInt(inicio.split(":")[1]);
  const fimHora = parseInt(fim.split(":")[0]);
  const fimMin = parseInt(fim.split(":")[1]);
  const horasTrabalhadas = (fimHora + fimMin / 60) - (inicioHora + inicioMin / 60);

  let h75 = 0, h100 = 0;
  if (isDiaUtil) {
    if (horasTrabalhadas <= 2) {
      h75 = horasTrabalhadas;
    } else {
      h75 = 2;
      h100 = horasTrabalhadas - 2;
    }
  } else {
    h100 = horasTrabalhadas;
  }

  const valorHora = salario / 220;
  const valor75 = h75 * valorHora * 1.75;
  const valor100 = h100 * valorHora * 2.0;
  const total = valor75 + valor100;

  const tbody = document.querySelector("#tabelaRegistros tbody");
  const linha = document.createElement("tr");
  linha.innerHTML = `
    <td>${data}</td>
    <td>${inicio}</td>
    <td>${fim}</td>
    <td>${horasTrabalhadas.toFixed(2)}</td>
    <td>R$ ${valor75.toFixed(2)}</td>
    <td>R$ ${valor100.toFixed(2)}</td>
    <td>R$ ${total.toFixed(2)}</td>
    <td>${motivo}</td>
    <td>${usuario}</td>
    <td>${calcularPeriodo(data)}</td>
  `;
  tbody.appendChild(linha);
}

function calcularPeriodo(dataStr) {
  const data = new Date(dataStr);
  const ano = data.getFullYear();
  const mes = data.getMonth();

  let inicio = new Date(ano, mes, 21);
  let fim = new Date(ano, mes + 1, 20);

  if (data.getDate() < 21) {
    inicio = new Date(ano, mes - 1, 21);
    fim = new Date(ano, mes, 20);
  }

  return `${inicio.toISOString().split('T')[0]} a ${fim.toISOString().split('T')[0]}`;
}

function exportarParaExcel() {
  alert("Exportação ainda será implementada com base no modelo do Excel.");
}
