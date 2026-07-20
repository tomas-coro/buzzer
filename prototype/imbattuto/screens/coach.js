// Tre coach fissi con voti OFF/DEF diversi (nel prototipo bastano a mostrare l'effetto).
const COACH = [
  { id: "off", name: "Coach d'Attacco", off_grade: "A", def_grade: "C", champ_bonus: 0 },
  { id: "bil", name: "Coach Equilibrato", off_grade: "B", def_grade: "B", champ_bonus: 1 },
  { id: "def", name: "Coach di Difesa", off_grade: "C", def_grade: "A", champ_bonus: 0 },
];

// ctx: { dispatch }
export function render(ctx) {
  const el = document.createElement("section");
  el.className = "screen coach";
  el.innerHTML = `<h2 class="display">Scegli il coach</h2>
    <div class="coaches">${COACH.map((c) => `
      <button class="coach-card" data-id="${c.id}">
        <span class="coach-name display">${c.name}</span>
        <span class="grades">OFF ${c.off_grade} · DEF ${c.def_grade}${c.champ_bonus ? ` · +${c.champ_bonus}` : ""}</span>
      </button>`).join("")}</div>`;
  el.querySelectorAll(".coach-card").forEach((b) => {
    b.onclick = () => ctx.dispatch({ type: "chooseCoach", coach: COACH.find((c) => c.id === b.dataset.id) });
  });
  return el;
}
