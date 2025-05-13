class GerenciadorHoras {
    constructor() {
        this.registros = JSON.parse(localStorage.getItem('registrosHE')) || [];
        this.feriados = [];
        this.currentUser = null;
        this.init();
    }

    async init() {
        await this.carregarFeriadosAPI();
        this.configurarEventos();
        this.verificarLogin();
    }

    verificarLogin() {
        const user = localStorage.getItem('currentUserHE');
        if (user) {
            this.currentUser = JSON.parse(user);
            this.ocultarLogin();
            this.renderizarTabela();
        }
    }

    configurarEventos() {
        document.getElementById('btnLogin').addEventListener('click', () => this.realizarLogin());
        document.getElementById('btnLogout').addEventListener('click', () => this.realizarLogout());
        document.getElementById('registroForm').addEventListener('submit', (e) => this.salvarRegistro(e));
        document.getElementById('btnImportBackup').addEventListener('change', (e) => this.importarBackup(e));
    }

    async carregarFeriadosAPI() {
        try {
            const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${new Date().getFullYear()}`);
            this.feriados = (await response.json()).map(f => f.date);
        } catch (error) {
            this.feriados = [];
        }
    }

    realizarLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        if (username) {
            this.currentUser = username;
            localStorage.setItem('currentUserHE', JSON.stringify(username));
            this.ocultarLogin();
            this.renderizarTabela();
            this.carregarSalarioUsuario();
        }
    }

    realizarLogout() {
        this.currentUser = null;
        localStorage.removeItem('currentUserHE');
        this.mostrarLogin();
        this.registros = [];
        this.renderizarTabela();
    }

    mostrarLogin() {
        document.getElementById('loginContainer').style.display = 'block';
        document.getElementById('mainContent').style.display = 'none';
    }

    ocultarLogin() {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        document.getElementById('userGreeting').textContent = `Olá, ${this.currentUser}!`;
    }

    carregarSalarioUsuario() {
        const salario = localStorage.getItem(`salarioHE_${this.currentUser}`);
        document.getElementById('salarioAtual').value = salario || '';
    }

    atualizarSalario() {
        const salario = parseFloat(document.getElementById('salarioAtual').value);
        if (!isNaN(salario)) {
            localStorage.setItem(`salarioHE_${this.currentUser}`, salario);
            alert('Salário atualizado!');
        }
    }

    salvarRegistro(e) {
        e.preventDefault();
        const salario = parseFloat(localStorage.getItem(`salarioHE_${this.currentUser}`));
        if (isNaN(salario)) {
            alert('Configure o salário primeiro!');
            return;
        }

        const novoRegistro = {
            id: Date.now(),
            nome: this.currentUser,
            data: document.getElementById('data').value,
            inicio: document.getElementById('horaInicio').value,
            fim: document.getElementById('horaFim').value,
            justificativa: document.getElementById('justificativa').value,
            salarioMensal: salario
        };

        this.registros.push(novoRegistro);
        localStorage.setItem('registrosHE', JSON.stringify(this.registros));
        this.renderizarTabela();
        e.target.reset();
    }

    renderizarTabela() {
        const tbody = document.querySelector('#registros tbody');
        tbody.innerHTML = '';
        this.registros.forEach(registro => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${registro.data}</td>
                <td>${registro.inicio} - ${registro.fim}</td>
                <td>R$ ${this.calcularValor(registro).toFixed(2)}</td>
                <td>${registro.justificativa}</td>
                <td><button class="btn-excluir" onclick="gerenciador.excluirRegistro(${registro.id})">🗑️</button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    calcularValor(registro) {
        const [horaInicio, minutoInicio] = registro.inicio.split(':').map(Number);
        const [horaFim, minutoFim] = registro.fim.split(':').map(Number);
        let minutos = (horaFim * 60 + minutoFim) - (horaInicio * 60 + minutoInicio);
        if (minutos < 0) minutos += 1440;
        const horas = minutos / 60;
        const isFimSemana = [0, 6].includes(new Date(registro.data).getDay());
        const isFeriado = this.feriados.includes(registro.data);
        let valor = 0;

        if (isFimSemana || isFeriado) {
            valor = horas * registro.salarioMensal * 2;
        } else {
            const normal = Math.min(horas, 2);
            const extra = Math.max(horas - 2, 0);
            valor = (normal * 1.75 + extra * 2) * registro.salarioMensal;
        }

        return valor;
    }

    excluirRegistro(id) {
        this.registros = this.registros.filter(r => r.id !== id);
        localStorage.setItem('registrosHE', JSON.stringify(this.registros));
        this.renderizarTabela();
    }

    // Exportações
    exportarExcel() {
        if (!this.currentUser || this.registros.length === 0) {
            alert('Não há dados para exportar');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Horas Extras');
        worksheet.columns = [
            { header: 'Data', key: 'data', width: 15 },
            { header: 'Horário', key: 'horas', width: 20 },
            { header: 'Valor (R$)', key: 'valor', width: 15 },
            { header: 'Tipo', key: 'tipo', width: 10 },
            { header: 'Justificativa', key: 'justificativa', width: 50 }
        ];

        let registrosExport = this.registros;
        if (this.filtroAtivo && this.filtroInicio && this.filtroFim) {
            registrosExport = registrosExport.filter(r => {
                const dataRegistro = new Date(r.data + 'T00:00:00');
                return dataRegistro >= this.filtroInicio && dataRegistro <= this.filtroFim;
            });
        } else {
            const periodo = this.getPeriodoAtual();
            registrosExport = registrosExport.filter(r => this.calcularPeriodo(r.data) === periodo.chave);
        }

        registrosExport.forEach(registro => {
            const result = this.calcularValor(registro);
            worksheet.addRow({
                data: new Date(registro.data + 'T00:00:00').toLocaleDateString('pt-BR'),
                horas: `${registro.inicio} - ${registro.fim}`,
                valor: result.total.toFixed(2),
                tipo: result.tipoExtra,
                justificativa: registro.justificativa
            });
        });

        worksheet.addRow({});
        worksheet.addRow({ data: 'RESUMO:', horas: '', valor: '', tipo: '', justificativa: '' });

        let total75 = 0;
        let total100 = 0;
        registrosExport.forEach(registro => {
            const result = this.calcularValor(registro);
            total75 += result.valor75;
            total100 += result.valor100;
        });

        worksheet.addRow({ data: 'Horas 75%:', horas: '', valor: total75.toFixed(2) });
        worksheet.addRow({ data: 'Horas 100%:', horas: '', valor: total100.toFixed(2) });
        worksheet.addRow({ data: 'TOTAL:', horas: '', valor: (total75 + total100).toFixed(2) });

        workbook.xlsx.writeBuffer().then(buffer => {
            const blob = new Blob([buffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
            saveAs(blob, `horas_extras_${new Date().toISOString().slice(0,10)}.xlsx`);
        });
    }

    exportarPDF() {
        if (!this.currentUser || this.registros.length === 0) {
            alert('Não há dados para exportar');
            return;
        }

        const doc = new jspdf.jsPDF();
        doc.setFontSize(16);
        doc.text('Relatório de Horas Extras', 20, 20);
        doc.setFontSize(12);
        doc.text(`Funcionário: ${this.currentUser}`, 20, 30);

        let registrosExport = this.registros;
        if (this.filtroAtivo && this.filtroInicio && this.filtroFim) {
            registrosExport = registrosExport.filter(r => {
                const dataRegistro = new Date(r.data + 'T00:00:00');
                return dataRegistro >= this.filtroInicio && dataRegistro <= this.filtroFim;
            });
        } else {
            const periodo = this.getPeriodoAtual();
            registrosExport = registrosExport.filter(r => this.calcularPeriodo(r.data) === periodo.chave);
        }

        let y = 50;
        doc.text('Data', 20, y);
        doc.text('Horas', 60, y);
        doc.text('Valor (R$)', 100, y);
        doc.text('Tipo', 140, y);
        y += 10;

        let total75 = 0;
        let total100 = 0;

        registrosExport.forEach(registro => {
            const result = this.calcularValor(registro);
            total75 += result.valor75;
            total100 += result.valor100;

            doc.text(new Date(registro.data + 'T00:00:00').toLocaleDateString('pt-BR'), 20, y);
            doc.text(`${registro.inicio} - ${registro.fim}`, 60, y);
            doc.text(`R$ ${result.total.toFixed(2)}`, 100, y);
            doc.text(result.tipoExtra, 140, y);

            y += 10;
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
        });

        y += 10;
        doc.text('RESUMO:', 20, y);
        y += 10;
        doc.text(`Horas 75%: R$ ${total75.toFixed(2)}`, 20, y);
        y += 10;
        doc.text(`Horas 100%: R$ ${total100.toFixed(2)}`, 20, y);
        y += 10;
        doc.text(`TOTAL: R$ ${(total75 + total100).toFixed(2)}`, 20, y);

        doc.save('relatorio-horas.pdf');
    }

    exportarWord() {
        if (!this.currentUser || this.registros.length === 0) {
            alert('Não há dados para exportar');
            return;
        }

        let registrosExport = this.registros;
        if (this.filtroAtivo && this.filtroInicio && this.filtroFim) {
            registrosExport = registrosExport.filter(r => {
                const dataRegistro = new Date(r.data + 'T00:00:00');
                return dataRegistro >= this.filtroInicio && dataRegistro <= this.filtroFim;
            });
        } else {
            const periodo = this.getPeriodoAtual();
            registrosExport = registrosExport.filter(r => this.calcularPeriodo(r.data) === periodo.chave);
        }

        let total75 = 0;
        let total100 = 0;
        let registrosHTML = '';

        registrosExport.forEach(registro => {
            const result = this.calcularValor(registro);
            total75 += result.valor75;
            total100 += result.valor100;

            registrosHTML += `
                <tr>
                    <td>${new Date(registro.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    <td>${registro.inicio} - ${registro.fim}</td>
                    <td>R$ ${result.total.toFixed(2)}</td>
                    <td>${result.tipoExtra}</td>
                    <td>${registro.justificativa}</td>
                </tr>
            `;
        });

        const content = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
        <head>
            <title>Relatório Horas Extras</title>
            <meta charset="UTF-8">
            <style>
                table {
                    border-collapse: collapse;
                    width: 100%;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                }
            </style>
        </head>
        <body>
            <h1>Relatório de Horas Extras - ${this.currentUser}</h1>
            <table>
                <tr>
                    <th>Data</th>
                    <th>Horas</th>
                    <th>Valor</th>
                    <th>Tipo</th>
                    <th>Justificativa</th>
                </tr>
                ${registrosHTML}
            </table>
            <h3>Resumo</h3>
            <p>Horas 75%: R$ ${total75.toFixed(2)}</p>
            <p>Horas 100%: R$ ${total100.toFixed(2)}</p>
            <p><strong>TOTAL: R$ ${(total75 + total100).toFixed(2)}</strong></p>
        </body></html>
        `;

        const blob = new Blob(['\ufeff', content], {type: 'application/msword'});
        saveAs(blob, 'relatorio-horas.doc');
    }
}


window.gerenciador = new GerenciadorHoras();
window.addEventListener('DOMContentLoaded', () => {
    gerenciador.init();
});
// Inicialização
const gerenciador = new GerenciadorHorasPro();
window.exportarExcel = () => gerenciador.exportarExcel();
window.exportarPDF = () => gerenciador.exportarPDF();
window.exportarWord = () => gerenciador.exportarWord();
window.exportarBackup = () => gerenciador.exportarBackup();
window.aplicarFiltroPersonalizado = function() {
    const inicio = document.getElementById('filtroInicio').value;
    const fim = document.getElementById('filtroFim').value;
    if (inicio && fim) {
        gerenciador.filtrarPorPeriodoPersonalizado(new Date(inicio + 'T00:00:00'), new Date(fim + 'T00:00:00'));
    } else {
        alert('Preencha as duas datas para filtrar!');
    }
};
window.filtrarPorMes = function() {
    const mesAno = document.getElementById('filtroMes').value;
    if (mesAno) gerenciador.filtrarPorMes(mesAno);
};
window.limparFiltros = function() {
    gerenciador.limparFiltros();
};
