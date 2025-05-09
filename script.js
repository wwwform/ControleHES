document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formRegistro");
    const lista = document.getElementById("listaRegistros");
    const horas75Span = document.getElementById("horas75");
    const horas100Span = document.getElementById("horas100");
    const totalHorasSpan = document.getElementById("totalHoras");
    const valorTotalSpan = document.getElementById("valorTotal");

    const exportarBtn = document.getElementById("exportarExcel");
    const limparBtn = document.getElementById("limparDados");

    let registros = JSON.parse(localStorage.getItem("registros")) || [];

    function salvarRegistros() {
        localStorage.setItem("registros", JSON.stringify(registros));
    }

    function calcularExtras(inicio, fim, data, salario) {
        const dia = new Date(data).getDay();
        const isFinalDeSemana = dia === 0 || dia === 6;
        const inicioData = new Date(`${data}T${inicio}`);
        const fimData = new Date(`${data}T${fim}`);
        let diffHoras = (fimData - inicioData) / (1000 * 60 * 60);
        diffHoras = Math.max(0, diffHoras);

        let h75 = 0, h100 = 0;

        if (isFinalDeSemana) {
            h100 = diffHoras;
        } else {
            if (diffHoras <= 2) {
                h75 = diffHoras;
            } else {
                h75 = 2;
                h100 = diffHoras - 2;
            }
        }

        const valorHora = salario / 220;
        const valor75 = h75 * valorHora * 1.75;
        const valor100 = h100 * valorHora * 2;

        return { h75, h100, total: h75 + h100, valor75, valor100 };
    }

    function atualizarResumo() {
        let total75 = 0, total100 = 0, valorTotal = 0;
        registros.forEach(r => {
            total75 += r.h75;
            total100 += r.h100;
            valorTotal += r.valor75 + r.valor100;
        });

        horas75Span.textContent = total75.toFixed(2);
        horas100Span.textContent = total100.toFixed(2);
        totalHorasSpan.textContent = (total75 + total100).toFixed(2);
        valorTotalSpan.textContent = valorTotal.toFixed(2);
    }

    function renderizarRegistros() {
        lista.innerHTML = "";
        registros.forEach((r, index) => {
            const li = document.createElement("li");
            li.textContent = `${r.data}: ${r.inicio} - ${r.fim} | 75%: ${r.h75.toFixed(2)}h, 100%: ${r.h100.toFixed(2)}h`;
            lista.appendChild(li);
        });
    }

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const salario = parseFloat(document.getElementById("salario").value);
        const data = document.getElementById("data").value;
        const inicio = document.getElementById("inicio").value;
        const fim = document.getElementById("fim").value;

        if (!salario || !data || !inicio || !fim) return;

        const calculo = calcularExtras(inicio, fim, data, salario);
        registros.push({ salario, data, inicio, fim, ...calculo });
        salvarRegistros();
        renderizarRegistros();
        atualizarResumo();
        form.reset();
    });

    exportarBtn.addEventListener("click", () => {
        const ws = XLSX.utils.json_to_sheet(registros);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Horas Extras");
        XLSX.writeFile(wb, "horas_extras.xlsx");
    });

    limparBtn.addEventListener("click", () => {
        if (confirm("Tem certeza que deseja apagar todos os registros?")) {
            registros = [];
            salvarRegistros();
            renderizarRegistros();
            atualizarResumo();
        }
    });

    renderizarRegistros();
    atualizarResumo();
});
