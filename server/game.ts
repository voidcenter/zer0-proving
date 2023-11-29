import { Vector2 } from "./Vector2";
import { LCG_Rand_Gen } from "./protocol";


export interface GameConfig {
    max_rounds: number;
    bump_interval: number;   // determines how fast the fire increases, if interval is 2, then 
                             // round 1/2 have 1 fire, round 3/4 have 2 fires, etc. 
                             // if interval is 3, then round 1/2/3 have 1 fire
    n_rows: number;
    n_cols: number;
    rand: LCG_Rand_Gen
}


export enum GameState {
    STARTING = 0,               // can have some initial starting things, LLM, etc. 
    WAITING = 1,
    WARNING = 2,
    FIRING = 3,
    FINISHED = 4
}


export class Game {

    static readonly Initial_wait = 1000;
    static readonly Waiting_time = 1000;   // at the beginning of each round, wait for this many ms
    static readonly Warning_time = 3000;
    static readonly Firing_time = 3000;
    static readonly Fading_wait = 2000;
    static readonly Fading_time = this.Initial_wait;
    static readonly Round_time = this.Waiting_time + this.Warning_time + this.Firing_time;

    start_ts: number;

    round: number;
    frame: number;
    n_fire_throws: number;
    player_exp_gained: number[];
    player_eliminated_ts: (number | null)[];    // used as player_in_game 
     
    state: GameState;
    row_firing: boolean[];
    col_firing: boolean[];
    warning_starting_ts: number = -1;
    end_game_ts: number = -1;


    constructor (
            public config: GameConfig, 
            public n_players: number    // usually their pubKeys
        ) {

        this.start_ts = Date.now() + 1500;
        this.round = 0;
        this.frame = 0;
        this.n_fire_throws = Math.floor(this.round / config.bump_interval) + 1;
        this.player_exp_gained = Array(this.n_players).fill(0);
        this.player_eliminated_ts = Array(this.n_players).fill(null);
        
        this.state = GameState.STARTING;
        this.row_firing = Array(config.n_rows).fill(false);
        this.col_firing = Array(config.n_cols).fill(false);

    }


    determine_fire_throws() {
        this.warning_starting_ts = Date.now();

        this.row_firing = Array(this.config.n_rows).fill(false);
        this.col_firing = Array(this.config.n_cols).fill(false);

        for (let i=0; i<this.n_fire_throws; i++) {
            const r = this.config.rand.randint(this.config.n_rows - 2 + this.config.n_cols - 2);
            if (r < this.config.n_rows - 2) {
                this.row_firing[r + 1] = true;
            } else {
                this.col_firing[r - (this.config.n_rows - 2) + 1] = true;
            }
        }        
    }


    check_fire(player_pos: Vector2[]) {
        player_pos.map((pos, pidx) => {
            if (this.player_eliminated_ts[pidx]) {
                return;
            }

            this.row_firing.map((fr, fidx) => {
                if (fr && fidx === pos.y) {
                    this.player_eliminated_ts[pidx] = Date.now();
                }
            });

            this.col_firing.map((fr, fidx) => {
                if (fr && fidx === pos.x) {
                    this.player_eliminated_ts[pidx] = Date.now();
                }
            })
        });
    }


    end_game() {
        this.state = GameState.FINISHED;
        this.end_game_ts = Date.now();
    }


    reward_survivors(func: (x: number) => number) {
        this.player_eliminated_ts.map((ets, idx) => {
            if (!ets) {
                this.player_exp_gained[idx] = func(this.player_exp_gained[idx]);
            }
        });
    }


    update(player_pos: Vector2[]) {
        if (this.state === GameState.FINISHED) {
            return;
        }
        this.frame++;

        const ts = Date.now();
        const lapse = ts - this.start_ts - Game.Initial_wait;
        if (lapse < Game.Initial_wait) {
            return;
        }

        const last_round = this.round;
        this.round = Math.max(0, Math.floor(lapse / Game.Round_time));

        // after last round, everyone still in the game gains EXP
        const new_round = this.round != last_round;
        if (new_round) {
            this.reward_survivors(x => x + this.n_fire_throws);

            // if all players have been elimited, end game
            const all_players_eliminated = this.player_eliminated_ts.filter(ets => ets).length === this.n_players;
            if (all_players_eliminated) {
                this.end_game();
                return;
            }
        }

        // end game 
        const game_won = this.round >= this.config.max_rounds;
        if (game_won) {
            this.end_game();
            this.reward_survivors(x => x * 2);
            return;
        }

        // init fire throws 
        this.n_fire_throws = Math.floor(this.round / this.config.bump_interval) + 1;

        // determine round state
        const round_lapse = lapse % Game.Round_time;
        const previous_state = this.state;
        this.state = (round_lapse < Game.Waiting_time) ? GameState.WAITING : 
            (round_lapse < Game.Waiting_time + Game.Warning_time ? GameState.WARNING : GameState.FIRING);
        
        // determine fire throws
        if (this.state != previous_state && this.state === GameState.WARNING) {
            this.determine_fire_throws();
        }

        if (this.state === GameState.FIRING) {
            this.check_fire(player_pos);
        }
    }


    all_done() {
        return this.end_game_ts > 0 && Date.now() > this.end_game_ts + Game.Fading_wait + Game.Fading_time;
    }
}

