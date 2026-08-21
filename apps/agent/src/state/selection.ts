import { z } from 'zod';

const SelectedOptionsObjectSchema = z.object({
  flightId: z.string().optional(),
  returnFlightId: z.string().optional(),
  hotelId: z.string().optional(),
  placeIds: z.array(z.string()).default(() => []),
});
export const createDefaultSelectedOptions = () => ({ placeIds: [] });

export const SelectedOptionsSchema = SelectedOptionsObjectSchema.default(
  createDefaultSelectedOptions
);
type SelectedOptions = z.infer<typeof SelectedOptionsSchema>;

export const SelectedOptionsUpdateSchema = SelectedOptionsObjectSchema.partial();

export const mergeSelectedOptions = (
  current: SelectedOptions,
  update: Partial<SelectedOptions>
): SelectedOptions => ({ ...current, ...update });
