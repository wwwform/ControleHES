function calcularHorasExtras(inicio, fim) {
  const [hIni, mIni] = inicio.split(":").map(Number);
  const [hFim, mFim] = fim.split(":").map(Number);
  const ini = hIni * 60 + mIni;
  const fimMin = hFim * 60 + mFim;
  return (fimMin - ini) / 60;
}

function salvarRegistro() {
  const salario = parseFloat(document.getElementById("salario").value);
  const justificativa = document.getElementById("justificativa").value;
  const data = document.getElementById("data").value;
  const inicio = document.getElementById("inicio").value;
  const fim = document.getElementById("fim").value;
  const usuario = document.getElementById("usuario").value;

  if (!salario || !justificativa || !data || !inicio || !fim || !usuario) {
    alert("Preencha todos os campos.");
    return;
  }

  const horas = calcularHorasExtras(inicio, fim);
  const valorHora = salario / 220;

  const dia = new Date(data).getDay();
  let valor75 = 0, valor100 = 0;

  if (dia === 0 || dia === 6) {
    valor100 = horas * valorHora * 2;
  } else {
    if (horas <= 2) {
      valor75 = horas * valorHora * 1.75;
    } else {
      valor75 = 2 * valorHora * 1.75;
      valor100 = (horas - 2) * valorHora * 2;
    }
  }

  const total = valor75 + valor100;
  const periodo = calcularPeriodo(data);

  const registro = {
    data, inicio, fim, horas, valor75, valor100, total,
    justificativa, usuario, periodo
  };

  const registros = JSON.parse(localStorage.getItem("registros") || "[]");
  registros.push(registro);
  localStorage.setItem("registros", JSON.stringify(registros));

  renderizarTabela();
}

function calcularPeriodo(dataStr) {
  const data = new Date(dataStr);
  const ano = data.getFullYear();
  const mes = data.getMonth();
  const dia = data.getDate();
  let inicio, fim;

  if (dia <= 20) {
    inicio = new Date(ano, mes - 1, 21);
    fim = new Date(ano, mes, 20);
  } else {
    inicio = new Date(ano, mes, 21);
    fim = new Date(ano, mes + 1, 20);
  }

  return `${inicio.toISOString().split("T")[0]} a ${fim.toISOString().split("T")[0]}`;
}

function renderizarTabela() {
  const tbody = document.getElementById("corpo-tabela");
  tbody.innerHTML = "";
  let t75 = 0, t100 = 0, tGeral = 0;

  const registros = JSON.parse(localStorage.getItem("registros") || "[]");

  registros.forEach(reg => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${reg.data}</td>
      <td>${reg.inicio}</td>
      <td>${reg.fim}</td>
      <td>${reg.horas.toFixed(2)}</td>
      <td>R$ ${reg.valor75.toFixed(2)}</td>
      <td>R$ ${reg.valor100.toFixed(2)}</td>
      <td>R$ ${reg.total.toFixed(2)}</td>
      <td>${reg.justificativa}</td>
      <td>${reg.usuario}</td>
      <td>${reg.periodo}</td>
    `;
    tbody.appendChild(tr);

    t75 += reg.valor75;
    t100 += reg.valor100;
    tGeral += reg.total;
  });

  document.getElementById("total-75").textContent = `R$ ${t75.toFixed(2)}`;
  document.getElementById("total-100").textContent = `R$ ${t100.toFixed(2)}`;
  document.getElementById("total-geral").textContent = `R$ ${tGeral.toFixed(2)}`;
}

function exportarParaExcel() {
  const registros = JSON.parse(localStorage.getItem("registros") || "[]");
  if (registros.length === 0) {
    alert("Nenhum registro para exportar.");
    return;
  }

  const cabecalho = ["Data", "Início", "Fim", "Horas", "Valor 75%", "Valor 100%", "Total", "Motivo", "Usuário", "Período"];
  const linhas = registros.map(r => [
    r.data, r.inicio, r.fim, r.horas.toFixed(2),
    `R$ ${r.valor75.toFixed(2)}`,
    `R$ ${r.valor100.toFixed(2)}`,
    `R$ ${r.total.toFixed(2)}`,
    r.justificativa, r.usuario, r.periodo
  ]);

  let csv = cabecalho.join(",") + "\n" + linhas.map(l => l.join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "controle_horas_extras.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

window.onload = renderizarTabela;
