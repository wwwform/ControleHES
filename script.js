
function salvarRegistro() {
    const data = document.getElementById('data').value;
    const inicio = document.getElementById('inicio').value;
    const fim = document.getElementById('fim').value;
    const salario = parseFloat(document.getElementById('salario').value);
    const motivo = document.getElementById('motivo').value;
    const usuario = "Wildner Barbieri";

    if (!data || !inicio || !fim || !salario || !motivo) {
        alert("Preencha todos os campos.");
        return;
    }

    const horaInicio = parseFloat(inicio.split(":")[0]) + parseFloat(inicio.split(":")[1]) / 60;
    const horaFim = parseFloat(fim.split(":")[0]) + parseFloat(fim.split(":")[1]) / 60;
    let horasTrabalhadas = horaFim - horaInicio;

    const dia = new Date(data).getDay();
    const ehFds = dia === 0 || dia === 6;
    const h75 = !ehFds ? Math.min(horasTrabalhadas, 2) : 0;
    const h100 = horasTrabalhadas - h75;

    const valorHora = salario / 220;
    const valor75 = valorHora * h75 * 1.75;
    const valor100 = valorHora * h100 * 2.0;
    const total = valor75 + valor100;

    const periodo = calcularPeriodo(data);

    const registro = {
        data, inicio, fim,
        horas: horasTrabalhadas.toFixed(2),
        v75: valor75.toFixed(2),
        v100: valor100.toFixed(2),
        total: total.toFixed(2),
        motivo,
        usuario,
        periodo
    };

    let registros = JSON.parse(localStorage.getItem("registros") || "[]");
    registros.push(registro);
    localStorage.setItem("registros", JSON.stringify(registros));

    renderizarTabela();
}

function calcularPeriodo(data) {
    const d = new Date(data);
    let ano = d.getFullYear();
    let mes = d.getMonth();
    let inicio, fim;

    if (d.getDate() > 20) {
        inicio = new Date(ano, mes, 21);
        fim = new Date(ano, mes + 1, 20);
    } else {
        inicio = new Date(ano, mes - 1, 21);
        fim = new Date(ano, mes, 20);
    }

    return `${inicio.toISOString().slice(0,10)} a ${fim.toISOString().slice(0,10)}`;
}

function renderizarTabela() {
    const tbody = document.querySelector("#tabela-registros tbody");
    tbody.innerHTML = "";

    const registros = JSON.parse(localStorage.getItem("registros") || "[]");

    let soma75 = 0;
    let soma100 = 0;
    let somaTotal = 0;

    registros.forEach(reg => {
        soma75 += parseFloat(reg.v75);
        soma100 += parseFloat(reg.v100);
        somaTotal += parseFloat(reg.total);

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${reg.data}</td>
            <td>${reg.inicio}</td>
            <td>${reg.fim}</td>
            <td>${reg.horas}</td>
            <td>R$ ${parseFloat(reg.v75).toFixed(2)}</td>
            <td>R$ ${parseFloat(reg.v100).toFixed(2)}</td>
            <td>R$ ${parseFloat(reg.total).toFixed(2)}</td>
            <td>${reg.motivo}</td>
            <td>${reg.usuario}</td>
            <td>${reg.periodo}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById("soma-geral").innerHTML = `
        <strong>Total 75%:</strong> R$ ${soma75.toFixed(2)} |
        <strong>Total 100%:</strong> R$ ${soma100.toFixed(2)} |
        <strong>Total Geral:</strong> R$ ${somaTotal.toFixed(2)}
    `;
}

function exportarParaExcel() {
    const registros = JSON.parse(localStorage.getItem("registros") || "[]");

    if (registros.length === 0) {
        alert("Nenhum registro para exportar.");
        return;
    }

    let csv = "Data,Início,Fim,Horas,Valor 75%,Valor 100%,Total,Motivo,Usuário,Período\n";
    registros.forEach(r => {
        csv += `${r.data},${r.inicio},${r.fim},${r.horas},${r.v75},${r.v100},${r.total},${r.motivo},${r.usuario},${r.periodo}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "horas_extras.csv";
    a.click();
}

document.addEventListener("DOMContentLoaded", renderizarTabela);
