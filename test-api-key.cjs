#!/usr/bin/env node

/**
 * Script para testar uma API key da Evolution API
 * Execute: node test-api-key.cjs "SUA_API_KEY_AQUI"
 */

const https = require('https');

async function testApiKey(apiKey) {
    console.log('🔍 TESTANDO API KEY DA EVOLUTION API');
    console.log('=====================================');
    
    if (!apiKey || apiKey === 'SUA_CHAVE_AQUI_SUBSTITUA_ESTE_TEXTO') {
        console.log('❌ ERRO: Por favor forneça uma API key válida');
        console.log('💡 Uso: node test-api-key.cjs "SUA_API_KEY_AQUI"');
        return false;
    }
    
    console.log(`🔑 Testando API Key: ${apiKey.substring(0, 10)}...`);
    console.log(`🌐 URL da API: https://cloudsaas.geni.chat`);
    console.log('');
    
    try {
        const response = await makeRequest('https://cloudsaas.geni.chat/instance/fetchInstances', {
            'Content-Type': 'application/json',
            'apikey': apiKey
        });
        
        console.log('✅ SUCESSO! API Key válida');
        console.log(`📊 Status: ${response.status}`);
        console.log(`📋 Instâncias encontradas: ${Array.isArray(response.data) ? response.data.length : 'N/A'}`);
        
        if (Array.isArray(response.data) && response.data.length > 0) {
            console.log('📝 Primeiras instâncias:');
            response.data.slice(0, 3).forEach((instance, i) => {
                console.log(`   ${i + 1}. ${instance.instance?.instanceName || instance.instanceName || 'Nome não encontrado'}`);
            });
        }
        
        return true;
        
    } catch (error) {
        console.log('❌ FALHA no teste da API Key');
        console.log(`🚨 Erro: ${error.message}`);
        
        if (error.status === 401) {
            console.log('');
            console.log('🔧 SOLUÇÃO:');
            console.log('   1. Verifique se a API key está correta');
            console.log('   2. Gere uma nova API key no painel da Evolution API');
            console.log('   3. Certifique-se de que sua conta tem permissões adequadas');
        }
        
        return false;
    }
}

function makeRequest(url, headers) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, {
            method: 'GET',
            headers: headers
        }, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        data: parsed
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            reject({
                message: error.message,
                status: 'network_error'
            });
        });
        
        req.end();
    });
}

// Executar o teste
const apiKey = process.argv[2];
testApiKey(apiKey);
