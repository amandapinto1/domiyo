const MESSAGES: Record<string, string> = {
  not_configured: "A leitura por IA não está configurada no servidor.",
  timeout: "A leitura demorou mais que o limite. O serviço pode ter concluído e cobrado; confira o uso antes de enviar de novo.",
  network_error: "A conexão com o serviço de leitura falhou. Aguarde um pouco antes de tentar novamente.",
  upstream_rejected: "O serviço recusou a leitura. Confira o modelo, o acesso e os créditos antes de enviar de novo.",
  invalid_response: "O serviço respondeu em um formato inesperado. Tente novamente em instantes.",
  incomplete: "A leitura foi interrompida antes de terminar. O cronograma pode ser extenso demais.",
  empty_output: "A leitura terminou, mas não encontramos aulas identificáveis.",
  invalid_output: "A leitura terminou, mas o resultado não corresponde ao formato esperado.",
  no_events: "Não encontramos aulas com data e horário no PDF.",
  too_many_events: "Este cronograma tem aulas demais para importar de uma vez.",
  interrupted: "A leitura foi interrompida antes de terminar. Envie o PDF novamente.",
};

export function failureMessage(code: string): string {
  return MESSAGES[code] ?? "Não foi possível ler o cronograma. Envie o PDF novamente.";
}
