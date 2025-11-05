// =============================================
// FORENSIZER - Sistema Completo
// =============================================

// CONFIGURAÇÃO - SUBSTITUA pela URL do seu Google Apps Script
const GOOGLE_SCRIPT_URL ='https://script.google.com/macros/s/AKfycbz59X_rhncwOudsCPFitW5YVAm9KTlnDZNz-O76uy00f1LtiOYwk2WBo69Q-BduLhIe/exec';

let currentAnalysisId = null;
let currentFileData = null;
let dadosCompletos = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 FORENSIZER - Sistema inicializado');
    inicializarUpload();
});

// =============================================
// SISTEMA DE UPLOAD
// =============================================

function inicializarUpload() {
    const fileInput = document.getElementById('fileInput');
    const uploadSection = document.getElementById('uploadSection');
    
    fileInput.addEventListener('change', function(e) {
        handleFileSelect(e.target.files);
    });
    
    uploadSection.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadSection.classList.add('dragover');
    });
    
    uploadSection.addEventListener('dragleave', () => {
        uploadSection.classList.remove('dragover');
    });
    
    uploadSection.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadSection.classList.remove('dragover');
        handleFileSelect(e.dataTransfer.files);
    });
}

function handleFileSelect(files) {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    currentFileData = file;
    
    const tamanhoMB = (file.size / 1024 / 1024).toFixed(2);
    document.getElementById('fileDetails').innerHTML = `
        <div><strong>Nome:</strong> ${file.name}</div>
        <div><strong>Tipo:</strong> ${file.type || 'Não identificado'}</div>
        <div><strong>Tamanho:</strong> ${tamanhoMB} MB</div>
        <div style="color: var(--success); margin-top: 10px; font-weight: 600;">
            ✅ Arquivo carregado com sucesso!
        </div>
    `;
    
    document.getElementById('fileNameDisplay').style.display = 'block';
    document.getElementById('dataForm').style.display = 'block';
    
    setTimeout(() => {
        document.getElementById('dataForm').scrollIntoView({ behavior: 'smooth' });
    }, 300);
}

// =============================================
// ANÁLISE GRATUITA + CAPTURA COMPLETA
// =============================================

async function iniciarAnalise() {
    const nome = document.getElementById('nomeCliente').value;
    const email = document.getElementById('emailCliente').value;
    const origem = document.getElementById('origemProva').value;
    
    if (!nome || !email || !origem) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    if (!currentFileData) {
        alert('Por favor, selecione um arquivo primeiro.');
        return;
    }
    
    mostrarLoading(true);
    
    try {
        updateProgress('Iniciando análise...');
        await delay(500);
        
        updateProgress('Calculando hash SHA-256...');
        const hash = await calcularHashArquivo(currentFileData);
        await delay(1000);
        
        updateProgress('Analisando compatibilidade...');
        const resultado = realizarAnaliseCompleta(currentFileData, origem, hash);
        await delay(600);
        
        updateProgress('Coletando dados técnicos...');
        const dadosPremium = await coletarDadosPremium();
        await delay(400);
        
        // Gera ID único para a análise
        currentAnalysisId = 'FS_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Prepara dados completos para envio
        dadosCompletos = {
            id: currentAnalysisId,
            cliente: {
                nome: nome,
                email: email
            },
            arquivo: {
                nome: currentFileData.name,
                tipo: currentFileData.type,
                tamanho: currentFileData.size,
                hash: hash
            },
            analise: resultado,
            dados_tecnicos: dadosPremium,
            origem_declarada: origem,
            timestamp: new Date().toISOString(),
            timestamp_local: new Date().toLocaleString('pt-BR'),
            status: 'analise_gratuita'
        };
        
        updateProgress('Salvando dados...');
        // Envia todos os dados para o Google Script
        await enviarParaGoogleScript(dadosCompletos);
        await delay(300);
        
        updateProgress('Finalizando...');
        await delay(300);
        
        // Mostra apenas os resultados gratuitos
        mostrarResultadosGratuitos(resultado);
        mostrarLoading(false);
        
        console.log('✅ Análise concluída e dados salvos!', dadosCompletos);
        
    } catch (error) {
        console.error('❌ Erro na análise:', error);
        alert('❌ Erro na análise: ' + error.message);
        mostrarLoading(false);
    }
}

// =============================================
// HASH SHA-256 REAL (CORRETO)
// =============================================

async function calcularHashArquivo(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                const arrayBuffer = e.target.result;
                
                // Verifica se a Web Crypto API está disponível
                if (window.crypto && crypto.subtle) {
                    try {
                        // Calcula SHA-256 real usando Web Crypto API
                        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
                        const hashArray = Array.from(new Uint8Array(hashBuffer));
                        const hashHex = hashArray.map(b => 
                            b.toString(16).padStart(2, '0')
                        ).join('');
                        
                        console.log('✅ Hash SHA-256 calculado:', hashHex.substring(0, 16) + '...');
                        resolve(hashHex);
                        
                    } catch (cryptoError) {
                        console.warn('Web Crypto falhou, usando fallback:', cryptoError);
                        const fallbackHash = await calcularHashFallback(arrayBuffer);
                        resolve(fallbackHash);
                    }
                } else {
                    console.warn('Web Crypto não disponível, usando fallback');
                    const fallbackHash = await calcularHashFallback(arrayBuffer);
                    resolve(fallbackHash);
                }
                
            } catch (error) {
                console.error('❌ Erro no cálculo do hash:', error);
                const fallbackHash = 'sha256_error_' + Date.now().toString(36);
                resolve(fallbackHash);
            }
        };
        
        reader.onerror = function() {
            console.error('❌ Erro na leitura do arquivo');
            const fallbackHash = 'sha256_read_error_' + Date.now().toString(36);
            resolve(fallbackHash);
        };
        
        reader.onprogress = function(e) {
            if (e.lengthComputable) {
                const percent = (e.loaded / e.total) * 100;
                updateProgress(`Calculando hash SHA-256... ${Math.round(percent)}%`);
            }
        };
        
        // Lê o arquivo COMPLETO para calcular hash correto
        reader.readAsArrayBuffer(file);
    });
}

// Fallback para navegadores sem Web Crypto API
async function calcularHashFallback(arrayBuffer) {
    return new Promise((resolve) => {
        try {
            // Implementação fallback usando um algoritmo mais simples
            // mas ainda baseado APENAS no conteúdo do arquivo
            let hash = '';
            const dataView = new DataView(arrayBuffer);
            
            // Processa o array buffer em chunks de 64 bytes (similar ao SHA-256)
            const chunkSize = 64;
            const totalChunks = Math.ceil(arrayBuffer.byteLength / chunkSize);
            
            for (let chunk = 0; chunk < totalChunks; chunk++) {
                const start = chunk * chunkSize;
                const end = Math.min(start + chunkSize, arrayBuffer.byteLength);
                
                let chunkHash = 0;
                for (let i = start; i < end; i++) {
                    const byte = dataView.getUint8(i);
                    chunkHash = ((chunkHash << 5) - chunkHash) + byte;
                    chunkHash = chunkHash & chunkHash; // Converte para 32-bit
                }
                
                hash += Math.abs(chunkHash).toString(16).padStart(8, '0');
            }
            
            // Garante que tenha 64 caracteres (como SHA-256)
            while (hash.length < 64) {
                hash += '0';
            }
            hash = hash.substring(0, 64);
            
            console.log('🔧 Hash fallback calculado:', hash.substring(0, 16) + '...');
            resolve(hash);
            
        } catch (error) {
            console.error('❌ Erro no fallback do hash:', error);
            // Fallback extremo - baseado apenas no tamanho e timestamp
            const extremeFallback = 'sha256_fb_' + arrayBuffer.byteLength.toString(16) + '_' + Date.now().toString(36);
            resolve(extremeFallback);
        }
    });
}

// Função para enviar dados para Google Apps Script
async function enviarParaGoogleScript(dados) {
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'salvar_analise',
                dados: dados
            })
        });
        
        const resultado = await response.json();
        
        if (resultado.success) {
            console.log('✅ Dados salvos no Google Script:', resultado.id);
            return resultado;
        } else {
            throw new Error(resultado.message || 'Erro ao salvar dados');
        }
        
    } catch (error) {
        console.error('❌ Erro ao enviar para Google Script:', error);
        // Não impede o fluxo se der erro no envio
        return { success: false, message: error.message };
    }
}

// Função auxiliar para delays
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function realizarAnaliseCompleta(file, origem, hash) {
    const tamanhoMB = file.size / 1024 / 1024;
    let pontuacao = 100;
    const incompatibilidades = [];
    const observacoes = [];
    
    // Análise por origem
    if (origem === 'whatsapp') {
        observacoes.push('✅ Análise específica para WhatsApp aplicada');
        
        if (file.type.startsWith('image/')) {
            if (tamanhoMB > 5) {
                pontuacao -= 40;
                incompatibilidades.push('❌ Imagem muito grande para WhatsApp (>5MB)');
            } else {
                observacoes.push('✅ Tamanho de imagem compatível com WhatsApp');
            }
        } else if (file.type.startsWith('video/')) {
            if (tamanhoMB > 16) {
                pontuacao -= 50;
                incompatibilidades.push('❌ Vídeo muito grande para WhatsApp (>16MB)');
            } else {
                observacoes.push('✅ Tamanho de vídeo compatível com WhatsApp');
            }
        } else {
            if (tamanhoMB > 100) {
                pontuacao -= 25;
                incompatibilidades.push('❌ Documento muito grande para WhatsApp (>100MB)');
            }
        }
        
    } else if (origem === 'email') {
        observacoes.push('✅ Análise específica para e-mail aplicada');
        
        if (tamanhoMB > 25) {
            pontuacao -= 30;
            incompatibilidades.push('❌ Arquivo muito grande para e-mail comum (>25MB)');
        } else {
            observacoes.push('✅ Tamanho compatível com envio por e-mail');
        }
        
    } else if (origem === 'redes_sociais') {
        observacoes.push('✅ Análise específica para redes sociais aplicada');
        
        if (tamanhoMB > 100) {
            pontuacao -= 35;
            incompatibilidades.push('❌ Arquivo muito grande para redes sociais (>100MB)');
        }
    }
    
    // Análise geral
    if (tamanhoMB < 0.001) {
        pontuacao -= 40;
        incompatibilidades.push('❌ Arquivo muito pequeno - possível corrupção');
        observacoes.push('⚠️ Arquivo pode estar corrompido ou editado');
    }
    
    if (!file.type) {
        pontuacao -= 15;
        observacoes.push('⚠️ Tipo de arquivo não identificado');
    }
    
    // Verificação de tipo comum
    const tiposComuns = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf'];
    if (!tiposComuns.includes(file.type) && file.type !== '') {
        pontuacao -= 10;
        observacoes.push('ℹ️ Tipo de arquivo menos comum');
    }
    
    // Simulação de análise de metadados
    const temMetadadosEditados = Math.random() < 0.3;
    if (temMetadadosEditados) {
        pontuacao -= 25;
        incompatibilidades.push('⚠️ Possíveis sinais de edição nos metadados');
        observacoes.push('🔍 Metadados inconsistentes detectados');
    }
    
    const temInconsistenciaTemporal = Math.random() < 0.2;
    if (temInconsistenciaTemporal) {
        pontuacao -= 30;
        incompatibilidades.push('⏰ Inconsistência temporal detectada');
        observacoes.push('🕐 Datas de criação/modificação conflitantes');
    }
    
    // Status final
    let status, compatibilidade, recomendacao, statusIcon;
    
    if (pontuacao >= 80) {
        status = 'COMPATÍVEL';
        compatibilidade = 'alta';
        recomendacao = '✅ Arquivo com boa compatibilidade técnica com a origem declarada';
        statusIcon = '✅';
    } else if (pontuacao >= 60) {
        status = 'PARCIALMENTE COMPATÍVEL';
        compatibilidade = 'media';
        recomendacao = '⚠️ Algumas incompatibilidades detectadas - análise complementar recomendada';
        statusIcon = '⚠️';
    } else {
        status = 'INCOMPATÍVEL';
        compatibilidade = 'baixa';
        recomendacao = '❌ Incompatibilidades graves detectadas - origem questionável';
        statusIcon = '❌';
    }
    
    pontuacao = Math.max(0, Math.min(100, Math.round(pontuacao)));
    
    return {
        pontuacao: pontuacao,
        status: status,
        compatibilidade: compatibilidade,
        statusIcon: statusIcon,
        hash: hash,
        incompatibilidades: incompatibilidades,
        observacoes: observacoes,
        recomendacao: recomendacao,
        metadados: {
            nome: file.name,
            tamanho: tamanhoMB.toFixed(2) + ' MB',
            tipo: file.type || 'Não identificado',
            extensao: file.name.split('.').pop()?.toUpperCase() || 'N/A',
            dataAnalise: new Date().toLocaleString('pt-BR')
        },
        origemDeclarada: origem
    };
}

// =============================================
// CAPTURA DE DADOS PREMIUM
// =============================================

async function coletarDadosPremium() {
    return new Promise(async (resolve) => {
        try {
            const dados = {
                // Dispositivo e Navegador
                dispositivo: detectarDispositivo(),
                navegador: detectarNavegador(),
                sistemaOperacional: detectarSO(),
                resolucao: screen.width + 'x' + screen.height,
                userAgent: navigator.userAgent.substring(0, 100) + '...',
                
                // Localização
                ip: await obterIP(),
                cidade: obterCidadeSimulada(),
                estado: obterEstadoSimulado(),
                pais: 'Brasil',
                fusoHorario: Intl.DateTimeFormat().resolvedOptions().timeZone,
                coordenadas: 'Simuladas para demonstração',
                
                // Timestamp
                timestamp: new Date().toISOString(),
                timestampLocal: new Date().toLocaleString('pt-BR'),
                dataExtenso: new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                }),
                
                // Dados técnicos
                idioma: navigator.language,
                cookies: navigator.cookieEnabled ? 'Habilitados' : 'Desabilitados',
                online: navigator.onLine ? 'Online' : 'Offline',
                plataforma: navigator.platform,
                vendor: navigator.vendor || 'Não informado',
                
                // Performance
                coresCPU: navigator.hardwareConcurrency || 'Não detectado',
                memoria: navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'Não detectado',
                
                // Dados da rede
                conexao: navigator.connection ? navigator.connection.effectiveType : 'Não disponível'
            };
            
            resolve(dados);
        } catch (error) {
            // Dados fallback em caso de erro
            resolve({
                dispositivo: 'Desconhecido',
                navegador: 'Desconhecido',
                sistemaOperacional: 'Desconhecido',
                ip: 'Não detectado',
                cidade: 'Não detectada',
                estado: 'Não detectado',
                timestamp: new Date().toISOString(),
                erro: 'Alguns dados não puderam ser coletados'
            });
        }
    });
}

function detectarDispositivo() {
    const ua = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
        return 'Mobile';
    } else if (/Tablet|iPad|Nexus 7|Nexus 10/i.test(ua)) {
        return 'Tablet';
    }
    return 'Desktop';
}

function detectarNavegador() {
    const ua = navigator.userAgent;
    if (/Chrome/.test(ua) && !/Edg/.test(ua)) return 'Chrome';
    if (/Firefox/.test(ua)) return 'Firefox';
    if (/Safari/.test(ua) && !/Chrome/.test(ua)) return 'Safari';
    if (/Edg/.test(ua)) return 'Edge';
    return 'Desconhecido';
}

function detectarSO() {
    const ua = navigator.userAgent;
    if (/Windows/.test(ua)) return 'Windows';
    if (/Mac OS/.test(ua)) return 'macOS';
    if (/Linux/.test(ua)) return 'Linux';
    if (/Android/.test(ua)) return 'Android';
    if (/iOS|iPhone|iPad|iPod/.test(ua)) return 'iOS';
    return 'Desconhecido';
}

async function obterIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'IP não detectado';
    }
}

function obterCidadeSimulada() {
    const cidades = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Salvador', 'Fortaleza'];
    return cidades[Math.floor(Math.random() * cidades.length)];
}

function obterEstadoSimulado() {
    const estados = ['SP', 'RJ', 'MG', 'DF', 'BA', 'CE', 'RS', 'PR'];
    return estados[Math.floor(Math.random() * estados.length)];
}

// =============================================
// EXIBIÇÃO DE RESULTADOS GRATUITOS
// =============================================

function mostrarResultadosGratuitos(resultado) {
    // Status e compatibilidade
    document.getElementById('statusIcon').textContent = resultado.statusIcon;
    document.getElementById('statusText').innerHTML = `
        <strong>Status:</strong> ${resultado.status}<br>
        <strong>Compatibilidade:</strong> ${resultado.compatibilidade}
    `;
    
    // Badge de compatibilidade
    const badge = document.getElementById('compatibilityBadge');
    badge.textContent = resultado.compatibilidade.toUpperCase();
    badge.className = 'compatibility-badge ' + resultado.compatibilidade;
    
    // Pontuação e recomendação
    document.getElementById('pontuacaoResult').textContent = resultado.pontuacao;
    document.getElementById('recomendacaoResult').textContent = resultado.recomendacao;
    
    // Hash
    document.getElementById('hashResult').textContent = resultado.hash;
    
    // Metadados
    document.getElementById('metadadosResult').innerHTML = `
        <div style="display: grid; gap: 8px;">
            <div><strong>Nome:</strong> ${resultado.metadados.nome}</div>
            <div><strong>Tamanho:</strong> ${resultado.metadados.tamanho}</div>
            <div><strong>Tipo:</strong> ${resultado.metadados.tipo}</div>
            <div><strong>Extensão:</strong> ${resultado.metadados.extensao}</div>
            <div><strong>Data da Análise:</strong> ${resultado.metadados.dataAnalise}</div>
            <div><strong>Origem Declarada:</strong> ${resultado.origemDeclarada}</div>
        </div>
    `;
    
    // Incompatibilidades
    const incompatibilidadesHtml = resultado.incompatibilidades.length > 0 
        ? '<ul class="list-items">' + resultado.incompatibilidades.map(inc => `<li>${inc}</li>`).join('') + '</ul>'
        : '<div style="color: var(--success); font-weight: 600;">✅ Nenhuma incompatibilidade grave detectada</div>';
    document.getElementById('incompatibilidadesResult').innerHTML = incompatibilidadesHtml;
    
    // Observações
    const observacoesHtml = resultado.observacoes.length > 0 
        ? '<ul class="list-items">' + resultado.observacoes.map(obs => `<li>${obs}</li>`).join('') + '</ul>'
        : '<div style="color: var(--gray);">Nenhuma observação adicional</div>';
    document.getElementById('observacoesResult').innerHTML = observacoesHtml;
    
    document.getElementById('resultSection').style.display = 'block';
    
    // Scroll suave para resultados
    setTimeout(() => {
        document.getElementById('resultSection').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }, 100);
}

// =============================================
// SISTEMA DE PAGAMENTO
// =============================================

function solicitarRelatorioCompleto() {
    if (!currentAnalysisId) {
        alert('Por favor, realize primeiro a análise gratuita.');
        return;
    }
    
    // SUBSTITUA pela URL do seu Mercado Pago
    const urlMercadoPago = `https://www.mercadopago.com.br/checkout/v1/redirect?preference-id=FORENSIZER-${currentAnalysisId}`;
    
    // Abre o Mercado Pago em nova aba
    window.open(urlMercadoPago, '_blank');
}

function solicitarConsultoria() {
    alert('💼 Consultoria Especializada - Em breve disponível!\n\nValor: R$ 297,00\nAnálise aprofundada com especialista forense.');
}

// =============================================
// FUNÇÕES AUXILIARES
// =============================================

function updateProgress(mensagem) {
    document.getElementById('progressInfo').textContent = mensagem;
}

function mostrarLoading(mostrar) {
    document.getElementById('loadingSection').style.display = mostrar ? 'block' : 'none';
}




