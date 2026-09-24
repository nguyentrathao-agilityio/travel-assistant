import { goBackOrReplace } from '../navigation';

const makeRouter = (canGoBack: boolean) => ({
  back: jest.fn(),
  canGoBack: jest.fn(() => canGoBack),
  replace: jest.fn(),
});

test('goes back when navigation history is available', () => {
  const router = makeRouter(true);

  goBackOrReplace(router, '/dashboard');

  expect(router.back).toHaveBeenCalledTimes(1);
  expect(router.replace).not.toHaveBeenCalled();
});

test('replaces with the fallback route when navigation history is empty', () => {
  const router = makeRouter(false);

  goBackOrReplace(router, '/dashboard');

  expect(router.back).not.toHaveBeenCalled();
  expect(router.replace).toHaveBeenCalledWith('/dashboard');
});
