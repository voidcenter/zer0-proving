import { PlayerMove } from "./player_move";
import { Direction, LCG_Rand_Gen, MAP_HEIGHT, MAP_WIDTH, PlayerState, Server_to_client_message, clone_player_state, player_tilepos_to_pixelpos } from "./protocol";
import { Vector2 } from "./Vector2";
import { Game } from "./game";



// where all the authorities are held 
export class GameServer {

    moves: PlayerMove[] = [];
    last_update_ts = 0;
    game: Game;

    constructor(public n_players: number, seed: number) {

        const rand = new LCG_Rand_Gen(seed);

        for (let i=0; i<n_players; i++) {
            const tilepos = new Vector2(rand.randint(MAP_WIDTH - 2) + 1, rand.randint(MAP_HEIGHT - 2) + 1);
            // const tilepos = new Vector2(5,1);
            const pixelpos = player_tilepos_to_pixelpos(tilepos);
            console.log('[SERVER]', tilepos, pixelpos);
            const player_state = {
                id: i,
                tilepos,
                pixelpos,
                direction: Direction.NONE,
                moving: false
            };
            const move = new PlayerMove(player_state);
            this.moves.push(move);
        }
        this.reset_last_update_ts();

        this.game = new Game({
            max_rounds: 5,
            bump_interval: 2,
            n_rows: MAP_HEIGHT,
            n_cols: MAP_WIDTH,
            rand
        }, n_players);
    }

    reset_last_update_ts() {
        this.last_update_ts = Date.now();
    }

    // get all player intents, tick once, return all player states
    update(player_intents: Direction[]): Server_to_client_message {
        // console.log('server, player its', player_intents);

        // some of these intents can be null, but the numbers must match
        if (player_intents.length != this.n_players) {
            throw `expecting ${this.n_players} intents, got ${player_intents.length}`;
        }

        // enter intents
        player_intents.map((intent, idx) => {
            if (intent) {
                this.moves[idx].movePlayer(intent);
            }
        })

        // tic 
        const delta = Date.now() - this.last_update_ts;
        this.last_update_ts = Date.now();
        this.moves.map(move => {
            move.update(delta);
        });

        // update game
        this.game.update(this.moves.map(move => move.player.tilepos));

        // return new states
        return this.pack_data_to_client();
    }


    pack_data_to_client() {
        return {
            state: this.game.state,
            round: this.game.round,
            start_ts: this.game.start_ts,
            ts: Date.now(),
            player_states: this.moves.map(move => clone_player_state(move.player)),

            player_exp_gained: this.game.player_exp_gained,
            player_eliminated_ts: this.game.player_eliminated_ts,
            
            row_firing: this.game.row_firing,
            col_firing: this.game.col_firing,
            warning_starting_ts: this.game.warning_starting_ts,
            end_game_ts: this.game.end_game_ts

        }
    }

    
    all_done() {
        return this.game.all_done();
    }
}

