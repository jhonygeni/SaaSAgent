#!/bin/bash

# Script para configurar o diretório de logs
# Criar, verificar permissões e limpar logs antigos

# Definir diretório de logs
LOG_DIR="logs"

# Criar diretório de logs se não existir
if [ ! -d "$LOG_DIR" ]; then
  echo "Criando diretório de logs: $LOG_DIR"
  mkdir -p "$LOG_DIR"
fi

# Verificar permissões
echo "Configurando permissões do diretório de logs"
chmod 755 "$LOG_DIR"

# Limpar logs antigos (mais de 30 dias)
echo "Limpando logs com mais de 30 dias"
find "$LOG_DIR" -type f -name "*.log" -mtime +30 -exec rm -f {} \;

# Inicializar arquivos de log se não existirem
touch "$LOG_DIR/error.log"
touch "$LOG_DIR/combined.log"

echo "Configuração de logs concluída"
