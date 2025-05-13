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
            console.warn('Usando feriados locais:', error);
            // Se falhar, usa feriados fixos
            if (!this.feriados || this.feriados.length === 0) {
                const anoAtual = new Date().getFullYear();
                this.feriados = [
                    `${anoAtual}-01-01`, // Ano Novo
                    `${anoAtual}-04-21`, // Tiradentes
                    `${anoAtual}-05-01`, // Dia do Trabalho
                    `${anoAtual}-09-07`, // Independência
                    `${anoAtual}-10-12`, // Nossa Senhora
                    `${anoAtual}-11-02`, // Finados
                    `${anoAtual}-11-15`, // Proclamação da República
                    `${anoAtual}-12-25`  // Natal
                ];
                localStorage.setItem('feriadosHE', JSON.stringify(this.feriados));
            }
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
            document.getElementById('userGreeting').textContent = `Olá, ${username}!`;
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
            salarioMensal: parseFloat(document.getElementById('salarioMensal').value)
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
            divNotificacoes.style.display = 'block';
            divNotificacoes.innerHTML = `⚠️ Faltam ${20 - dia} dias para o fechamento do período!`;
        } else {
            divNotificacoes.style.display = 'none';
        }
    }

    exportarBackup() {
        if (!this.currentUser || this.registros.length === 0) {
            alert('Não há dados para exportar.');
            return;
        }
        const blob = new Blob([JSON.stringify(this.registros)], {type: 'application/json'});
        saveAs(blob, `backupHE_${this.currentUser}_${new Date().toISOString().slice(0,10)}.json`);
    }

    importarBackup(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const dados = JSON.parse(event.target.result);
                    if (Array.isArray(dados)) {
                        this.registros = dados;
                        localStorage.setItem(`registrosHE_${this.currentUser}`, JSON.stringify(dados));
                        this.renderizarTabela();
                        alert('Backup importado com sucesso!');
                    } else {
                        throw new Error('Formato inválido');
                    }
                } catch (error) {
                    alert('Arquivo de backup inválido!');
                }
            };
            reader.readAsText(file);
        }
    }

    calcularPeriodo(data) {
        const date = new Date(data);
        // Ajustando para considerar o mês real (21/mês atual a 20/próximo mês)
        if (date.getDate() >= 21) {
            const mesAtual = date.getMonth();
            const mesSeguinte = (mesAtual + 1) % 12;
            return `${mesAtual}-${mesSeguinte}`;
        } else {
            const mesAtual = date.getMonth();
            const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
            return `${mesAnterior}-${mesAtual}`;
        }
    }

    getPeriodoAtual() {
        const hoje = new Date();
        let mesInicio, mesFim, anoInicio, anoFim;
        
        if (hoje.getDate() >= 21) {
            mesInicio = hoje.getMonth() + 1; // Mês atual (1-12)
            mesFim = (hoje.getMonth() + 2 > 12) ? (hoje.getMonth() + 2 - 12) : hoje.getMonth() + 2; // Próximo mês
            anoInicio = hoje.getFullYear();
            anoFim = (hoje.getMonth() + 1 === 12) ? hoje.getFullYear() + 1 : hoje.getFullYear();
        } else {
            mesInicio = hoje.getMonth(); // Mês anterior (0-11)
            mesFim = hoje.getMonth() + 1; // Mês atual
            anoInicio = (hoje.getMonth() === 0) ? hoje.getFullYear() - 1 : hoje.getFullYear();
            anoFim = hoje.getFullYear();
        }
        
        return {
            texto: `📊 Resumo do Período (21/${String(mesInicio).padStart(2, '0')}/${anoInicio} a 20/${String(mesFim).padStart(2, '0')}/${anoFim})`,
            chave: `${mesInicio - 1}-${mesFim - 1}` // Ajustado para o formato interno (0-11)
        };
    }

    // CORREÇÃO NA FUNÇÃO DE CÁLCULO DE VALOR
    calcularValor(registro) {
        // Cálculo do valor/hora (usando 220h fixo)
        const JORNADA_MENSAL = 220;
        const valorHora = registro.salarioMensal / JORNADA_MENSAL;
        
        // Cálculo das horas trabalhadas
        const [horaInicio, minutoInicio] = registro.inicio.split(':').map(Number);
        const [horaFim, minutoFim] = registro.fim.split(':').map(Number);
        
        let minutosTotais = (horaFim * 60 + minutoFim) - (horaInicio * 60 + minutoInicio);
        if (minutosTotais < 0) minutosTotais += 1440; // Ajuste para turno noturno
        
        const horasTotais = minutosTotais / 60;
        
        // Verificação de fim de semana ou feriado
        const data = new Date(registro.data);
        const diaSemana = data.getDay(); // 0 = domingo, 6 = sábado
        const isFimSemana = diaSemana === 0 || diaSemana === 6;
        const isFeriado = this.feriados.includes(registro.data);
        
        // Cálculo dos valores conforme a regra:
        // Dia de semana normal: 75% até 2h, 100% acima
        // Fim de semana/feriado: sempre 100%
        let valor75 = 0;
        let valor100 = 0;
        
        if (isFimSemana || isFeriado) {
            // Fim de semana ou feriado: 100% para todas as horas
            valor100 = horasTotais * valorHora * 2; // Dobro do valor da hora
        } else {
            // Dia de semana normal: 75% até 2h, 100% acima
            if (horasTotais <= 2) {
                // Até 2h: 75% adicional
                valor75 = horasTotais * valorHora * 1.75; // 1.75 = valor normal + 75%
            } else {
                // Primeiras 2h: 75% adicional
                valor75 = 2 * valorHora * 1.75;
                // Horas acima de 2h: 100% adicional
                valor100 = (horasTotais - 2) * valorHora * 2; // 2 = valor normal + 100%
            }
        }
        
        return {
            valor75: valor75,
            valor100: valor100,
            total: valor75 + valor100,
            horas: horasTotais,
            tipoExtra: (isFimSemana || isFeriado) ? '100%' : (horasTotais <= 2 ? '75%' : 'misto')
        };
    }

    renderizarTabela() {
        const tbody = document.querySelector('#registros tbody');
        tbody.innerHTML = '';
        let total75 = 0;
        let total100 = 0;
        let totalGeral = 0;
        
        // Obtém o período atual
        const periodo = this.getPeriodoAtual();
        document.getElementById('periodoResumo').textContent = periodo.texto;
        
        // Filtra registros do período atual
        const registrosPeriodo = this.registros.filter(r => this.calcularPeriodo(r.data) === periodo.chave);
        
        if (registrosPeriodo.length === 0) {
            document.getElementById('valor75').textContent = '0.00';
            document.getElementById('valor100').textContent = '0.00';
            document.getElementById('totalGeral').textContent = '0.00';
            return;
        }
        
        // Processa cada registro
        registrosPeriodo.forEach(registro => {
            const result = this.calcularValor(registro);
            
            // Acumula os totais
            total75 += result.valor75;
            total100 += result.valor100;
            totalGeral += result.total;
            
            // Cria a linha da tabela
            const dataObj = new Date(registro.data);
            const tr = document.createElement('tr');
            
            let tipoExtraTexto = '';
            if (result.tipoExtra === '100%') {
                tipoExtraTexto = '100%';
            } else if (result.tipoExtra === '75%') {
                tipoExtraTexto = '75%';
            } else {
                tipoExtraTexto = '75%/100%';
            }
            
            tr.innerHTML = `
                <td>${dataObj.toLocaleDateString('pt-BR')}</td>
                <td>${registro.inicio} - ${registro.fim}</td>
                <td>R$ ${result.total.toFixed(2)} <span style="font-size:0.9em;color:#888;">${tipoExtraTexto}</span></td>
                <td>${registro.justificativa}</td>
            `;
            
            tbody.appendChild(tr);
        });
        
        // Atualiza o resumo
        document.getElementById('valor75').textContent = total75.toFixed(2);
        document.getElementById('valor100').textContent = total100.toFixed(2);
        document.getElementById('totalGeral').textContent = totalGeral.toFixed(2);
    }

    exportarExcel() {
        if (!this.currentUser || this.registros.length === 0) {
            alert('Não há dados para exportar');
            return;
        }
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Horas Extras');
        
        // Cabeçalhos
        worksheet.columns = [
            { header: 'Data', key: 'data', width: 15 },
            { header: 'Horário', key: 'horas', width: 20 },
            { header: 'Valor (R$)', key: 'valor', width: 15 },
            { header: 'Tipo', key: 'tipo', width: 10 },
            { header: 'Justificativa', key: 'justificativa', width: 50 }
        ];
        
        // Período atual
        const periodo = this.getPeriodoAtual();
        
        // Filtra e adiciona os dados
        this.registros
            .filter(r => this.calcularPeriodo(r.data) === periodo.chave)
            .forEach(registro => {
                const result = this.calcularValor(registro);
                worksheet.addRow({
                    data: new Date(registro.data).toLocaleDateString('pt-BR'),
                    horas: `${registro.inicio} - ${registro.fim}`,
                    valor: result.total.toFixed(2),
                    tipo: result.tipoExtra,
                    justificativa: registro.justificativa
                });
            });
        
        // Adiciona o resumo
        worksheet.addRow({});
        worksheet.addRow({
            data: 'RESUMO:',
            horas: '',
            valor: '',
            tipo: '',
            justificativa: ''
        });
        
        let total75 = 0;
        let total100 = 0;
        
        this.registros
            .filter(r => this.calcularPeriodo(r.data) === periodo.chave)
            .forEach(registro => {
                const result = this.calcularValor(registro);
                total75 += result.valor75;
                total100 += result.valor100;
            });
        
        worksheet.addRow({
            data: 'Horas 75%:',
            horas: '',
            valor: total75.toFixed(2),
            tipo: '',
            justificativa: ''
        });
        
        worksheet.addRow({
            data: 'Horas 100%:',
            horas: '',
            valor: total100.toFixed(2),
            tipo: '',
            justificativa: ''
        });
        
        worksheet.addRow({
            data: 'TOTAL:',
            horas: '',
            valor: (total75 + total100).toFixed(2),
            tipo: '',
            justificativa: ''
        });
        
        // Exporta
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
        
        // Cabeçalho
        doc.setFontSize(16);
        doc.text('Relatório de Horas Extras', 20, 20);
        doc.setFontSize(12);
        doc.text(`Funcionário: ${this.currentUser}`, 20, 30);
        
        // Período
        const periodo = this.getPeriodoAtual();
        doc.text(periodo.texto.replace('📊 ', ''), 20, 40);
        
        // Tabela
        let y = 50;
        doc.text('Data', 20, y);
        doc.text('Horas', 60, y);
        doc.text('Valor (R$)', 100, y);
        doc.text('Tipo', 140, y);
        y += 10;
        
        let total75 = 0;
        let total100 = 0;
        
        this.registros
            .filter(r => this.calcularPeriodo(r.data) === periodo.chave)
            .forEach(registro => {
                const result = this.calcularValor(registro);
                total75 += result.valor75;
                total100 += result.valor100;
                
                doc.text(new Date(registro.data).toLocaleDateString('pt-BR'), 20, y);
                doc.text(`${registro.inicio} - ${registro.fim}`, 60, y);
                doc.text(`R$ ${result.total.toFixed(2)}`, 100, y);
                doc.text(result.tipoExtra, 140, y);
                
                y += 10;
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
            });
        
        // Resumo
        y += 10;
        doc.text('RESUMO:', 20, y);
        y += 10;
        doc.text(`Horas 75%: R$ ${total75.toFixed(2)}`, 20, y);
        y += 10;
        doc.text(`Horas 100%: R$ ${total100.toFixed(2)}`, 20, y);
        y += 10;
        doc.text(`TOTAL: R$ ${(total75 + total100).toFixed(2)}`, 20, y);
        
        // Salva o PDF
        doc.save('relatorio-horas.pdf');
    }

    exportarWord() {
        if (!this.currentUser || this.registros.length === 0) {
            alert('Não há dados para exportar');
            return;
        }
        
        const periodo = this.getPeriodoAtual();
        
        let total75 = 0;
        let total100 = 0;
        
        let registrosHTML = '';
        
        this.registros
            .filter(r => this.calcularPeriodo(r.data) === periodo.chave)
            .forEach(registro => {
                const result = this.calcularValor(registro);
                total75 += result.valor75;
                total100 += result.valor100;
                
                registrosHTML += `
                    <tr>
                        <td>${new Date(registro.data).toLocaleDateString('pt-BR')}</td>
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
            <h2>${periodo.texto.replace('📊 ', '')}</h2>
            
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

// Inicialização
const gerenciador = new GerenciadorHorasPro();

// Interface Global
window.exportarExcel = () => gerenciador.exportarExcel();
window.exportarPDF = () => gerenciador.exportarPDF();
window.exportarWord = () => gerenciador.exportarWord();
window.exportarBackup = () => gerenciador.exportarBackup();
