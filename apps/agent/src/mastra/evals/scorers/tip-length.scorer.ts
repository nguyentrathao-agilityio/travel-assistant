export const TipLength = ({ output }: { output: string }) => ({
  name: 'TipLength',
  score: output.trim().split(/\s+/).length <= 15 ? 1 : 0,
});
