// import Phaser from 'phaser';

// export const Vector2 = Phaser.Math.Vector2;
// export type Vector2 = Phaser.Math.Vector2;

import { Vector2 } from './Vector2';


/*
    each round trip is a frame
    let's try let each frame be flexible in terms of time

    assume:
       - only one map
       - no need to specify graphics (sprite sheet params, etc.)

*/


export const MAX_N_PLAYERS = 4;

export const BASE_TILE_SIZE = 32;
export const SCALING_FACTOR = 1;
export const TILE_SIZE = BASE_TILE_SIZE * SCALING_FACTOR;

export const BANNER_HEIGHT = TILE_SIZE * 1.25;
export const PIXEL_WALKED_PER_SEC = TILE_SIZE * 4;


export const MAP_WIDTH = 13;
export const MAP_HEIGHT = 10;

export const SCREEN_WIDTH = TILE_SIZE * MAP_WIDTH;
export const SCREEN_HEIGHT = TILE_SIZE * MAP_HEIGHT + BANNER_HEIGHT;



export enum GameState {
    STARTING = 0,               // can have some initial starting things, LLM, etc. 
    WAITING = 1,
    WARNING = 2,
    FIRING = 3,
    FINISHED = 4
}

export enum Direction {
    NONE = "none",
    LEFT = "left",
    UP = "up",
    RIGHT = "right",
    DOWN = "down",
}

export const DIRECTION_VECS : {
    [key in Direction]?: Vector2;
} = {
    [Direction.UP]: Vector2.UP,
    [Direction.DOWN]: Vector2.DOWN,
    [Direction.LEFT]: Vector2.LEFT,
    [Direction.RIGHT]: Vector2.RIGHT,
    // [Direction.NONE]: Vector2.ZERO,
};


export function player_tilepos_to_pixelpos (tilepos: Vector2): Vector2 {
    const offsetX = Math.floor(TILE_SIZE / 2);
    const offsetY = Math.floor(TILE_SIZE * 7 / 10);

    return new Vector2(
        tilepos.x * TILE_SIZE + offsetX,
        tilepos.y * TILE_SIZE + offsetY + BANNER_HEIGHT
    );
}


export interface PlayerState {
    id: number;
    pixelpos: Vector2;
    tilepos: Vector2;
    direction: Direction;
    moving: boolean;
}

export function clone_player_state(state: PlayerState): PlayerState {
    return {
        id: state.id, 
        pixelpos: state.pixelpos.clone(),
        tilepos: state.tilepos.clone(),
        direction: state.direction,
        moving: state.moving
    }
}


export interface Server_to_client_message {
    state: GameState;
    round: number;
    // frame: number;

    start_ts: number;  // when this game started
    hash?: string;  

    ts: number;  // current ts
    player_states: PlayerState[];

    // more state to come
    player_exp_gained: number[];
    player_eliminated_ts: (number | null)[];    // used as player_in_game 
    
    row_firing: boolean[];
    col_firing: boolean[];
    warning_starting_ts: number;
    end_game_ts: number;


    // some proof 
}

export interface Client_to_server_message {
    moving_direction: Direction;

    // more proofs
}



export class LCG_Rand_Gen {
    
    readonly lcg_m = 4294967296;
    readonly lcg_a = 22695477;
    readonly lcg_c = 1;

    constructor (private seed: number) {
    }

    randint(max: number) {
        this.seed = (this.seed * this.lcg_a + this.lcg_c) % this.lcg_m;
        return this.seed % max;
    }

}


