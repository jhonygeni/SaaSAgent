#!/usr/bin/env node

/**
 * Script de monitoramento rápido do sistema
 * Execute regularmente para verificar a saúde do sistema
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Carregar API Key do .env.save
function getApiKey() {
    const envPath = path.join(__dirname, '.env.save');
    if (!fs.existsSync(envPath)) return null;
    
    const content = fs.readFileSync(envPath, 'utf8');
    const apiKeyLine = content.split('\n').find(line => line.startsWith('EVOLUTION_API_KEY='));
    return apiKeyLine ? apiKeyLine.split('=')[1] : null;
}

function makeRequest(url, headers) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, { method: 'GET', headers }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function quickHealthCheck() {
    console.log('🏥 VERIFICAÇÃO RÁPIDA DE SAÚDE DO SISTEMA');
    console.log('=========================================');
    
    const apiKey = getApiKey();
    if (!apiKey) {
        console.log('❌ API Key não encontrada no .env.save');
        return;
    }
    
    try {
        const response = await makeRequest('https://cloudsaas.geni.chat/instance/fetchInstances', {
            'apikey': apiKey,
            'Content-Type': 'application/json'
        });
        
        if (response.status === 200) {
            const count = Array.isArray(response.data) ? response.data.length : 0;
            console.log(`✅ Sistema funcionando - ${count} instâncias ativas`);
            console.log(`🕐 Verificado em: ${new Date().toLocaleString('pt-BR')}`);
            
            if (count > 0) {
                console.log('📋 Instâncias ativas:');
                response.data.forEach((instance, i) => {
                    const name = instance.instance?.instanceName || instance.instanceName || instance.name;
                    console.log(`   ${i + 1}. ${name}`);
                });
            }
        } else {
            console.log(`⚠️ Aviso: API retornou status ${response.status}`);
        }
        
    } catch (error) {
        console.log(`❌ Erro: ${error.message}`);
    }
}

quickHealthCheck();
