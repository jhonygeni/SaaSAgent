import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../lib/logging';

/**
 * Middleware para logging de requisições API
 */
export async function apiLoggerMiddleware(
  req: NextRequest, 
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const start = performance.now();
  const requestId = uuidv4();
  const { pathname, search } = new URL(req.url);
  const method = req.method;

  // Log de início da requisição
  logger.http(`${method} ${pathname}${search}`, {
    requestId,
    method,
    path: pathname,
    query: search,
    userAgent: req.headers.get('user-agent'),
    referer: req.headers.get('referer'),
  });

  try {
    // Executa o handler original
    const response = await handler(req);
    
    // Log de resposta
    const duration = performance.now() - start;
    logger.http(`${method} ${pathname} ${response.status}`, {
      requestId,
      method,
      path: pathname,
      statusCode: response.status,
      duration: `${duration.toFixed(2)}ms`,
    });

    // Adiciona o requestId ao header da resposta
    response.headers.set('X-Request-ID', requestId);
    return response;
  } catch (error) {
    // Log de erro
    const duration = performance.now() - start;
    logger.error(`${method} ${pathname} falhou`, {
      requestId,
      method,
      path: pathname,
      duration: `${duration.toFixed(2)}ms`,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Retorna resposta de erro
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}
