const registrosKey = 'registros_he';
const feriados = ['2025-01-01', '2025-04-21', '2025-05-01', '2025-09-07', '2025-10-12', '2025-11-02', '2025-11-15', '2025-12-25'];

function isFinalDeSemana(data) {
    const dia = new Date(data).getDay();
    return dia === 0 || dia === 6;
}

function isFeriado(data) {
    return feriados.includes(data);
}

document.getElementById('data').addEventListener('change', function() {
    const dataSelecionada = this.value;
    if (!isFinalDeSemana(dataSelecionada) && !isFeriado(dataSelecionada)) {
        document.getElementById('inicio').value = "17:24";
    }
});

function salvarRegistro() {
    const data = document.getElementById('data').value;
    const inicio = document.getElementById('inicio').value;
    const fim = document.getElementById('fim').value;
    const salario = parseFloat(document.getElementById('salario').value);
    const justificativa = document.getElementById('justificativa').value;
    const usuario = document.getElementById('usuario').value;

    if (!data || !inicio || !fim || !salario || !justificativa || !usuario) {
        alert("Preencha todos os campos!");
        return;
    }

    const hInicio = parseFloat(inicio.replace(":", "."));
    const hFim = parseFloat(fim.replace(":", "."));
    const hTotal = hFim - hInicio;

    let h75 = 0;
    let h100 = 0;

    if (isFinalDeSemana(data) || isFeriado(data)) {
        h100 = hTotal;
    } else {
        if (hTotal <= 2) {
            h75 = hTotal;
        } else {
            h75 = 2;
            h100 = hTotal - 2;
        }
    }

    const valorHora = salario / 220;
    const valor75 = h75 * valorHora * 1.75;
    const valor100 = h100 * valorHora * 2.0;
    const total = valor75 + valor100;

    const registro = {
        data, inicio, fim, h75, h100, salario, valor75, valor100, total, justificativa, usuario
    };

    const registros = JSON.parse(localStorage.getItem(registrosKey)) || [];
    registros.push(registro);
    localStorage.setItem(registrosKey, JSON.stringify(registros));
    renderizarRegistros();
}

function renderizarRegistros() {
    const registros = JSON.parse(localStorage.getItem(registrosKey)) || [];
    const container = document.getElementById('registrosContainer');
    container.innerHTML = "";

    const tabela = document.createElement('table');
    const header = `
        <tr>
            <th>Data</th><th>Início</th><th>Fim</th><th>Horas</th><th>Valor 75%</th>
            <th>Valor 100%</th><th>Total</th><th>Motivo</th><th>Usuário</th><th>Período</th>
        </tr>`;
    tabela.innerHTML = header;

    registros.forEach(reg => {
        const data = new Date(reg.data);
        const dia = data.getDate().toString().padStart(2, '0');
        const mes = (data.getMonth() + 1).toString().padStart(2, '0');
        const ano = data.getFullYear();

        const dataFormatada = `${ano}-${mes}-${dia}`;
        const periodo = `2025-04-21 a 2025-05-20`;  // fixo por enquanto

        const row = `
            <tr>
                <td>${dataFormatada}</td>
                <td>${reg.inicio}</td>
                <td>${reg.fim}</td>
                <td>${(reg.h75 + reg.h100).toFixed(2)}</td>
                <td>R$ ${reg.valor75.toFixed(2).replace(".", ",")}</td>
                <td>R$ ${reg.valor100.toFixed(2).replace(".", ",")}</td>
                <td>R$ ${reg.total.toFixed(2).replace(".", ",")}</td>
                <td>${reg.justificativa}</td>
                <td>${reg.usuario}</td>
                <td>${periodo}</td>
            </tr>`;

        tabela.innerHTML += row;
    });

    container.appendChild(tabela);
}

async function exportarExcel() {
    const registros = JSON.parse(localStorage.getItem(registrosKey)) || [];
    if (registros.length === 0) return alert("Nenhum registro para exportar!");

    const { Workbook } = window.ExcelJS;
    const workbook = new Workbook();
    const template = await fetch("formlario HE - modelo individual 1.xlsx").then(res => res.arrayBuffer());

    const blob = new Blob([template]);
    const buffer = await blob.arrayBuffer();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.worksheets[0];
    const ultimo = worksheet.lastRow.number + 1;

    const reg = registros[registros.length - 1];

    worksheet.getCell("C6").value = new Date(reg.data);
    worksheet.getCell("C7").value = reg.inicio;
    worksheet.getCell("C8").value = reg.fim;
    worksheet.getCell("C9").value = reg.justificativa;

    const blobFinal = await workbook.xlsx.writeBuffer();
    const a = document.createElement("a");
    const url = URL.createObjectURL(new Blob([blobFinal]));
    a.href = url;
    a.download = "registro_he.xlsx";
    a.click();
    URL.revokeObjectURL(url);
}

renderizarRegistros();