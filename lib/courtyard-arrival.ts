// A one-use visual transition, never a persisted choice of navigation mode.
export function consumeCourtyardArrival(): boolean {
  try {
    const raw = sessionStorage.getItem("la-ganga:desde-patio");
    sessionStorage.removeItem("la-ganga:desde-patio");
    if (!raw) return false;
    const value = JSON.parse(raw);
    const age = Date.now() - value.at;
    return age >= 0 && age < 15000 && value.hash === location.hash;
  } catch {
    return false;
  }
}
