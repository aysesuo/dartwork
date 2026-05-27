/**
 * Module-level mutable store of current card canvas positions.
 * NOT React state — updated directly by DraggableProjectCard on every drag tick.
 * Read synchronously by the pin snap logic in the projects page.
 */
export const cardPositions = new Map<string, { x: number; y: number }>();

export const CARD_WIDTH = 270;
