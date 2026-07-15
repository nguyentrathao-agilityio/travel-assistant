type DailyRates = { food: number; activities: number; transport: number };

export const CostInRange = ({ output }: { output: DailyRates }) => {
  const checks = [
    output.food >= 3 && output.food <= 150,
    output.activities >= 1 && output.activities <= 100,
    output.transport >= 1 && output.transport <= 50,
  ];

  return {
    name: 'CostInRange',
    score: checks.filter(Boolean).length / checks.length,
  };
};
