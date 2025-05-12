class GerenciadorHorasPro {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUserHE')) || null;
        this.registros = this.carregarRegistrosUsuario();
        this.feriados = JSON.parse(localStorage.getItem('feriadosHE')) || [];
        this.init();
    }

    async init() {
        await this.carregarFeriadosAPI();
        this.configurarEventos();
        this.verificarNotificacoesPeriodo();
        this.renderizarTabela();
        if (!this.currentUser) this.mostrarLogin();
        else this.ocultarLogin();
    }

    configurarEventos() {
        document.getElementById('registroForm').addEventListener('submit', (e) => this.salvarRegistro(e));
        document.getElementById('btnLogin').addEventListener('click', () => this.realizarLogin());
        document.getElementById('btnLogout').addEventListener('click', () => this.realizarLogout());
        document.getElementById('btnImportBackup').addEventListener('change', (e) => this.importarBackup(e));
    }

    async carregarFeriadosAPI() {
        try {
            const ano = new Date().getFullYear();
            const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`);
            if (!response.ok) throw new Error('Falha na API');
            const data = await response.json();
            this.feriados = data.map(f => f.date);
            localStorage.setItem('feriadosHE', JSON.stringify(this.feriados));
        } catch (error) {
            // fallback: mantém lista local
        }
    }

    realizarLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        if (username) {
            this.currentUser = username;
            localStorage.setItem('currentUserHE', JSON.stringify(username));
            this.registros = this.carregarRegistrosUsuario();
            this.ocultarLogin();
            this.renderizarTabela();
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
    }

    carregarRegistrosUsuario() {
        return this.currentUser ? 
            JSON.parse(localStorage.getItem(`registrosHE_${this.currentUser}`)) || [] : [];
    }

    salvarRegistro(e) {
        e.preventDefault();
        if (!this.currentUser) return alert('Faça login primeiro!');
        const novoRegistro = {
            id: Date.now(),
            nome: this.currentUser,
            data: document.getElementById('data').value,
            inicio: document.getElementById('horaInicio').value,
            fim: document.getElementById('horaFim').value,
            justificativa: document.getElementById('justificativa').value,
            salarioHora: parseFloat(document.getElementById('salarioHora').value),
        };
        this.registros.push(novoRegistro);
        localStorage.setItem(`registrosHE_${this.currentUser}`, JSON.stringify(this.registros));
        this.renderizarTabela();
        e.target.reset();
    }

    verificarNotificacoesPeriodo() {
        const hoje = new Date();
        const dia = hoje.getDate();
        const divNotificacoes = document.getElementById('notificacoes');
        if (dia >= 18 && dia <= 20) {
            divNotificacoes.innerHTML = `⚠️ Faltam ${20 - dia} dias para o fechamento do período!`;
        } else {
            divNotificacoes.innerHTML = '';
        }
    }

    exportarBackup() {
        const blob = new Blob([JSON.stringify(this.registros)], {type: 'application/json'});
        saveAs(blob, `backupHE_${this.currentUser}_${Date.now()}.json`);
    }

    importarBackup(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const dados = JSON.parse(event.target.result);
                    this.registros = dados;
                    localStorage.setItem(`registrosHE_${this.currentUser}`, JSON.stringify(dados));
                    this.renderizarTabela();
                } catch (error) {
                    alert('Arquivo inválido!');
                }
            };
            reader.readAsText(file);
        }
    }

    calcularPeriodo(data) {
        const date = new Date(data);
        return date.getDate() >= 21 ? 
            `${date.getMonth() + 1}-${date.getMonth() + 2}` : 
            `${date.getMonth()}-${date.getMonth() + 1}`;
    }

    calcularValor(registro) {
        const [horaInicio, minutoInicio] = registro.inicio.split(':').map(Number);
        const [horaFim, minutoFim] = registro.fim.split(':').map(Number);
        let minutosTotais = (horaFim * 60 + minutoFim) - (horaInicio * 60 + minutoInicio);
        if (minutosTotais < 0) minutosTotais += 1440; // turno noturno
        const data = new Date(registro.data);
        const isFimSemana = data.getDay() === 0 || data.getDay() === 6;
        const isFeriado = this.feriados.includes(registro.data);
        const salario = registro.salarioHora;
        const horas = minutosTotais / 60;
        if (isFimSemana || isFeriado) {
            return horas * salario * 1.0;
        } else {
            const excedente = Math.max(horas - 2, 0);
            return (Math.min(horas, 2) * 0.75 + excedente * 1.0) * salario;
        }
    }

    renderizarTabela() {
        const tbody = document.querySelector('#registros tbody');
        tbody.innerHTML = '';
        let total75 = 0;
        let total100 = 0;
        let totalGeral = 0;
        // Período atual
        const hoje = new Date();
        const periodoAtual = hoje.getDate() >= 21 ? 
            `${hoje.getMonth() + 1}-${hoje.getMonth() + 2}` : 
            `${hoje.getMonth()}-${hoje.getMonth() + 1}`;
        this.registros
            .filter(r => this.calcularPeriodo(r.data) === periodoAtual)
            .forEach(registro => {
                const valor = this.calcularValor(registro);
                const dataObj = new Date(registro.data);
                const isFimSemana = dataObj.getDay() === 0 || dataObj.getDay() === 6;
                const isFeriado = this.feriados.includes(registro.data);
                let tipoExtra = '';
                if (isFimSemana || isFeriado || ((valor / registro.salarioHora) > 2 * 0.75)) {
                    total100 += valor;
                    tipoExtra = '100%';
                } else {
                    total75 += valor;
                    tipoExtra = '75%';
                }
                totalGeral += valor;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${dataObj.toLocaleDateString('pt-BR')}</td>
                    <td>${registro.inicio} - ${registro.fim}</td>
                    <td>R$ ${valor.toFixed(2)} <span style="font-size:0.9em;color:#888;">${tipoExtra}</span></td>
                    <td>${registro.justificativa}</td>
                `;
                tbody.appendChild(tr);
            });
        document.getElementById('valor75').textContent = total75.toFixed(2);
        document.getElementById('valor100').textContent = total100.toFixed(2);
        document.getElementById('totalGeral').textContent = totalGeral.toFixed(2);
    }

    exportarExcel() {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Horas Extras');
        worksheet.columns = [
            { header: 'Data', key: 'data', width: 15 },
            { header: 'Horário', key: 'horas', width: 20 },
            { header: 'Valor (R$)', key: 'valor', width: 15 },
            { header: 'Justificativa', key: 'justificativa', width: 50 }
        ];
        this.registros.forEach(registro => {
            worksheet.addRow({
                data: new Date(registro.data).toLocaleDateString('pt-BR'),
                horas: `${registro.inicio} - ${registro.fim}`,
                valor: this.calcularValor(registro).toFixed(2),
                justificativa: registro.justificativa
            });
        });
        workbook.xlsx.writeBuffer().then(buffer => {
            const blob = new Blob([buffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
            saveAs(blob, `horas_extras_${new Date().toISOString().split('T')[0]}.xlsx`);
        });
    }

    exportarPDF() {
        const doc = new jspdf.jsPDF();
        doc.setFontSize(16);
        doc.text('Relatório de Horas Extras', 20, 20);
        doc.setFontSize(12);
        let y = 30;
        this.registros.forEach(registro => {
            doc.text(
                `${new Date(registro.data).toLocaleDateString('pt-BR')} - ${registro.inicio} às ${registro.fim} - R$ ${this.calcularValor(registro).toFixed(2)}`, 
                20, y
            );
            y += 10;
        });
        doc.save('relatorio-horas.pdf');
    }

    exportarWord() {
        const content = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
        <head><title>Relatório Horas Extras</title></head>
        <body>
            <h1>Relatório de Horas Extras - ${this.currentUser}</h1>
            ${this.registros.map(registro => `
                <p>${new Date(registro.data).toLocaleDateString('pt-BR')} | 
                ${registro.inicio} - ${registro.fim} | 
                Valor: R$ ${this.calcularValor(registro).toFixed(2)}<br>
                <em>Justificativa:</em> ${registro.justificativa}</p>
            `).join('')}
        </body></html>
        `;
        const blob = new Blob(['\ufeff', content], {type: 'application/msword'});
        saveAs(blob, 'relatorio-horas.doc');
    }
}

// Inicialização
const gerenciador = new GerenciadorHorasPro();

// Interface Global
window.exportarExcel = () => gerenciador.exportarExcel();
window.exportarPDF = () => gerenciador.exportarPDF();
window.exportarWord = () => gerenciador.exportarWord();
window.exportarBackup = () => gerenciador.exportarBackup();
