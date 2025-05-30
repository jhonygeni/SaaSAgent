#!/usr/bin/env node

/**
 * Script para atualizar a API key no arquivo .env.save
 * Execute: node update-api-key.cjs "SUA_NOVA_API_KEY"
 */

const fs = require('fs');
const path = require('path');

function updateApiKey(newApiKey) {
    console.log('🔧 ATUALIZANDO API KEY NO .env.save');
    console.log('===================================');
    
    if (!newApiKey) {
        console.log('❌ ERRO: Por favor forneça uma API key');
        console.log('💡 Uso: node update-api-key.cjs "SUA_NOVA_API_KEY"');
        return false;
    }
    
    const envPath = path.join(__dirname, '.env.save');
    
    if (!fs.existsSync(envPath)) {
        console.log('❌ ERRO: Arquivo .env.save não encontrado');
        return false;
    }
    
    try {
        // Ler arquivo atual
        let content = fs.readFileSync(envPath, 'utf8');
        console.log(`📄 Lendo arquivo: ${envPath}`);
        
        // Substituir a API key
        const oldPattern = /EVOLUTION_API_KEY=.*/;
        const newLine = `EVOLUTION_API_KEY=${newApiKey}`;
        
        if (oldPattern.test(content)) {
            content = content.replace(oldPattern, newLine);
            console.log('🔄 API key atualizada');
        } else {
            // Se não encontrar a linha, adicionar no final
            content += `\nEVOLUTION_API_KEY=${newApiKey}\n`;
            console.log('➕ API key adicionada');
        }
        
        // Salvar arquivo
        fs.writeFileSync(envPath, content);
        console.log('✅ Arquivo .env.save atualizado com sucesso!');
        
        // Mostrar a nova configuração (mascarada)
        const maskedKey = newApiKey.length > 10 
            ? newApiKey.substring(0, 10) + '...' 
            : newApiKey.substring(0, 3) + '...';
        console.log(`🔑 Nova API Key: ${maskedKey}`);
        
        console.log('');
        console.log('🎯 PRÓXIMOS PASSOS:');
        console.log('   1. Execute: node test-api-key.cjs "' + newApiKey + '"');
        console.log('   2. Se o teste passar, execute: node diagnose-validation-problem.cjs');
        console.log('   3. Teste criar uma nova instância no sistema');
        
        return true;
        
    } catch (error) {
        console.log('❌ ERRO ao atualizar arquivo:');
        console.log(error.message);
        return false;
    }
}

// Executar a atualização
const newApiKey = process.argv[2];
updateApiKey(newApiKey);
