'use client';

import React from 'react';

export default function ClientOnly({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
