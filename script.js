// ==== CONFIGURAÇÃO FIREBASE ====
// Cole aqui o objeto firebaseConfig do seu painel Firebase
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

// ==== EVENTOS DE LOGIN/CADASTRO ====
document.getElementById('btnCadastrar').onclick = mostrarRegistro;
document.getElementById('btnVoltarLogin').onclick = mostrarLogin;
document.getElementById('btnVoltarLogin2').onclick = mostrarLogin;
document.getElementById('btnEsqueciSenha').onclick = mostrarRecuperarSenha;

// Cadastro
document.getElementById('formRegistro').onsubmit = async function(e) {
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
};

// Login email/senha
document.getElementById('btnLogin').onclick = async function() {
    const email = document.getElementById('loginUsername').value.trim();
    const senha = document.getElementById('loginSenha').value;
    try {
        await auth.signInWithEmailAndPassword(email, senha);
        mostrarMain();
        await carregarUsuario();
    } catch (err) {
        alert('Email ou senha inválidos!');
    }
};

// Login Google
document.getElementById('btnGoogleLogin').onclick = async function() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
        mostrarMain();
        await carregarUsuario();
    } catch (err) {
        alert('Erro no login Google: ' + err.message);
    }
};

// Recuperar senha
document.getElementById('formRecuperarSenha').onsubmit = async function(e) {
    e.preventDefault();
    const email = document.getElementById('recEmail').value.trim();
    try {
        await auth.sendPasswordResetEmail(email);
        alert('Email de redefinição enviado! Siga as instruções no seu email.');
        mostrarLogin();
    } catch (err) {
        alert('Erro ao enviar email: ' + err.message);
    }
};

// Logout
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
    // Saudação
    const doc = await db.collection('users').doc(user.uid).get();
    const nome = doc.exists ? doc.data().nome : user.email;
    document.getElementById('userGreeting').textContent = `Olá, ${nome}!`;
    // Carregar salário
    const config = await db.collection('users').doc(user.uid).collection('config').doc('salario').get();
    salarioAtual = config.exists ? config.data().valor : '';
    document.getElementById('novoSalario').value = salarioAtual || '';
    // Carregar feriados personalizados
    const feriadosSnap = await db.collection('users').doc(user.uid).collection('feriados').get();
    feriadosPersonalizados = feriadosSnap.docs.map(d => d.id);
    renderizarFeriadosPersonalizados();
    // Carregar registros
    await carregarRegistros();
}

// ==== CRUD DE REGISTROS (Firestore) ====
// Salvar novo registro
document.getElementById('registroForm').onsubmit = async function(e) {
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
};

// Carregar registros
async function carregarRegistros() {
    const user = auth.currentUser;
    if (!user) return;
    const tbody = document.querySelector('#registros tbody');
    tbody.innerHTML = '';
    const snap = await db.collection('users').doc(user.uid).collection('registros').orderBy('data', 'desc').get();
    registros = [];
    snap.forEach(doc => {
        const r = doc.data();
        r.id = doc.id;
        registros.push(r);
    });
    renderizarTabela();
}

// Excluir registro
window.excluirRegistro = async function(id) {
    const user = auth.currentUser;
    if (!user) return;
    await db.collection('users').doc(user.uid).collection('registros').doc(id).delete();
    await carregarRegistros();
};

// Salvar salário
document.getElementById('formSalario').onsubmit = async function(e) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    const valor = parseFloat(document.getElementById('novoSalario').value);
    if (isNaN(valor)) return alert('Digite um valor válido!');
    await db.collection('users').doc(user.uid).collection('config').doc('salario').set({ valor });
    salarioAtual = valor;
    alert('Salário atualizado!');
};

// Feriados personalizados
document.getElementById('btnAddFeriado').onclick = async function() {
    const user = auth.currentUser;
    if (!user) return;
    const input = document.getElementById('novoFeriado');
    const data = input.value;
    if (!data) return;
    await db.collection('users').doc(user.uid).collection('feriados').doc(data).set({ ativo: true });
    feriadosPersonalizados.push(data);
    renderizarFeriadosPersonalizados();
    input.value = '';
};
window.gerenciador = { // para onclick inline
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

// ==== TABELA, FILTROS E GRÁFICO ====
function calcularValor(registro) {
    const valorHora = registro.salarioMensal / 220;
    const [horaInicio, minutoInicio] = registro.inicio.split(':').map(Number);
    const [horaFim, minutoFim] = registro.fim.split(':').map(Number);
    let minutos = (horaFim * 60 + minutoFim) - (horaInicio * 60 + minutoInicio);
    if (minutos < 0) minutos += 1440;
    const horas = minutos / 60;
    const data = new Date(registro.data + 'T00:00:00');
    const isFimSemana = [0, 6].includes(data.getDay());
    // Aqui você pode integrar feriados nacionais se quiser, via API
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

    // Filtros (implemente conforme desejar)
    let registrosFiltrados = registros;
    // Exemplo: filtro por período
    // ...

    registrosFiltrados.forEach(registro => {
        const result = calcularValor(registro);
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

function renderizarGrafico(registrosFiltrados) {
    const ctx = document.getElementById('graficoHoras');
    if (!ctx) return;
    const context = ctx.getContext('2d');
    if (grafico) grafico.destroy();

    // Agrupa por mês
    const periodos = {};
    registrosFiltrados.forEach(registro => {
        const mes = registro.data.slice(0, 7);
        if (!periodos[mes]) periodos[mes] = { valor75: 0, valor100: 0 };
        const result = calcularValor(registro);
        periodos[mes].valor75 += result.valor75;
        periodos[mes].valor100 += result.valor100;
    });

    const labels = Object.keys(periodos);
    const dados75 = labels.map(mes => periodos[mes].valor75);
    const dados100 = labels.map(mes => periodos[mes].valor100);
    const dadosTotal = labels.map(mes => periodos[mes].valor75 + periodos[mes].valor100);

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

// ==== EXPORTAÇÃO E BACKUP (apenas local) ====
// Você pode adaptar para Firestore se quiser salvar backups na nuvem

// ==== Filtros ====
// Implemente filtros conforme sua necessidade, usando o array "registros" carregado da nuvem

// ==== Inicialização ====
document.addEventListener('DOMContentLoaded', function() {
    // Nada a mais aqui, tudo já está nos eventos
});
