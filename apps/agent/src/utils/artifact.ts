export const isErrorArtifact = (artifact: unknown): boolean =>
  typeof artifact === 'object' && artifact !== null && 'error' in artifact;
