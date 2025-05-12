// script.js
const USER_KEY = 'currentUserHE';
const BACKUP_KEY = 'heBackup';

class GerenciadorHoras {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem(USER_KEY)) || null;
        this.registros = this.carregarRegistrosUsuario();
        this.feriados = [];
        this.init();
    }

    async init() {
        await this.carregarFeriadosAPI();
        this.renderizarTabela();
        this.configurarEventos();
        this.verificarNotificacoesPeriodo();
        if (!this.currentUser) this.mostrarLogin();
    }

    configurarEventos() {
        document.getElementById('registroForm').addEventListener('submit', (e) => this.salvarRegistro(e));
        document.getElementById('btnLogin').addEventListener('click', () => this.realizarLogin());
        document.getElementById('btnLogout').addEventListener('click', () => this.realizarLogout());
        document.getElementById('btnImportBackup').addEventListener('change', (e) => this.importarBackup(e));
        document.getElementById('btnImportFeriados').addEventListener('click', () => this.carregarFeriadosAPI());
    }

    async carregarFeriadosAPI() {
        try {
            const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${new Date().getFullYear()}`);
            const data = await response.json();
            this.feriados = data.map(f => f.date);
            localStorage.setItem('feriadosHE', JSON.stringify(this.feriados));
        } catch (error) {
            console.error('Erro ao carregar feriados:', error);
            this.feriados = JSON.parse(localStorage.getItem('feriadosHE')) || [];
        }
    }

    realizarLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        if (username) {
            this.currentUser = username;
            localStorage.setItem(USER_KEY, JSON.stringify(username));
            this.registros = this.carregarRegistrosUsuario();
            this.ocultarLogin();
            this.renderizarTabela();
        }
    }

    realizarLogout() {
        this.currentUser = null;
        localStorage.removeItem(USER_KEY);
        this.mostrarLogin();
        this.registros = [];
        this.renderizarTabela();
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
            divNotificacoes.innerHTML = `
                ⚠️ Faltam ${20 - dia} dias para o fechamento do período!
            `;
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

    // Métodos de cálculo e renderização mantidos conforme anterior
    // ... (incluir aqui os métodos calcularPeriodo, calcularValor e renderizarTabela do código anterior)

    exportarExcel() {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Horas Extras');
        
        worksheet.columns = [
            { header: 'Data', key: 'data' },
            { header: 'Horas', key: 'horas' },
            { header: 'Valor', key: 'valor' },
            { header: 'Justificativa', key: 'justificativa' }
        ];
        
        this.registros.forEach(registro => {
            worksheet.addRow({
                data: new Date(registro.data).toLocaleDateString(),
                horas: `${registro.inicio} - ${registro.fim}`,
                valor: this.calcularValor(registro).toFixed(2),
                justificativa: registro.justificativa
            });
        });
        
        workbook.xlsx.writeBuffer().then(buffer => {
            const blob = new Blob([buffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
            saveAs(blob, 'horas-extras.xlsx');
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
                `${new Date(registro.data).toLocaleDateString()} - ${registro.inicio} às ${registro.fim} - R$ ${this.calcularValor(registro).toFixed(2)}`, 
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
                <p>${new Date(registro.data).toLocaleDateString()} | 
                ${registro.inicio} - ${registro.fim} | 
                Valor: R$ ${this.calcularValor(registro).toFixed(2)}<br>
                <em>Justificativa:</em> ${registro.justificativa}</p>
            `).join('')}
        </body></html>
        `;
        
        const blob = new Blob(['\ufeff', content], {type: 'application/msword'});
        saveAs(blob, 'relatorio-horas.doc');
    }

    mostrarLogin() {
        document.getElementById('loginContainer').style.display = 'block';
        document.getElementById('mainContent').style.display = 'none';
    }

    ocultarLogin() {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
    }
}

// Inicialização
const gerenciador = new GerenciadorHoras();

// Funções globais
function exportarExcel() { gerenciador.exportarExcel(); }
function exportarPDF() { gerenciador.exportarPDF(); }
function exportarWord() { gerenciador.exportarWord(); }
function exportarBackup() { gerenciador.exportarBackup(); }
