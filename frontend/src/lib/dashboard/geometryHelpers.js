/**
 * Utilitários geométricos para visualização do ciclo
 * 
 * Funções matemáticas para desenhar arcos SVG e calcular
 * posições polares para o mapa circular do ciclo
 */

/**
 * Converte graus para radianos
 * @param {number} deg - Ângulo em graus
 * @returns {number} Ângulo em radianos
 */
export const deg2rad = (deg) => (deg * Math.PI) / 180;

/**
 * Converte coordenadas polares para cartesianas
 * @param {number} cx - Centro X
 * @param {number} cy - Centro Y
 * @param {number} r - Raio
 * @param {number} deg - Ângulo em graus
 * @returns {{x: number, y: number}} Coordenadas cartesianas
 */
export const polar = (cx, cy, r, deg) => ({
  x: cx + r * Math.cos(deg2rad(deg)),
  y: cy + r * Math.sin(deg2rad(deg)),
});

/**
 * Gera um caminho SVG para um arco
 * @param {number} cx - Centro X
 * @param {number} cy - Centro Y
 * @param {number} r - Raio
 * @param {number} startDeg - Ângulo inicial em graus
 * @param {number} endDeg - Ângulo final em graus
 * @returns {string} Caminho SVG
 */
export const arcPath = (cx, cy, r, startDeg, endDeg) => {
  const start = polar(cx, cy, r, startDeg);
  const end = polar(cx, cy, r, endDeg);
  let sweep = endDeg - startDeg;

  while (sweep < 0) sweep += 360;
  while (sweep > 360) sweep -= 360;

  const largeArcFlag = sweep > 180 ? 1 : 0;
  const sweepFlag = 1;

  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
};
