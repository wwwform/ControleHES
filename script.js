class GerenciadorHoras {
    constructor() {
        this.currentUser = null;
        this.registros = [];
        this.feriados = [];
        this.filtroAtivo = false;
        this.filtroInicio = null;
        this.filtroFim = null;
        this.grafico = null;
        this.init();
    }

    async init() {
        await this.carregarFeriadosAPI();
        this.configurarEventos();
        this.verificarLogin();
        window.initGoogle = () => this.initGoogle();
    }

    initGoogle() {
        google.accounts.id.initialize({
            client_id: 'SEU_CLIENT_ID.apps.googleusercontent.com', // Substitua pelo seu Client ID
            callback: (response) => this.handleGoogleLogin(response)
        });
        google.accounts.id.renderButton(
            document.getElementById('btnGoogleLogin'),
            { theme: 'filled_blue', text: 'continue_with', size: 'large' }
        );
    }

    handleGoogleLogin(response) {
        const { credential } = response;
        const payload = JSON.parse(atob(credential.split('.')[1]));
        this.currentUser = payload.email;
        localStorage.setItem('currentUserHE', JSON.stringify(this.currentUser));
        this.ocultarLogin();
        this.carregarRegistrosUsuario();
        this.renderizarTabela();
    }

    configurarEventos() {
        document.getElementById('btnLogin').addEventListener('click', () => this.realizarLogin());
        document.getElementById('btnLogout').addEventListener('click', () => this.realizarLogout());
        document.getElementById('registroForm').addEventListener('submit', (e) => this.salvarRegistro(e));
        document.getElementById('btnImportBackup').addEventListener('change', (e) => this.importarBackup(e));
        document.getElementById('btnAtualizarSalario').addEventListener('click', () => this.atualizarSalario());
        document.getElementById('btnAddFeriado').addEventListener('click', () => this.adicionarFeriadoPersonalizado());
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
        const senha = document.getElementById('loginSenha').value;

        if (!username || !senha) {
            alert('Preencha todos os campos!');
            return;
        }

        const usuarioSalvo = localStorage.getItem('credenciaisHE_' + username);
        if (usuarioSalvo) {
            const { senha: hashSalvo } = JSON.parse(usuarioSalvo);
            if (btoa(senha) !== hashSalvo) {
                alert('Senha incorreta!');
                return;
            }
        } else {
            localStorage.setItem('credenciaisHE_' + username, JSON.stringify({ senha: btoa(senha) }));
        }

        this.currentUser = username;
        localStorage.setItem('currentUserHE', JSON.stringify(username));
        this.carregarRegistrosUsuario();
        this.ocultarLogin();
        this.carregarSalarioUsuario();
        this.renderizarFeriadosPersonalizados();
        this.renderizarTabela();
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

    carregarRegistrosUsuario() {
        this.registros = JSON.parse(localStorage.getItem('registrosHE_' + this.currentUser)) || [];
    }

    salvarRegistrosUsuario() {
        localStorage.setItem('registrosHE_' + this.currentUser, JSON.stringify(this.registros));
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
            this.renderizarTabela();
        } else {
            alert('Digite um valor válido!');
        }
    }

    getFeriadosPersonalizados() {
        return JSON.parse(localStorage.getItem('feriadosPers_' + this.currentUser)) || [];
    }

    adicionarFeriadoPersonalizado() {
        const input = document.getElementById('novoFeriado');
        const data = input.value;
        if (!data) return;

        let feriadosPers = this.getFeriadosPersonalizados();
        if (!feriadosPers.includes(data)) {
            feriadosPers.push(data);
            localStorage.setItem('feriadosPers_' + this.currentUser, JSON.stringify(feriadosPers));
            this.renderizarFeriadosPersonalizados();
            this.renderizarTabela();
        }
        input.value = '';
    }

    removerFeriadoPersonalizado(data) {
        let feriadosPers = this.getFeriadosPersonalizados();
        feriadosPers = feriadosPers.filter(f => f !== data);
        localStorage.setItem('feriadosPers_' + this.currentUser, JSON.stringify(feriadosPers));
        this.renderizarFeriadosPersonalizados();
        this.renderizarTabela();
    }

    renderizarFeriadosPersonalizados() {
        const ul = document.getElementById('listaFeriadosPersonalizados');
        ul.innerHTML = '';
        const feriados = this.getFeriadosPersonalizados();
        feriados.forEach(data => {
            const li = document.createElement('li');
            li.innerHTML = `${data} <button class="remove-feriado" onclick="gerenciador.removerFeriadoPersonalizado('${data}')">&times;</button>`;
            ul.appendChild(li);
        });
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
        this.salvarRegistrosUsuario();
        this.renderizarTabela();
        e.target.reset();
    }

    calcularValor(registro) {
        const valorHora = registro.salarioMensal / 220;
        const [horaInicio, minutoInicio] = registro.inicio.split(':').map(Number);
        const [horaFim, minutoFim] = registro.fim.split(':').map(Number);

        let minutos = (horaFim * 60 + minutoFim) - (horaInicio * 60 + minutoInicio);
        if (minutos < 0) minutos += 1440;

        const horas = minutos / 60;
        const data = new Date(registro.data + 'T00:00:00');
        const isFimSemana = [0, 6].includes(data.getDay());
        const isFeriado = this.feriados.includes(registro.data);
        const isFeriadoPersonalizado = this.getFeriadosPersonalizados().includes(registro.data);

        let valor75 = 0, valor100 = 0;

        if (isFimSemana || isFeriado || isFeriadoPersonalizado) {
            valor100 = horas * valorHora * 2;
        } else {
            const normal = Math.min(horas, 2);
            const extra = Math.max(horas - 2, 0);
            valor75 = normal * valorHora * 1.75;
            valor100 = extra * valorHora * 2;
        }

        return {
            total: valor75 + valor100,
            valor75,
            valor100,
            tipo: (isFimSemana || isFeriado || isFeriadoPersonalizado) ? '100%' : (horas <= 2 ? '75%' : '75%/100%')
        };
    }

    renderizarTabela() {
        const tbody = document.querySelector('#registros tbody');
        tbody.innerHTML = '';
        let total75 = 0, total100 = 0, totalGeral = 0;

        const registrosFiltrados = this.filtroAtivo ?
            this.registros.filter(r => {
                const dataRegistro = new Date(r.data + 'T00:00:00');
                return dataRegistro >= this.filtroInicio && dataRegistro <= this.filtroFim;
            }) : this.registros;

        registrosFiltrados.forEach(registro => {
            const result = this.calcularValor(registro);
            total75 += result.valor75;
            total100 += result.valor100;
            totalGeral += result.total;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${registro.data}</td>
                <td>${registro.inicio} - ${registro.fim}</td>
                <td title="Salário base: R$ ${registro.salarioMensal.toFixed(2)} | Valor/hora: R$ ${(registro.salarioMensal / 220).toFixed(2)}">
                    R$ ${result.total.toFixed(2)} <span style="color: #666; font-size: 0.9em">${result.tipo}</span>
                </td>
                <td>${registro.justificativa}</td>
                <td><button class="btn-excluir" onclick="gerenciador.excluirRegistro(${registro.id})">🗑️</button></td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('valor75').textContent = total75.toFixed(2);
        document.getElementById('valor100').textContent = total100.toFixed(2);
        document.getElementById('totalGeral').textContent = totalGeral.toFixed(2);

        this.calcularFadiga();
        this.renderizarGrafico();
    }

    calcularFadiga() {
        const registrosFiltrados = this.filtroAtivo ?
            this.registros.filter(r => {
                const dataRegistro = new Date(r.data + 'T00:00:00');
                return dataRegistro >= this.filtroInicio && dataRegistro <= this.filtroFim;
            }) : this.registros;

        let totalHoras = 0;
        let diasConsecutivos = 0;
        let maxConsecutivo = 0;
        let datasOrdenadas = [];

        registrosFiltrados.forEach(registro => {
            const [h1, m1] = registro.inicio.split(':').map(Number);
            const [h2, m2] = registro.fim.split(':').map(Number);
            let minutos = (h2 * 60 + m2) - (h1 * 60 + m1);
            if (minutos < 0) minutos += 1440;
            totalHoras += minutos / 60;
            datasOrdenadas.push(registro.data);
        });

        datasOrdenadas = [...new Set(datasOrdenadas)].sort();
        let currentStreak = 0;
        datasOrdenadas.forEach((data, index) => {
            if (index > 0) {
                const diffDays = (new Date(data) - new Date(datasOrdenadas[index - 1])) / (1000 * 60 * 60 * 24);
                currentStreak = diffDays === 1 ? currentStreak + 1 : 0;
                if (currentStreak > maxConsecutivo) maxConsecutivo = currentStreak;
            }
        });

        let nivel = '🟢 Normal';
        if (totalHoras > 20 || maxConsecutivo >= 5) {
            nivel = '🔴 Crítico';
        } else if (totalHoras > 15 || maxConsecutivo >= 3) {
            nivel = '🟠 Atenção';
        }

        document.getElementById('nivelFadiga').innerHTML = nivel;
    }

    renderizarGrafico() {
        const ctx = document.getElementById('graficoHoras').getContext('2d');
        if (this.grafico) this.grafico.destroy();

        const periodos = {};
        this.registros.forEach(registro => {
            const mes = registro.data.slice(0, 7);
            if (!periodos[mes]) periodos[mes] = { valor75: 0, valor100: 0 };
            const result = this.calcularValor(registro);
            periodos[mes].valor75 += result.valor75;
            periodos[mes].valor100 += result.valor100;
        });

        const labels = Object.keys(periodos);
        const dados75 = labels.map(mes => periodos[mes].valor75);
        const dados100 = labels.map(mes => periodos[mes].valor100);
        const dadosTotal = labels.map(mes => periodos[mes].valor75 + periodos[mes].valor100);

        this.grafico = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Horas 75%',
                        data: dados75,
                        backgroundColor: '#3498db',
                    },
                    {
                        label: 'Horas 100%',
                        data: dados100,
                        backgroundColor: '#e74c3c',
                    },
                    {
                        label: 'Total (Linha)',
                        data: dadosTotal,
                        type: 'line',
                        borderColor: '#2c3e50',
                        borderDash: [5, 5],
                        fill: false
                    }
                ]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => 'R$ ' + value.toFixed(2)
                        }
                    }
                }
            }
        });
    }

    excluirRegistro(id) {
        this.registros = this.registros.filter(r => r.id !== id);
        this.salvarRegistrosUsuario();
        this.renderizarTabela();
    }

    aplicarFiltroPersonalizado() {
        const inicio = document.getElementById('filtroInicio').value;
        const fim = document.getElementById('filtroFim').value;
        if (inicio && fim) {
            this.filtroAtivo = true;
            this.filtroInicio = new Date(inicio + 'T00:00:00');
            this.filtroFim = new Date(fim + 'T00:00:00');
            this.renderizarTabela();
        } else {
            alert('Preencha ambas as datas!');
        }
    }

    filtrarPorMes() {
        const mesAno = document.getElementById('filtroMes').value;
        if (mesAno) {
            const [ano, mes] = mesAno.split('-');
            this.filtroAtivo = true;
            this.filtroInicio = new Date(ano, mes - 1, 1);
            this.filtroFim = new Date(ano, mes, 0);
            this.renderizarTabela();
        }
    }

    limparFiltros() {
        this.filtroAtivo = false;
        this.filtroInicio = null;
        this.filtroFim = null;
        document.getElementById('filtroMes').value = '';
        document.getElementById('filtroInicio').value = '';
        document.getElementById('filtroFim').value = '';
        this.renderizarTabela();
    }

    exportarBackup() {
        if (!this.currentUser) return alert('Faça login primeiro!');
        const blob = new Blob([JSON.stringify(this.registros)], { type: 'application/json' });
        saveAs(blob, `backupHE_${this.currentUser}_${new Date().toISOString().slice(0,10)}.json`);
    }

    importarBackup(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const dados = JSON.parse(event.target.result);
                    this.registros = dados;
                    this.salvarRegistrosUsuario();
                    this.renderizarTabela();
                    alert('Backup importado!');
                } catch (error) {
                    alert('Arquivo inválido!');
                }
            };
            reader.readAsText(file);
        }
    }

    exportarExcel() {
        if (!this.currentUser) return alert('Faça login primeiro!');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Horas Extras');
        worksheet.columns = [
            { header: 'Data', key: 'data', width: 15 },
            { header: 'Horário', key: 'horas', width: 20 },
            { header: 'Valor (R$)', key: 'valor', width: 15 },
            { header: 'Tipo', key: 'tipo', width: 10 },
            { header: 'Justificativa', key: 'justificativa', width: 50 }
        ];

        this.registros.forEach(registro => {
            const result = this.calcularValor(registro);
            worksheet.addRow({
                data: registro.data,
                horas: `${registro.inicio} - ${registro.fim}`,
                valor: result.total.toFixed(2),
                tipo: result.tipo,
                justificativa: registro.justificativa
            });
        });

        workbook.xlsx.writeBuffer().then(buffer => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `horas_extras_${new Date().toISOString().slice(0,10)}.xlsx`);
        });
    }

    exportarPDF() {
        if (!this.currentUser) return alert('Faça login primeiro!');
        const doc = new jspdf.jsPDF();
        doc.setFontSize(16);
        doc.text('Relatório de Horas Extras', 20, 20);
        doc.setFontSize(12);
        let y = 30;
        this.registros.forEach(registro => {
            const result = this.calcularValor(registro);
            doc.text(`${registro.data} - ${registro.inicio} às ${registro.fim}: R$ ${result.total.toFixed(2)} (${result.tipo})`, 20, y);
            y += 10;
        });
        doc.save('relatorio.pdf');
    }

    exportarWord() {
        if (!this.currentUser) return alert('Faça login primeiro!');
        let content = `<h1>Relatório de Horas Extras - ${this.currentUser}</h1><table border="1"><tr><th>Data</th><th>Horas</th><th>Valor</th><th>Tipo</th><th>Justificativa</th></tr>`;
        this.registros.forEach(registro => {
            const result = this.calcularValor(registro);
            content += `<tr><td>${registro.data}</td><td>${registro.inicio}-${registro.fim}</td><td>R$ ${result.total.toFixed(2)}</td><td>${result.tipo}</td><td>${registro.justificativa}</td></tr>`;
        });
        content += '</table>';
        const blob = new Blob([content], { type: 'application/msword' });
        saveAs(blob, 'relatorio.doc');
    }
}

window.gerenciador = new GerenciadorHoras();
window.exportarExcel = () => gerenciador.exportarExcel();
window.exportarPDF = () => gerenciador.exportarPDF();
window.exportarWord = () => gerenciador.exportarWord();
window.exportarBackup = () => gerenciador.exportarBackup();
window.aplicarFiltroPersonalizado = () => gerenciador.aplicarFiltroPersonalizado();
window.filtrarPorMes = () => gerenciador.filtrarPorMes();
window.limparFiltros = () => gerenciador.limparFiltros();
