import type { User } from "./User";

export interface Campaign {
    id: number,
    name: string,
    description: string,
    dm: User,
}