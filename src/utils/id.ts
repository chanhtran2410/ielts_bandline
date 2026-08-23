let counter = 0;

/**
 * Client-side id for optimistic objects that have not been persisted yet.
 *
 * Kept out of components deliberately: generating one is impure, and React 19
 * forbids impure calls during render. Behind a function it can only be reached
 * from an event handler or an effect, which is where it belongs.
 */
export function createLocalId(prefix: string): string {
  counter += 1;
  return prefix + '_' + Date.now().toString(36) + '_' + counter;
}
