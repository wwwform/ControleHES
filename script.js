document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formRegistro");
    const lista = document.getElementById("listaRegistros");
    const horas75Span = document.getElementById("horas75");
    const horas100Span = document.getElementById("horas100");
    const totalHorasSpan = document.getElementById("totalHoras");

    let registros = JSON.parse(localStorage.getItem("registros")) || [];

    const turnoInicio = "07:30";
    const turnoFim = "17:23";

    function salvarRegistros() {
        localStorage.setItem("registros", JSON.stringify(registros));
    }

    function calcularExtras(inicio, fim, data, salario) {
        const dia = new Date(data).getDay(); // 0 = domingo, 6 = sábado
        const isFinalDeSemana = dia === 0 || dia === 6;

        const inicioData = new Date(`${data}T${inicio}`);
        const fimData = new Date(`${data}T${fim}`);
        let diffHoras = (fimData - inicioData) / (1000 * 60 * 60);

        diffHoras = Math.max(0, diffHoras);

        let h75 = 0;
        let h100 = 0;

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

        return { h75, h100, total: h75 + h100 };
    }

    function atualizarResumo() {
        let total75 = 0;
        let total100 = 0;

        registros.forEach(r => {
            total75 += r.h75;
            total100 += r.h100;
        });

        horas75Span.textContent = total75.toFixed(2);
        horas100Span.textContent = total100.toFixed(2);
        totalHorasSpan.textContent = (total75 + total100).toFixed(2);
    }

    function renderizarRegistros() {
        lista.innerHTML = "";
        registros.forEach((r, index) => {
            const li = document.createElement("li");
            li.textContent = `${r.data}: ${r.inicio} - ${r.fim} | 75%: ${r.h75}h, 100%: ${r.h100}h`;
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
        registros.push({
            salario, data, inicio, fim,
            ...calculo
        });

        salvarRegistros();
        renderizarRegistros();
        atualizarResumo();
        form.reset();
    });

    // Inicializar na carga
    renderizarRegistros();
    atualizarResumo();
});
