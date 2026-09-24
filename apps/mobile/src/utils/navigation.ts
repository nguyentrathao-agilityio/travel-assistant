import type { Href } from 'expo-router';

interface BackNavigationRouter {
  back: () => void;
  canGoBack: () => boolean;
  replace: (href: Href) => void;
}

export const goBackOrReplace = (router: BackNavigationRouter, fallbackHref: Href): void => {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallbackHref);
};
