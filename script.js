function salvarRegistro() {
  const usuario = document.getElementById('usuario').value;
  const data = document.getElementById('data').value;
  const inicio = document.getElementById('horaInicio').value;
  const fim = document.getElementById('horaFim').value;
  const salario = parseFloat(document.getElementById('salario').value);
  const justificativa = document.getElementById('justificativa').value;

  if (!data || !inicio || !fim || !salario || !justificativa) {
    alert("Preencha todos os campos.");
    return;
  }

  const diaSemana = new Date(data).getDay();
  const isFinalDeSemana = (diaSemana === 0 || diaSemana === 6);

  const inicioMin = horaParaMinutos(inicio);
  const fimMin = horaParaMinutos(fim);
  let duracao = (fimMin - inicioMin) / 60;

  let h75 = 0, h100 = 0;
  if (!isFinalDeSemana && duracao > 0) {
    h75 = Math.min(duracao, 2);
    h100 = Math.max(0, duracao - 2);
  } else {
    h100 = duracao;
  }

  const valorHora = salario / 220;
  const valor75 = valorHora * h75 * 1.75;
  const valor100 = valorHora * h100 * 2.0;
  const total = valor75 + valor100;

  const dataObj = new Date(data);
  const periodoInicio = new Date(dataObj.getFullYear(), dataObj.getMonth() - (dataObj.getDate() < 21 ? 1 : 0), 21);
  const periodoFim = new Date(periodoInicio.getFullYear(), periodoInicio.getMonth() + 1, 20);

  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${data}</td>
    <td>${inicio}</td>
    <td>${fim}</td>
    <td>${duracao.toFixed(2)}</td>
    <td>R$ ${valor75.toFixed(2)}</td>
    <td>R$ ${valor100.toFixed(2)}</td>
    <td>R$ ${total.toFixed(2)}</td>
    <td>${justificativa}</td>
    <td>${usuario}</td>
    <td>${formatarData(periodoInicio)} a ${formatarData(periodoFim)}</td>
  `;
  document.querySelector('#registrosTabela tbody').appendChild(tr);
}

function horaParaMinutos(hora) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function formatarData(data) {
  return data.toISOString().split("T")[0];
}

function exportarParaExcel() {
  alert("Exportação em XLSX será implementada com base no modelo do Excel.");
}
