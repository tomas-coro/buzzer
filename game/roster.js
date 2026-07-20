export const ROLES = ["PG", "SG", "SF", "PF", "C"];

export function canPlay(card, role) {
  return card.pos.primary === role || card.pos.secondary === role;
}

export function emptyQuintet() {
  return { PG: null, SG: null, SF: null, PF: null, C: null };
}

export function assign(quintet, role, card) {
  if (!ROLES.includes(role)) throw new Error(`Ruolo inesistente: ${role}`);
  if (quintet[role] !== null) throw new Error(`Slot ${role} già occupato`);
  if (!canPlay(card, role)) throw new Error(`Carta incompatibile con ${role}`);
  return { ...quintet, [role]: card };
}

export function isComplete(quintet) {
  return ROLES.every((role) => quintet[role] !== null);
}
