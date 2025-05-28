/**
 * Teste da funcionalidade de geração de nomes únicos
 * Execute: npm run test -- uniqueNameGenerator.test.ts
 */

import { describe, it, expect, vi } from 'vitest';
import { 
  sanitizeAgentName,
  generateUniqueToken,
  validateInstanceNameFormat,
  generateUniqueInstanceName
} from '../utils/uniqueNameGenerator';

// Mock do nanoid para testes determinísticos
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'abc123')
}));

describe('uniqueNameGenerator', () => {
  describe('sanitizeAgentName', () => {
    it('deve sanitizar nomes com acentos', () => {
      expect(sanitizeAgentName('José da Silva')).toBe('jose_da_silva');
    });

    it('deve remover caracteres especiais', () => {
      expect(sanitizeAgentName('Agent@123!')).toBe('agent123');
    });

    it('deve lidar com espaços múltiplos', () => {
      expect(sanitizeAgentName('  Agent   Test  ')).toBe('agent_test');
    });

    it('deve retornar string vazia para entrada inválida', () => {
      expect(sanitizeAgentName('')).toBe('');
      expect(sanitizeAgentName(null as any)).toBe('');
      expect(sanitizeAgentName(undefined as any)).toBe('');
    });
  });

  describe('generateUniqueToken', () => {
    it('deve gerar token de 6 caracteres', () => {
      const token = generateUniqueToken();
      expect(token).toHaveLength(6);
      expect(token).toBe('abc123'); // Mock value
    });
  });

  describe('validateInstanceNameFormat', () => {
    it('deve validar nomes corretos', () => {
      expect(validateInstanceNameFormat('agente_test')).toBe(true);
      expect(validateInstanceNameFormat('agent123')).toBe(true);
      expect(validateInstanceNameFormat('test_agent_abc123')).toBe(true);
    });

    it('deve rejeitar nomes inválidos', () => {
      expect(validateInstanceNameFormat('')).toBe(false);
      expect(validateInstanceNameFormat('_test')).toBe(false);
      expect(validateInstanceNameFormat('test_')).toBe(false);
      expect(validateInstanceNameFormat('test@agent')).toBe(false);
    });

    it('deve validar limite de tamanho', () => {
      const longName = 'a'.repeat(51);
      expect(validateInstanceNameFormat(longName)).toBe(false);
      
      const validName = 'a'.repeat(50);
      expect(validateInstanceNameFormat(validName)).toBe(true);
    });
  });
});

// Teste de integração básico (sem dependências externas)
describe('Nome único - teste conceitual', () => {
  it('deve demonstrar o formato esperado', () => {
    const agentName = "Assistente Virtual";
    const sanitized = sanitizeAgentName(agentName);
    const token = generateUniqueToken();
    const uniqueName = `${sanitized}_${token}`;
    
    expect(sanitized).toBe('assistente_virtual');
    expect(uniqueName).toBe('assistente_virtual_abc123');
    expect(validateInstanceNameFormat(uniqueName)).toBe(true);
  });
});

console.log('✅ Testes do gerador de nomes únicos configurados');
