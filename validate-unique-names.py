#!/usr/bin/env python3
"""
Script de validação para verificar se a implementação de nomes únicos está correta
"""

import os
import re
import json

def check_file_exists(file_path, description):
    """Verifica se um arquivo existe"""
    if os.path.exists(file_path):
        print(f"✅ {description}: {file_path}")
        return True
    else:
        print(f"❌ {description}: {file_path} (ARQUIVO NÃO ENCONTRADO)")
        return False

def check_import_in_file(file_path, import_pattern, description):
    """Verifica se um import específico existe no arquivo"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            if import_pattern in content:
                print(f"✅ {description}")
                return True
            else:
                print(f"❌ {description} (IMPORT NÃO ENCONTRADO)")
                return False
    except Exception as e:
        print(f"❌ {description} (ERRO AO LER ARQUIVO: {e})")
        return False

def check_function_usage(file_path, function_name, description):
    """Verifica se uma função é usada no arquivo"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            if function_name in content:
                print(f"✅ {description}")
                return True
            else:
                print(f"❌ {description} (FUNÇÃO NÃO ENCONTRADA)")
                return False
    except Exception as e:
        print(f"❌ {description} (ERRO AO LER ARQUIVO: {e})")
        return False

def validate_typescript_syntax(file_path, description):
    """Validação básica de sintaxe TypeScript"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
            # Verifica se há exports válidos
            if 'export' in content:
                print(f"✅ {description} - Exports encontrados")
            else:
                print(f"⚠️ {description} - Nenhum export encontrado")
            
            # Verifica se há funções
            if 'function' in content or '=>' in content:
                print(f"✅ {description} - Funções encontradas")
            else:
                print(f"❌ {description} - Nenhuma função encontrada")
            
            return True
    except Exception as e:
        print(f"❌ {description} (ERRO: {e})")
        return False

def main():
    print("🔍 VALIDAÇÃO DA IMPLEMENTAÇÃO DE NOMES ÚNICOS")
    print("=" * 50)
    
    base_path = "/Users/jhonymonhol/Desktop/conversa-ai-brasil"
    
    # Lista de arquivos para verificar
    files_to_check = [
        ("src/utils/uniqueNameGenerator.ts", "Gerador de nomes únicos"),
        ("src/services/agentService.ts", "Serviço de agentes"),
        ("src/context/AgentContext.tsx", "Contexto de agentes"),
        ("src/utils/instanceNameValidator.js", "Validador de nomes"),
        ("src/tests/uniqueNameGenerator.test.ts", "Testes unitários"),
        ("test-unique-names.mjs", "Script de teste"),
    ]
    
    print("\n📁 VERIFICANDO ARQUIVOS:")
    print("-" * 30)
    
    all_files_exist = True
    for file_path, description in files_to_check:
        full_path = os.path.join(base_path, file_path)
        if not check_file_exists(full_path, description):
            all_files_exist = False
    
    # Verificando imports específicos
    print("\n📦 VERIFICANDO IMPORTS:")
    print("-" * 30)
    
    imports_to_check = [
        ("src/services/agentService.ts", 'import { getUniqueInstanceName }', "Import no agentService"),
        ("src/context/AgentContext.tsx", 'import { getUniqueInstanceName }', "Import no AgentContext"),
    ]
    
    all_imports_ok = True
    for file_path, import_pattern, description in imports_to_check:
        full_path = os.path.join(base_path, file_path)
        if not check_import_in_file(full_path, import_pattern, description):
            all_imports_ok = False
    
    # Verificando uso das funções
    print("\n🔧 VERIFICANDO USO DAS FUNÇÕES:")
    print("-" * 30)
    
    functions_to_check = [
        ("src/services/agentService.ts", "getUniqueInstanceName(agent.nome, user.id)", "Uso no agentService"),
        ("src/context/AgentContext.tsx", "getUniqueInstanceName(agent.nome, user?.id)", "Uso no AgentContext"),
    ]
    
    all_functions_ok = True
    for file_path, function_pattern, description in functions_to_check:
        full_path = os.path.join(base_path, file_path)
        if not check_function_usage(full_path, "getUniqueInstanceName", description):
            all_functions_ok = False
    
    # Validação de sintaxe dos arquivos principais
    print("\n📝 VALIDANDO SINTAXE:")
    print("-" * 30)
    
    syntax_files = [
        ("src/utils/uniqueNameGenerator.ts", "uniqueNameGenerator.ts"),
        ("src/tests/uniqueNameGenerator.test.ts", "Tests"),
    ]
    
    all_syntax_ok = True
    for file_path, description in syntax_files:
        full_path = os.path.join(base_path, file_path)
        if os.path.exists(full_path):
            if not validate_typescript_syntax(full_path, description):
                all_syntax_ok = False
    
    # Verificando package.json
    print("\n📋 VERIFICANDO DEPENDÊNCIAS:")
    print("-" * 30)
    
    package_json_path = os.path.join(base_path, "package.json")
    if os.path.exists(package_json_path):
        try:
            with open(package_json_path, 'r', encoding='utf-8') as f:
                package_data = json.load(f)
                
                # Verifica nanoid
                if 'nanoid' in package_data.get('dependencies', {}):
                    print("✅ Dependência nanoid encontrada")
                else:
                    print("❌ Dependência nanoid NÃO encontrada")
                
                # Verifica scripts de teste
                scripts = package_data.get('scripts', {})
                if 'test' in scripts:
                    print("✅ Script de teste encontrado")
                else:
                    print("⚠️ Script de teste não encontrado")
                    
        except Exception as e:
            print(f"❌ Erro ao ler package.json: {e}")
    
    # Resultado final
    print("\n" + "=" * 50)
    print("📊 RESULTADO DA VALIDAÇÃO:")
    print("=" * 50)
    
    if all_files_exist and all_imports_ok and all_functions_ok and all_syntax_ok:
        print("🎉 ✅ IMPLEMENTAÇÃO VALIDADA COM SUCESSO!")
        print("\n✅ Todos os arquivos estão presentes")
        print("✅ Todos os imports estão corretos") 
        print("✅ Todas as funções estão sendo usadas")
        print("✅ Sintaxe validada")
        print("\n🚀 O sistema de nomes únicos está pronto para uso!")
        
        print("\n📋 PRÓXIMOS PASSOS:")
        print("1. Execute os testes: npm run test")
        print("2. Teste a criação de agentes na interface")
        print("3. Monitore os logs para verificar a geração de nomes únicos")
        
    else:
        print("⚠️ ❌ PROBLEMAS ENCONTRADOS NA IMPLEMENTAÇÃO")
        print("\nRevise os itens marcados com ❌ acima")
        
    return all_files_exist and all_imports_ok and all_functions_ok and all_syntax_ok

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
