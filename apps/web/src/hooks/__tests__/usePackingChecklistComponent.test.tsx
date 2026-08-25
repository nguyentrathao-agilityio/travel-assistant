import { renderHook } from '@testing-library/react';
import { useComponent } from '@copilotkit/react-core/v2';
import { usePackingChecklistComponent } from '@/hooks/usePackingChecklistComponent';

jest.mock('@copilotkit/react-core/v2', () => ({
  useComponent: jest.fn(),
}));

describe('usePackingChecklistComponent', () => {
  beforeEach(() => jest.mocked(useComponent).mockClear());

  it('registers a display-only packing checklist tool', () => {
    renderHook(() => usePackingChecklistComponent());

    expect(jest.mocked(useComponent)).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'showPackingChecklist',
        description: expect.stringContaining('packing checklist'),
        parameters: expect.anything(),
        render: expect.any(Function),
      }),
      []
    );
  });
});
