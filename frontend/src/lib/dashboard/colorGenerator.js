/**
 * Gerador de cores únicas para matérias
 * 
 * Gera cores vibrantes e únicas para cada matéria,
 * evitando duplicatas e garantindo boa legibilidade
 */

/**
 * Paleta de cores vibrantes pré-definidas
 */
const VIBRANT_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
];

/**
 * Gera uma cor HSL aleatória vibrante
 * @returns {string} Cor em formato HSL
 */
const generateRandomHSL = () => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 65 + Math.floor(Math.random() * 25); // 65-90%
  const lightness = 45 + Math.floor(Math.random() * 15);  // 45-60%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

/**
 * Gera uma cor única que não existe na lista de cores existentes
 * @param {string[]} existingColors - Array de cores já utilizadas
 * @returns {string} Nova cor única
 * @example generateUniqueColor(['#ef4444', '#f97316']) // '#f59e0b' ou cor aleatória
 */
export const generateUniqueColor = (existingColors) => {
  // Primeiro tenta usar cores da paleta pré-definida
  const availableColors = VIBRANT_COLORS.filter(c => !existingColors.includes(c));

  if (availableColors.length > 0) {
    return availableColors[Math.floor(Math.random() * availableColors.length)];
  }

  // Se todas as cores da paleta estão em uso, gera uma cor aleatória
  let newColor;
  let attempts = 0;
  do {
    newColor = generateRandomHSL();
    attempts++;
  } while (existingColors.includes(newColor) && attempts < 50);

  return newColor;
};
