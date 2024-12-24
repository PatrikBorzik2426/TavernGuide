import type { Character } from "./Character";

export interface CellOfGrid {
    id: number,
    x: number,
    y: number,
    visibility: boolean,
    classes: string,
    character: Character | null,
    viewedBy: Character[]
}