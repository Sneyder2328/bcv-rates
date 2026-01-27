export function vesToForeign(ves: number, rate: number): number {
  return ves / rate;
}

export function foreignToVes(foreign: number, rate: number): number {
  return foreign * rate;
}
