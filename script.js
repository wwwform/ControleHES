document.getElementById('hora-extra-form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const data = new Date(document.getElementById('data').value);
    const horaInicio = document.getElementById('hora-inicio').value;
    const horaFim = document.getElementById('hora-fim').value;
    const justificativa = document.getElementById('justificativa').value;
    const salario = parseFloat(document.getElementById('salario').value);
    
    const horasExtras = calcularHorasExtras(horaInicio, horaFim);
    const valorExtra = calcularValorExtra(data, horasExtras, salario);
    
    adicionarRegistro(data, horaInicio, horaFim, justificativa, horasExtras, valorExtra);
    atualizarResumo();
});

function calcularHorasExtras(horaInicio, horaFim) {
    const inicio = new Date(`2023-01-01T${horaInicio}`);
    const fim = new Date(`2023-01-01T${horaFim}`);
    return (fim - inicio) / (1000 * 60 * 60); // Convertendo para horas
}

function calcularValorExtra(data, horasExtras, salario) {
    const diaSemana = data.getDay(); // 0 = Domingo, 6 = Sábado
    const ehFeriado = verificarFeriado(data);
    
    let valorTotal = 0;
    
    if (ehFeriado || diaSemana === 0 || diaSemana === 6) {
        valorTotal = horasExtras * (salario / 100) * 100;
    } else {
        valorTotal = (Math.min(horasExtras, 2) * (salario / 100) * 75) + (Math.max(horasExtras - 2, 0) * (salario / 100) * 100);
    }
    
    return valorTotal;
}

function verificarFeriado(data) {
    // Aqui adiciono a lógica para detectar feriados
    const feriados = ["2025-01-01", "2025-12-25"];
    return feriados.includes(data.toISOString().split('T')[0]);
}

function adicionarRegistro(data, horaInicio, horaFim, justificativa, horasExtras, valorExtra) {
    // Função para armazenar o registro na lista de controle de horas
}

function atualizarResumo() {
    // Função para recalcular os totais e atualizar a tela
}

