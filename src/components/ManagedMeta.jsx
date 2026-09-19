import { useLayoutEffect } from 'react';
import { Helmet } from 'react-helmet-async';

export default function ManagedMeta({ children, robots = 'index, follow, max-image-preview:large' }) {
  useLayoutEffect(() => {
    // React 19 adds its own head elements; retire only the server-owned copies.
    document.head.querySelectorAll('[data-server-meta]').forEach((element) => element.remove());
  }, []);

  return <Helmet prioritizeSeoTags><meta name="robots" content={robots} />{children}</Helmet>;
}
