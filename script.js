document.addEventListener("DOMContentLoaded", () => {
  const dataInput = document.getElementById("data");
  const horaInicioInput = document.getElementById("horaInicio");
  const salvarBtn = document.getElementById("salvar");
  const exportarBtn = document.getElementById("exportar");
  const tabela = document.querySelector("#tabela tbody");

  const feriados = [
    "2025-01-01", "2025-04-21", "2025-05-01", "2025-09-07",
    "2025-10-12", "2025-11-02", "2025-11-15", "2025-12-25"
  ];

  dataInput.addEventListener("change", () => {
    const data = new Date(dataInput.value);
    const dia = data.getDay();
    const isFeriado = feriados.includes(dataInput.value);

    if (dia >= 1 && dia <= 5 && !isFeriado) {
      horaInicioInput.value = "17:24";
    }
  });

  salvarBtn.addEventListener("click", () => {
    const usuario = document.getElementById("usuario").value;
    const data = dataInput.value;
    const inicio = document.getElementById("horaInicio").value;
    const fim = document.getElementById("horaFim").value;
    const salario = parseFloat(document.getElementById("salario").value);
    const justificativa = document.getElementById("justificativa").value;

    if (!data || !inicio || !fim || !salario || !justificativa || !usuario) return;

    const hora1 = new Date(`1970-01-01T${inicio}:00`);
    const hora2 = new Date(`1970-01-01T${fim}:00`);
    let diff = (hora2 - hora1) / (1000 * 60 * 60);

    if (diff <= 0) return;

    let h75 = Math.min(diff, 2);
    let h100 = Math.max(0, diff - 2);

    const valorHora = salario / 220;
    const valor75 = h75 * valorHora * 1.75;
    const valor100 = h100 * valorHora * 2;
    const total = valor75 + valor100;

    const dataObj = new Date(data);
    const periodoInicio = new Date(dataObj.getFullYear(), dataObj.getMonth() - (dataObj.getDate() < 21 ? 1 : 0), 21);
    const periodoFim = new Date(periodoInicio.getFullYear(), periodoInicio.getMonth() + 1, 20);

    const periodoFormatado = `${formatarData(periodoInicio)} a ${formatarData(periodoFim)}`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${data}</td>
      <td>${inicio}</td>
      <td>${fim}</td>
      <td>${diff.toFixed(2)}</td>
      <td>R$ ${valor75.toFixed(2)}</td>
      <td>R$ ${valor100.toFixed(2)}</td>
      <td>R$ ${total.toFixed(2)}</td>
      <td>${justificativa}</td>
      <td>${usuario}</td>
      <td>${periodoFormatado}</td>
    `;
    tabela.appendChild(tr);

    localStorage.setItem("registros", tabela.innerHTML);
  });

  exportarBtn.addEventListener("click", () => {
    const XLSX = window.XLSX;
    const registros = Array.from(document.querySelectorAll("#tabela tbody tr"));
    if (registros.length === 0) return;

    registros.forEach(row => {
      const data = row.children[0].textContent;
      const inicio = row.children[1].textContent;
      const fim = row.children[2].textContent;
      const justificativa = row.children[7].textContent;

      const novaPlanilha = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([
        ["DATA", "HORA INICIO", "HORA FIM", "JUSTIFICATIVA"],
        [data, inicio, fim, justificativa]
      ]);
      XLSX.utils.book_append_sheet(novaPlanilha, worksheet, "Registro");

      const nomeArquivo = `registro-${data}.xlsx`;
      XLSX.writeFile(novaPlanilha, nomeArquivo);
    });
  });

  function formatarData(data) {
    return data.toISOString().split("T")[0];
  }

  // Carregar registros antigos
  const registrosSalvos = localStorage.getItem("registros");
  if (registrosSalvos) {
    tabela.innerHTML = registrosSalvos;
  }
});
