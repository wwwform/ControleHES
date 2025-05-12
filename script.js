let registros = [];
const salarioHora = 10; // ajuste conforme necessário
const feriados = ["2025-01-01", "2025-04-21", "2025-05-01", "2025-09-07", "2025-10-12", "2025-11-15", "2025-12-25"];

document.getElementById("data").addEventListener("change", function () {
  const dataSelecionada = new Date(this.value);
  const diaSemana = dataSelecionada.getDay();
  const isFeriado = feriados.includes(this.value);

  if (diaSemana >= 1 && diaSemana <= 5 && !isFeriado) {
    document.getElementById("inicio").value = "17:24";
    document.getElementById("inicio").readOnly = true;
  } else {
    document.getElementById("inicio").value = "";
    document.getElementById("inicio").readOnly = false;
  }
});

document.getElementById("registro-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const usuario = document.getElementById("usuario").value;
  const data = document.getElementById("data").value;
  const inicio = document.getElementById("inicio").value;
  const fim = document.getElementById("fim").value;
  const justificativa = document.getElementById("justificativa").value;

  const h1 = new Date(`1970-01-01T${inicio}:00`);
  const h2 = new Date(`1970-01-01T${fim}:00`);
  const diffMs = h2 - h1;
  const horas = diffMs / (1000 * 60 * 60);

  const diaSemana = new Date(data).getDay();
  const isFeriado = feriados.includes(data);

  let tipo = "75%";
  if (horas > 2 || diaSemana === 0 || diaSemana === 6 || isFeriado) {
    tipo = "100%";
  }

  registros.push({ usuario, data, inicio, fim, justificativa, horas, tipo });
  atualizarTotais();
  this.reset();
});

function atualizarTotais() {
  let total75 = 0, total100 = 0;

  registros.forEach(reg => {
    if (reg.tipo === "75%") total75 += reg.horas;
    else total100 += reg.horas;
  });

  const totalGeral = total75 + total100;

  document.getElementById("total75").innerText = `${total75}h - R$${(total75 * salarioHora * 1.75).toFixed(2)}`;
  document.getElementById("total100").innerText = `${total100}h - R$${(total100 * salarioHora * 2.0).toFixed(2)}`;
  document.getElementById("totalGeral").innerText = `${totalGeral}h - R$${((total75 * 1.75 + total100 * 2.0) * salarioHora).toFixed(2)}`;
}

function exportarRegistros() {
  registros.forEach(reg => {
    const url = `https://docs.google.com/forms/d/e/EXCEL_MODEL_FORM/export?format=xlsx`;

    fetch("/modelo/formlario%20HE%20-%20modelo%20individual%201.xlsx")
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onload = () => {
          const zip = new JSZip();
          zip.loadAsync(reader.result).then(zip => {
            const workbook = XLSX.read(reader.result, { type: "binary" });
            const ws = workbook.Sheets[workbook.SheetNames[0]];
            ws["B7"].v = reg.data;
            ws["F7"].v = reg.inicio;
            ws["K7"].v = reg.fim;
            ws["C9"].v = reg.justificativa;
            XLSX.writeFile(workbook, `HE_${reg.data}.xlsx`);
          });
        };
        reader.readAsBinaryString(blob);
      });
}
