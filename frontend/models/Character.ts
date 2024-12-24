import type { CellOfGrid } from "./CellOfGrid";

export interface Character {
    armour: number,
    avatarUrl: string,
    current_health: number,
    fov: number,
    health: number,
    id: number,
    name: string,
    speed: number,
    status: string,
    initiative: number,
    x: number,
    y: number,
    user_id: number,
    pivot_id: number,
    hidden: boolean,
    last_cells: CellOfGrid[]
}