const factorial = (n: number): number => {
  if (n < 0) return Infinity;
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
};

/**
 * Calcula a probabilidade de Poisson para um evento k ocorrer, dada uma média lambda.
 * P(k; λ) = (λ^k * e^-λ) / k!
 */
export const calculatePoisson = (lambda: number, k: number): number => {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
};

/**
 * Gera uma matriz de probabilidades de resultado (ex: 1-0, 2-1) usando Poisson.
 */
export const generateScoreMatrix = (homeXG: number, awayXG: number, maxGoals: number = 6): Record<string, number> => {
  const matrix: Record<string, number> = {};
  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      const prob = calculatePoisson(homeXG, h) * calculatePoisson(awayXG, a);
      matrix[`${h}-${a}`] = prob;
    }
  }
  return matrix;
};

/**
 * Gera a distribuição de probabilidade da Diferença de Golos (GD = Home - Away).
 * Retorna um objeto onde a chave é a diferença (ex: "-1", "0", "2") e o valor é a probabilidade.
 * Inclui chaves especiais "<min" e ">max" para as caudas.
 */
export const generateGoalDifferenceDistribution = (homeXG: number, awayXG: number, limit: number = 10): Record<string, number> => {
  const dist: Record<string, number> = {};
  // Inicializar
  for (let k = -limit; k <= limit; k++) dist[k.toString()] = 0;
  dist[`<${-limit}`] = 0;
  dist[`>${limit}`] = 0;

  // Usamos um range seguro para o loop interno para cobrir a maior parte da probabilidade
  const safeMaxGoals = 15; 

  for (let h = 0; h <= safeMaxGoals; h++) {
    for (let a = 0; a <= safeMaxGoals; a++) {
      const prob = calculatePoisson(homeXG, h) * calculatePoisson(awayXG, a);
      const diff = h - a;
      if (diff < -limit) dist[`<${-limit}`] += prob;
      else if (diff > limit) dist[`>${limit}`] += prob;
      else dist[diff.toString()] += prob;
    }
  }
  return dist;
};