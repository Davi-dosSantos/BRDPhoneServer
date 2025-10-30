export function getCurrentTimestamp() : String {
  const now = new Date();
  
  const date = now.toLocaleDateString('pt-BR'); // Ex: 30/10/2025
  const time = now.toLocaleTimeString('pt-BR', { hour12: false }); // Ex: 08:43:18
  
  return `[${date} ${time}]`;
}
