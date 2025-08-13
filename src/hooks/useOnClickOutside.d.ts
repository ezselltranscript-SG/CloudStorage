import type { RefObject } from 'react';

/**
 * Hook que detecta clics fuera de un elemento especificado
 * @param ref Referencia al elemento a monitorear
 * @param handler Función a ejecutar cuando se detecta un clic fuera
 */
export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void
): void;
