function isWeekend(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDay();
  return day === 0 || day === 6;
}

function calcularHoras(inicio, fim) {
  const [hi, mi] = inicio.split(':').map(Number);
  const [hf, mf] = fim.split(':').map(Number);
  const inicioMin = hi * 60 + mi;
  const fimMin = hf * 60 + mf;
  const diffMin = fimMin - inicioMin;
  return diffMin > 0 ? (diffMin / 60).toFixed(2) : 0;
}

function salvarRegistro() {
  const data = new Date().toISOString().slice(0, 10);
  const inicio = "17:24";
  const fim = prompt("Horário de término (HH:mm)", "22:00");
  const motivo = document.getElementById("motivo").value;
  const salario = parseFloat(document.getElementById("salario").value);
  const usuario = "Wildner Barbieri";
  const periodo = calcularPeriodo(data);

  const horas = parseFloat(calcularHoras(inicio, fim));
  const valorHora = salario / 220;
  const isFDS = isWeekend(data);

  let h75 = 0, h100 = 0;
  if (isFDS) {
    h100 = horas;
  } else {
    h75 = Math.min(2, horas);
    h100 = Math.max(0, horas - 2);
  }

  const v75 = h75 * valorHora * 1.75;
  const v100 = h100 * valorHora * 2;
  const total = v75 + v100;

  const registro = {
    data, inicio, fim, horas, v75, v100, total, motivo, usuario, periodo
  };

  const registros = JSON.parse(localStorage.getItem("registros") || "[]");
  registros.push(registro);
  localStorage.setItem("registros", JSON.stringify(registros));

  atualizarTabela();
}

function calcularPeriodo(dataStr) {
  const data = new Date(dataStr);
  let inicio = new Date(data.getFullYear(), data.getMonth(), 21);
  if (data.getDate() < 21) {
    inicio.setMonth(inicio.getMonth() - 1);
  }
  const fim = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 20);
  return `${inicio.toISOString().slice(0, 10)} a ${fim.toISOString().slice(0, 10)}`;
}

function atualizarTabela() {
  const registros = JSON.parse(localStorage.getItem("registros") || "[]");
  const tbody = document.querySelector("#tabela-registros tbody");
  tbody.innerHTML = "";

  let total75 = 0, total100 = 0;

  registros.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.data}</td>
      <td>${r.inicio}</td>
      <td>${r.fim}</td>
      <td>${r.horas}</td>
      <td>R$ ${r.v75.toFixed(2)}</td>
      <td>R$ ${r.v100.toFixed(2)}</td>
      <td>R$ ${r.total.toFixed(2)}</td>
      <td>${r.motivo}</td>
      <td>${r.usuario}</td>
      <td>${r.periodo}</td>
    `;
    tbody.appendChild(tr);
    total75 += r.v75;
    total100 += r.v100;
  });

  document.getElementById("total75").textContent = `R$ ${total75.toFixed(2)}`;
  document.getElementById("total100").textContent = `R$ ${total100.toFixed(2)}`;
  document.getElementById("totalGeral").textContent = `R$ ${(total75 + total100).toFixed(2)}`;
}

function exportarExcel() {
  const registros = JSON.parse(localStorage.getItem("registros") || "[]");
  if (registros.length === 0) return alert("Sem dados para exportar.");

  const linhas = [
    ["Data", "Início", "Fim", "Horas", "Valor 75%", "Valor 100%", "Total", "Motivo", "Usuário", "Período"]
  ];

  registros.forEach(r => {
    linhas.push([
      r.data, r.inicio, r.fim, r.horas,
      `R$ ${r.v75.toFixed(2)}`, `R$ ${r.v100.toFixed(2)}`, `R$ ${r.total.toFixed(2)}`,
      r.motivo, r.usuario, r.periodo
    ]);
  });

  const csv = linhas.map(l => l.join(";")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "horas_extras.csv";
  a.click();
  URL.revokeObjectURL(url);
}

atualizarTabela();
