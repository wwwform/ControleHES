let registros = [];

document.getElementById("registro-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const usuario = document.getElementById("usuario").value;
  const data = document.getElementById("data").value;
  const inicioInput = document.getElementById("inicio");
  let inicio = inicioInput.value;
  const fim = document.getElementById("fim").value;
  const justificativa = document.getElementById("justificativa").value;

  const diaSemana = new Date(data).getDay();
  const isFeriado = false; // Pode integrar com API de feriados depois

  if ((diaSemana >= 1 && diaSemana <= 5) && !inicio && !isFeriado) {
    inicio = "17:24";
  }

  const salario = 2000; // fixo para testes
  const duracao = calcularDiferencaHoras(inicio, fim);
  const adicional = calcularAdicional(diaSemana, isFeriado, duracao);
  const valorHora = (salario / 220);
  const valorFinal = valorHora * duracao * adicional;

  const registro = { usuario, data, inicio, fim, justificativa, duracao, adicional, valorFinal };
  registros.push(registro);
  atualizarTotais();
  alert("Registro salvo!");
});

function calcularDiferencaHoras(inicio, fim) {
  const [hi, mi] = inicio.split(":").map(Number);
  const [hf, mf] = fim.split(":").map(Number);
  const inicioMin = hi * 60 + mi;
  const fimMin = hf * 60 + mf;
  return Math.max((fimMin - inicioMin) / 60, 0);
}

function calcularAdicional(diaSemana, isFeriado, horas) {
  if (diaSemana === 0 || diaSemana === 6 || isFeriado) return 2.0;
  return horas <= 2 ? 1.75 : 2.0;
}

function atualizarTotais() {
  let total75 = 0, total100 = 0, totalReais75 = 0, totalReais100 = 0;
  for (const r of registros) {
    if (r.adicional === 1.75) {
      total75 += r.duracao;
      totalReais75 += r.valorFinal;
    } else {
      total100 += r.duracao;
      totalReais100 += r.valorFinal;
    }
  }
  const totalGeral = total75 + total100;
  const totalReais = totalReais75 + totalReais100;
  document.getElementById("total75").textContent = `${total75.toFixed(2)}h - R$${totalReais75.toFixed(2)}`;
  document.getElementById("total100").textContent = `${total100.toFixed(2)}h - R$${totalReais100.toFixed(2)}`;
  document.getElementById("totalGeral").textContent = `${totalGeral.toFixed(2)}h - R$${totalReais.toFixed(2)}`;
}

function exportarRegistros() {
  if (registros.length === 0) return alert("Nenhum registro para exportar.");

  registros.forEach((r, i) => {
    const wb = XLSX.utils.book_new();
    const wsData = [
      ["Usuário", r.usuario],
      ["Data", r.data],
      ["Hora Inicial", r.inicio],
      ["Hora Final", r.fim],
      ["Total de Horas", r.duracao.toFixed(2)],
      ["Justificativa", r.justificativa]
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "HE");
    XLSX.writeFile(wb, `formlario HE - modelo individual ${i + 1}.xlsx`);
  });
}
