/**
 * Turkish locale uppercase and string formatting utilities
 * Handles specific Turkish casing rules: i -> İ, ı -> I, etc.
 */
export function toTurkishUpper(text: string): string {
  if (!text) return '';
  try {
    return text.toLocaleUpperCase('tr-TR');
  } catch {
    // Fallback if tr-TR locale is not supported in environment
    return text
      .replace(/i/g, 'İ')
      .replace(/ı/g, 'I')
      .replace(/ğ/g, 'Ğ')
      .replace(/ü/g, 'Ü')
      .replace(/ş/g, 'Ş')
      .replace(/ö/g, 'Ö')
      .replace(/ç/g, 'Ç')
      .toUpperCase();
  }
}

export function toTurkishLower(text: string): string {
  if (!text) return '';
  try {
    return text.toLocaleLowerCase('tr-TR');
  } catch {
    return text
      .replace(/İ/g, 'i')
      .replace(/I/g, 'ı')
      .replace(/Ğ/g, 'ğ')
      .replace(/Ü/g, 'ü')
      .replace(/Ş/g, 'ş')
      .replace(/Ö/g, 'ö')
      .replace(/Ç/g, 'ç')
      .toLowerCase();
  }
}

export function formatJerseyName(fullName: string): string {
  // If captain: "Kaptan Volkan" -> "KAPTAN VOLKAN" or "VOLKAN"
  return toTurkishUpper(fullName);
}
