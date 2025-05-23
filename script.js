// ==== CONFIGURAÇÃO FIREBASE ====
// Substitua pelos seus dados do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBXL10m_SvDquaKKhwQJrwn-2J-2YMf_gE",
  authDomain: "controlehesw.firebaseapp.com",
  projectId: "controlehesw",
  storageBucket: "controlehesw.firebasestorage.app",
  messagingSenderId: "808084496678",
  appId: "1:808084496678:web:ee9515b6191e892094e1e7"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let usuarioAtual = null;
let registros = [];
let feriadosPersonalizados = [];
let salarioAtual = null;
let grafico = null;
let filtroAtivo = false;
let filtroInicio = null;
let filtroFim = null;

// ==== TROCA DE TELAS ====
function mostrarLogin() {
    document.getElementById('loginContainer').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registroContainer').style.display = 'none';
    document.getElementById('recuperarSenhaContainer').style.display = 'none';
}
function mostrarRegistro() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registroContainer').style.display = 'block';
    document.getElementById('recuperarSenhaContainer').style.display = 'none';
}
function mostrarRecuperarSenha() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registroContainer').style.display = 'none';
    document.getElementById('recuperarSenhaContainer').style.display = 'block';
}
function mostrarMain() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
}

// ==== EVENTOS DE LOGIN/CADASTRO E LOTTIE ====
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('btnCadastrar').onclick = mostrarRegistro;
    document.getElementById('btnVoltarLogin').onclick = mostrarLogin;
    document.getElementById('btnVoltarLogin2').onclick = mostrarLogin;
    document.getElementById('btnEsqueciSenha').onclick = mostrarRecuperarSenha;
    document.getElementById('btnLogin').onclick = realizarLoginEmail;
    document.getElementById('btnGoogleLogin').onclick = realizarLoginGoogle;
    document.getElementById('formRegistro').onsubmit = registrarUsuario;
    document.getElementById('formRecuperarSenha').onsubmit = redefinirSenha;
    document.getElementById('formSalario').onsubmit = salvarSalario;
    document.getElementById('btnEditarSalario').onclick = function() {
        document.getElementById('formSalario').style.display = 'block';
        document.getElementById('btnEditarSalario').style.display = 'none';
    };
    document.getElementById('btnCancelarSalario').onclick = function() {
        document.getElementById('formSalario').style.display = 'none';
        document.getElementById('btnEditarSalario').style.display = 'inline-block';
    };
    document.getElementById('registroForm').onsubmit = salvarRegistro;
    document.getElementById('btnAddFeriado').onclick = adicionarFeriadoPersonalizado;
    document.getElementById('btnImportBackup').addEventListener('change', importarBackup);
    document.getElementById('filtroMes').onchange = filtrarPorMes;
  // Login
    const senhaInput = document.getElementById('loginSenha');
    const toggle = document.getElementById('toggleSenha');
    const eyeOpen = document.getElementById('eyeOpen');
    const eyeClosed = document.getElementById('eyeClosed');
    if (toggle && senhaInput && eyeOpen && eyeClosed) {
        toggle.addEventListener('click', function() {
            const isVisible = senhaInput.type === 'text';
            senhaInput.type = isVisible ? 'password' : 'text';
            eyeOpen.style.display = isVisible ? 'none' : '';
            eyeClosed.style.display = isVisible ? '' : 'none';
        });
    }

    // Cadastro (senha)
    const regSenhaInput = document.getElementById('regSenha');
    const toggleRegSenha = document.getElementById('toggleRegSenha');
    const eyeOpenReg = document.getElementById('eyeOpenReg');
    const eyeClosedReg = document.getElementById('eyeClosedReg');
    if (toggleRegSenha && regSenhaInput && eyeOpenReg && eyeClosedReg) {
        toggleRegSenha.addEventListener('click', function() {
            const isVisible = regSenhaInput.type === 'text';
            regSenhaInput.type = isVisible ? 'password' : 'text';
            eyeOpenReg.style.display = isVisible ? 'none' : '';
            eyeClosedReg.style.display = isVisible ? '' : 'none';
        });
    }

    // Cadastro (confirmação)
    const regConfirmInput = document.getElementById('regConfirmSenha');
    const toggleRegConfirm = document.getElementById('toggleRegConfirmSenha');
    const eyeOpenRegConf = document.getElementById('eyeOpenRegConf');
    const eyeClosedRegConf = document.getElementById('eyeClosedRegConf');
    if (toggleRegConfirm && regConfirmInput && eyeOpenRegConf && eyeClosedRegConf) {
        toggleRegConfirm.addEventListener('click', function() {
            const isVisible = regConfirmInput.type === 'text';
            regConfirmInput.type = isVisible ? 'password' : 'text';
            eyeOpenRegConf.style.display = isVisible ? 'none' : '';
            eyeClosedRegConf.style.display = isVisible ? '' : 'none';
        });
    }

    // Recuperação (nova senha)
    const recSenhaInput = document.getElementById('recNovaSenha');
    const toggleRecSenha = document.getElementById('toggleRecSenha');
    const eyeOpenRec = document.getElementById('eyeOpenRec');
    const eyeClosedRec = document.getElementById('eyeClosedRec');
    if (toggleRecSenha && recSenhaInput && eyeOpenRec && eyeClosedRec) {
        toggleRecSenha.addEventListener('click', function() {
            const isVisible = recSenhaInput.type === 'text';
            recSenhaInput.type = isVisible ? 'password' : 'text';
            eyeOpenRec.style.display = isVisible ? 'none' : '';
            eyeClosedRec.style.display = isVisible ? '' : 'none';
        });
    }

    // Recuperação (confirmação)
    const recConfirmInput = document.getElementById('recConfirmSenha');
    const toggleRecConfirm = document.getElementById('toggleRecConfirmSenha');
    const eyeOpenRecConf = document.getElementById('eyeOpenRecConf');
    const eyeClosedRecConf = document.getElementById('eyeClosedRecConf');
    if (toggleRecConfirm && recConfirmInput && eyeOpenRecConf && eyeClosedRecConf) {
        toggleRecConfirm.addEventListener('click', function() {
            const isVisible = recConfirmInput.type === 'text';
            recConfirmInput.type = isVisible ? 'password' : 'text';
            eyeOpenRecConf.style.display = isVisible ? 'none' : '';
            eyeClosedRecConf.style.display = isVisible ? '' : 'none';
        });
    }
});



// ==== LOTTIE EYE ====
function setupLottieEye(eyeId, inputId) {
    const container = document.getElementById(eyeId);
    const input = document.getElementById(inputId);
    if (!container || !input || typeof lottie === "undefined") {
        console.warn('Lottie ou container/input não encontrado:', eyeId, inputId);
        return;
    }

    // Limpa qualquer conteúdo anterior
    container.innerHTML = "";

    // Carrega a animação (olho preto, visível em fundo branco)
    const eyeAnim = lottie.loadAnimation({
  container: document.getElementById('eyeLogin'),
  renderer: 'svg',
  loop: false,
  autoplay: false,
  path: 'eye-animation.json'
});

document.getElementById('eyeLogin').addEventListener('click', function(){
  const senha = document.getElementById('loginSenha');
  if(senha.type === 'password') {
    senha.type = 'text';
    eyeAnim.playSegments([0, 15], true);
  } else {
    senha.type = 'password';
    eyeAnim.playSegments([15, 30], true);
  }
});
}

// ==== LOGIN POR USUÁRIO OU EMAIL ====
async function realizarLoginEmail() {
    let loginInput = document.getElementById('loginUsername').value.trim();
    const senha = document.getElementById('loginSenha').value;
    let emailParaLogin = loginInput;
    if (!loginInput.includes('@')) {
        const snap = await db.collection('users').where('nome', '==', loginInput).get();
        if (!snap.empty) {
            emailParaLogin = snap.docs[0].data().email;
        } else {
            alert('Usuário não encontrado!');
            return;
        }
    }
    try {
        await auth.signInWithEmailAndPassword(emailParaLogin, senha);
        mostrarMain();
        await carregarUsuario();
    } catch (err) {
        alert('Email/Usuário ou senha inválidos!');
    }
}

async function realizarLoginGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
        mostrarMain();
        await carregarUsuario();
    } catch (err) {
        alert('Erro no login Google: ' + err.message);
    }
}

// ==== CADASTRO ====
async function registrarUsuario(e) {
    e.preventDefault();
    const nome = document.getElementById('regNome').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const senha = document.getElementById('regSenha').value;
    const confirm = document.getElementById('regConfirmSenha').value;
    if (senha !== confirm) return alert('As senhas não coincidem!');
    try {
        const cred = await auth.createUserWithEmailAndPassword(email, senha);
        await db.collection('users').doc(cred.user.uid).set({ nome, email });
        mostrarMain();
        await carregarUsuario();
    } catch (err) {
        alert(err.message);
    }
}

// ==== RECUPERAÇÃO DE SENHA ====
async function redefinirSenha(e) {
    e.preventDefault();
    const email = document.getElementById('recEmail').value.trim();
    try {
        await auth.sendPasswordResetEmail(email);
        alert('Email de redefinição enviado! Siga as instruções no seu email.');
        mostrarLogin();
    } catch (err) {
        alert('Erro ao enviar email: ' + err.message);
    }
}

// ==== LOGOUT ====
document.getElementById('btnLogout').onclick = () => auth.signOut();

// ==== OBSERVADOR DE USUÁRIO LOGADO ====
auth.onAuthStateChanged(async (user) => {
    if (user) {
        mostrarMain();
        await carregarUsuario();
    } else {
        mostrarLogin();
    }
});

// ==== CARREGAR USUÁRIO E DADOS ====
async function carregarUsuario() {
    const user = auth.currentUser;
    if (!user) return;
    usuarioAtual = user;
    const doc = await db.collection('users').doc(user.uid).get();
    const nome = doc.exists ? doc.data().nome : user.email;
    document.getElementById('userGreeting').textContent = `Olá, ${nome}!`;
    const config = await db.collection('users').doc(user.uid).collection('config').doc('salario').get();
    salarioAtual = config.exists ? config.data().valor : '';
    document.getElementById('novoSalario').value = salarioAtual || '';
    const feriadosSnap = await db.collection('users').doc(user.uid).collection('feriados').get();
    feriadosPersonalizados = feriadosSnap.docs.map(d => d.id);
    renderizarFeriadosPersonalizados();
    await carregarRegistros();
}
// ==== CRUD DE REGISTROS (Firestore) ====
async function salvarRegistro(e) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    const salario = parseFloat(document.getElementById('novoSalario').value);
    if (isNaN(salario)) return alert('Configure o salário primeiro!');
    const data = document.getElementById('data').value;
    const inicio = document.getElementById('horaInicio').value;
    const fim = document.getElementById('horaFim').value;
    const justificativa = document.getElementById('justificativa').value;
    await db.collection('users').doc(user.uid).collection('registros').add({
        data, inicio, fim, justificativa, salarioMensal: salario, criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
    await carregarRegistros();
    e.target.reset();
}

async function carregarRegistros() {
    const user = auth.currentUser;
    if (!user) return;
    const tbody = document.querySelector('#registros tbody');
    tbody.innerHTML = '';
    let query = db.collection('users').doc(user.uid).collection('registros').orderBy('data', 'desc');
    if (filtroAtivo && filtroInicio && filtroFim) {
        query = query.where('data', '>=', filtroInicio).where('data', '<=', filtroFim);
    }
    const snap = await query.get();
    registros = [];
    snap.forEach(doc => {
        const r = doc.data();
        r.id = doc.id;
        registros.push(r);
    });
    renderizarTabela();
}

window.excluirRegistro = async function(id) {
    const user = auth.currentUser;
    if (!user) return;
    await db.collection('users').doc(user.uid).collection('registros').doc(id).delete();
    await carregarRegistros();
};

// ==== SALÁRIO ====
async function salvarSalario(e) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    const valor = parseFloat(document.getElementById('novoSalario').value);
    if (isNaN(valor)) return alert('Digite um valor válido!');
    await db.collection('users').doc(user.uid).collection('config').doc('salario').set({ valor });
    salarioAtual = valor;
    alert('Salário atualizado!');
    document.getElementById('formSalario').style.display = 'none';
    document.getElementById('btnEditarSalario').style.display = 'inline-block';
}

// ==== FERIADOS PERSONALIZADOS ====
async function adicionarFeriadoPersonalizado() {
    const user = auth.currentUser;
    if (!user) return;
    const input = document.getElementById('novoFeriado');
    const data = input.value;
    if (!data) return;
    await db.collection('users').doc(user.uid).collection('feriados').doc(data).set({ ativo: true });
    feriadosPersonalizados.push(data);
    renderizarFeriadosPersonalizados();
    input.value = '';
}
window.gerenciador = {
    removerFeriadoPersonalizado: async function(data) {
        const user = auth.currentUser;
        if (!user) return;
        await db.collection('users').doc(user.uid).collection('feriados').doc(data).delete();
        feriadosPersonalizados = feriadosPersonalizados.filter(f => f !== data);
        renderizarFeriadosPersonalizados();
    }
};
function renderizarFeriadosPersonalizados() {
    const ul = document.getElementById('listaFeriadosPersonalizados');
    ul.innerHTML = '';
    feriadosPersonalizados.forEach(data => {
        const li = document.createElement('li');
        li.innerHTML = `${data} <button class="remove-feriado" onclick="gerenciador.removerFeriadoPersonalizado('${data}')">&times;</button>`;
        ul.appendChild(li);
    });
}

// ==== FORMATAÇÃO DE DATA BR ====
function formatarDataBR(data_iso) {
    if (!data_iso) return '';
    const partes = data_iso.split('-');
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return data_iso;
}

// ==== TABELA, FILTROS, GRÁFICO ====
function calcularValor(registro) {
    const valorHora = registro.salarioMensal / 220;
    const [horaInicio, minutoInicio] = registro.inicio.split(':').map(Number);
    const [horaFim, minutoFim] = registro.fim.split(':').map(Number);
    let minutos = (horaFim * 60 + minutoFim) - (horaInicio * 60 + minutoInicio);
    if (minutos < 0) minutos += 1440;
    const horas = minutos / 60;
    const data = new Date(registro.data + 'T00:00:00');
    const isFimSemana = [0, 6].includes(data.getDay());
    const isFeriadoPersonalizado = feriadosPersonalizados.includes(registro.data);
    let valor75 = 0, valor100 = 0;
    if (isFimSemana || isFeriadoPersonalizado) {
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
        tipo: (isFimSemana || isFeriadoPersonalizado) ? '100%' : (horas <= 2 ? '75%' : '75%/100%')
    };
}
function renderizarTabela() {
    const tbody = document.querySelector('#registros tbody');
    tbody.innerHTML = '';
    let total75 = 0, total100 = 0, totalGeral = 0;
    let registrosFiltrados = registros;
    if (filtroAtivo && filtroInicio && filtroFim) {
        registrosFiltrados = registros.filter(r => r.data >= filtroInicio && r.data <= filtroFim);
    }
    registrosFiltrados.forEach(registro => {
        const result = calcularValor(registro);
        total75 += result.valor75;
        total100 += result.valor100;
        totalGeral += result.total;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatarDataBR(registro.data)}</td>
            <td>${registro.inicio} - ${registro.fim}</td>
            <td title="Salário base: R$ ${registro.salarioMensal.toFixed(2)} | Valor/hora: R$ ${(registro.salarioMensal / 220).toFixed(2)}">
                R$ ${result.total.toFixed(2)} <span style="color: #666; font-size: 0.9em">${result.tipo}</span>
            </td>
            <td>${registro.justificativa}</td>
            <td><button class="btn-excluir" onclick="excluirRegistro('${registro.id}')">🗑️</button></td>
        `;
        tbody.appendChild(tr);
    });
    document.getElementById('valor75').textContent = total75.toFixed(2);
    document.getElementById('valor100').textContent = total100.toFixed(2);
    document.getElementById('totalGeral').textContent = totalGeral.toFixed(2);
    calcularFadiga(registrosFiltrados);
    renderizarGrafico(registrosFiltrados);
}
function calcularFadiga(registrosFiltrados) {
    let totalHoras = 0;
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
function renderizarGrafico(registrosFiltrados) {
    const ctx = document.getElementById('graficoHoras');
    if (!ctx) return;
    const context = ctx.getContext('2d');
    if (grafico) grafico.destroy();
    const periodos = {};
    registrosFiltrados.forEach(registro => {
        const mes = registro.data.slice(0, 7);
        if (!periodos[mes]) periodos[mes] = { valor75: 0, valor100: 0 };
        const result = calcularValor(registro);
        periodos[mes].valor75 += result.valor75;
        periodos[mes].valor100 += result.valor100;
    });
    const labels = Object.keys(periodos).map(mes => {
        const [ano, mesNum] = mes.split('-');
        return `${mesNum}/${ano}`;
    });
    const dados75 = Object.keys(periodos).map(mes => periodos[mes].valor75);
    const dados100 = Object.keys(periodos).map(mes => periodos[mes].valor100);
    const dadosTotal = Object.keys(periodos).map(mes => periodos[mes].valor75 + periodos[mes].valor100);
    grafico = new Chart(context, {
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
// ==== FILTROS ====
window.aplicarFiltroPersonalizado = function() {
    filtroInicio = document.getElementById('filtroInicio').value;
    filtroFim = document.getElementById('filtroFim').value;
    filtroAtivo = !!(filtroInicio && filtroFim);
    carregarRegistros();
};
window.limparFiltros = function() {
    filtroAtivo = false;
    filtroInicio = null;
    filtroFim = null;
    document.getElementById('filtroMes').value = '';
    document.getElementById('filtroInicio').value = '';
    document.getElementById('filtroFim').value = '';
    carregarRegistros();
};
window.filtrarPorMes = function() {
    const mesAno = document.getElementById('filtroMes').value;
    if (mesAno) {
        filtroAtivo = true;
        filtroInicio = mesAno + "-01";
        filtroFim = mesAno + "-31";
    } else {
        filtroAtivo = false;
        filtroInicio = null;
        filtroFim = null;
    }
    carregarRegistros();
};

// ==== BACKUP E RESTAURAÇÃO FIRESTORE ====
window.exportarBackup = async function() {
    const user = auth.currentUser;
    if (!user) return alert('Faça login primeiro!');
    const registrosSnap = await db.collection('users').doc(user.uid).collection('registros').get();
    const feriadosSnap = await db.collection('users').doc(user.uid).collection('feriados').get();
    const configSnap = await db.collection('users').doc(user.uid).collection('config').get();
    const backup = {
        registros: registrosSnap.docs.map(d => d.data()),
        feriados: feriadosSnap.docs.map(d => d.id),
        salario: configSnap.docs.find(d => d.id === 'salario')?.data()?.valor || null
    };
    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    saveAs(blob, `backupHE_${user.email}_${new Date().toISOString().slice(0,10)}.json`);
};
async function importarBackup(e) {
    const user = auth.currentUser;
    if (!user) return alert('Faça login primeiro!');
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(event) {
        try {
            const backup = JSON.parse(event.target.result);
            const registrosRef = db.collection('users').doc(user.uid).collection('registros');
            const feriadosRef = db.collection('users').doc(user.uid).collection('feriados');
            (await registrosRef.get()).forEach(doc => registrosRef.doc(doc.id).delete());
            (await feriadosRef.get()).forEach(doc => feriadosRef.doc(doc.id).delete());
            for (const r of backup.registros) await registrosRef.add(r);
            for (const f of backup.feriados) await feriadosRef.doc(f).set({ ativo: true });
            if (backup.salario) await db.collection('users').doc(user.uid).collection('config').doc('salario').set({ valor: backup.salario });
            alert('Backup importado com sucesso!');
            await carregarUsuario();
        } catch (err) {
            alert('Backup inválido!');
        }
    };
    reader.readAsText(file);
}

// ==== EXPORTAÇÃO EXCEL/PDF/WORD ====
window.exportarExcel = async function() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Horas Extras');
    worksheet.columns = [
        { header: 'Data', key: 'data', width: 15 },
        { header: 'Horário', key: 'horas', width: 20 },
        { header: 'Valor (R$)', key: 'valor', width: 15 },
        { header: 'Tipo', key: 'tipo', width: 10 },
        { header: 'Justificativa', key: 'justificativa', width: 50 }
    ];
    registros.forEach(registro => {
        const result = calcularValor(registro);
        worksheet.addRow({
            data: formatarDataBR(registro.data),
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
};
window.exportarPDF = async function() {
    const doc = new jspdf.jsPDF();
    doc.setFontSize(16);
    doc.text('Relatório de Horas Extras', 20, 20);
    doc.setFontSize(12);
    let y = 30;
    registros.forEach(registro => {
        const result = calcularValor(registro);
        doc.text(`${formatarDataBR(registro.data)} - ${registro.inicio} às ${registro.fim}: R$ ${result.total.toFixed(2)} (${result.tipo})`, 20, y);
        y += 10;
    });
    doc.save('relatorio.pdf');
};
window.exportarWord = async function() {
    let content = `<h1>Relatório de Horas Extras</h1><table border="1"><tr><th>Data</th><th>Horas</th><th>Valor</th><th>Tipo</th><th>Justificativa</th></tr>`;
    registros.forEach(registro => {
        const result = calcularValor(registro);
        content += `<tr><td>${formatarDataBR(registro.data)}</td><td>${registro.inicio}-${registro.fim}</td><td>R$ ${result.total.toFixed(2)}</td><td>${result.tipo}</td><td>${registro.justificativa}</td></tr>`;
    });
    content += '</table>';
    const blob = new Blob([content], { type: 'application/msword' });
    saveAs(blob, 'relatorio.doc');
};
