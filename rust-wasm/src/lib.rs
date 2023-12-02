
use wasm_bindgen::prelude::*;
use serde::Serialize;
use std::ffi::CString;
use std::os::raw::c_char;


use zkwasm_rust_sdk::{
    wasm_input,
    // Merkle,
    require,
    // wasm_dbg
};



// use LCGRandGen;

// pub mod common;
// pub mod lcg_rand_gen; // Assuming you placed LCGRandGen code in lcgrandgen.rs or lcgrandgen/mod.rs
// pub mod vec2;
// pub mod player;
// pub mod server;
// pub mod game;


// use crate::common::*;
// use crate::vec2::*;
// use crate::server::*;
// use game::Game_states;
// use player::PlayerState;

// =-> =-> =-> =-> =-> =-> =-> =-> =-> =-> =-> =-> =-> =-> 



static mut POSITION: i32 = 100;

#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[wasm_bindgen]
pub fn get_position() -> i32 {
    unsafe { POSITION }
}

#[wasm_bindgen]
pub fn perform_command(command: i32) {
    if command == 0 {
        unsafe { POSITION -= 1 }
    } else {
        unsafe { POSITION += 1 }
    }
}



// =-> =-> =-> =-> =-> =-> =-> =-> =-> =-> =-> =-> =-> =-> 



// #[wasm_bindgen]
// pub fn get_position_str() -> JsValue {
//     // unsafe { serde_json::to_string(&POSITION).unwrap() }
//     JsValue::from_str("asdfasdf")
// }


#[wasm_bindgen]
pub fn get_position_str() -> String {
    unsafe { serde_json::to_string(&POSITION).unwrap() }
    // JsValue::from_str("asdfasdf")
}




// #[wasm_bindgen]
// pub fn create_game() -> i64 {

//     // const n_players: i32 = 1;
//     // const seed: u64 = 2345344;
//     // const max_rounds: i32 = 5;
//     // const bump_interval: i32 = 2;
//     // const n_rows: i32 = MAP_HEIGHT;
//     // const n_cols: i32 = MAP_WIDTH;

//     // // let state_str = create_initial_game_states(n_players, seed, max_rounds, bump_interval, n_rows, n_cols);

//     // // state_str

//     // let state_str = "asdfasdfsd".to_owned();

//     // let len = state_str.len();
//     // let s = CString::new(state_str).unwrap();

//     // // haven't written such hacky code in a long while 
//     // (s.into_raw() as i64) * (2^32) + (len as i64)

//     // unsafe { serde_json::to_string(&POSITION).unwrap() }
//     // JsValue::from_str("asdfasdf")

//     12
// }




const LCG_M: u64 = 4294967296;
const LCG_A: u64 = 22695477;
const LCG_C: u64 = 1;


#[wasm_bindgen]
pub struct LCGRandGen {
    pub seed: u64,
}

#[wasm_bindgen]
impl LCGRandGen {
    pub fn new(seed: u64) -> Self {
        Self {
            seed,
        }
    }

    pub fn randint(&mut self, max: u32) -> u32 {
        self.seed = (self.seed * LCG_A + LCG_C) % LCG_M;
        (self.seed % (max as u64)) as u32
    }
}


pub fn randint(seed: u64, max: i32) -> (u64, i32) {
    let seed = (seed * LCG_A + LCG_C) % LCG_M;
    (seed, (seed % (max as u64)) as i32)
    // (self.seed % (max as u64)) as u32
}





#[wasm_bindgen]
pub fn zkmain() {
    unsafe {
        let result = wasm_input(1);
        let input_len = wasm_input(1);
        let mut cursor = 0;

        while cursor < input_len {
            let command = wasm_input(0);  
            perform_command(command as i32);
            cursor += 1;
        }

        // wasm_dbg(POSITION as u64);

        let c = if result as i32 == POSITION {true} else {false};
        // wasm_dbg(c as u64);
        require(c);
    }
}




// #[wasm_bindgen]
// pub fn zkmain() {
//     unsafe {

//         // let state =  Game_states {
//         //     state: GameStateList[wasm_input(1) as usize],
//         //     round: wasm_input(1) as i32,
//         //     n_fire_throws: wasm_input(1) as i32,
//         //     n_players: wasm_input(1) as i32,
//         //     max_rounds: wasm_input(1) as i32,
//         //     bump_interval: wasm_input(1) as i32,
//         //     n_rows: wasm_input(1) as i32,
//         //     n_cols: wasm_input(1) as i32,

//         //     ts: wasm_input(1),
//         //     start_ts: wasm_input(1),
//         //     last_update_ts: wasm_input(1),
//         //     warning_starting_ts: wasm_input(1),
//         //     end_game_ts: wasm_input(1),

//         //     player_states: [],
//         //     row_firing: [],
//         //     col_firing: [],
//         //     lcg_rand_seed: wasm_input(1),
//         // };

//         let state =  Game_states {
//             state: GameState::STARTING,
//             round: 0,
//             n_fire_throws: 1,
//             n_players: 1,
//             max_rounds: 5,
//             bump_interval: 2,
//             n_rows: 3,
//             n_cols: 3,

//             ts: 10,
//             start_ts: 10,
//             last_update_ts: 10,
//             warning_starting_ts: 10,
//             end_game_ts: 10,

//             player_states: vec![ PlayerState {
//                 id: 0,
//                 pixelpos: Vector2::new(10, 10),
//                 tilepos: Vector2::new(1, 1),
//                 direction: Direction::NONE,
//                 moving: false, 
//                 exp_gained: 0,
//                 eliminated_ts: 0,
//                 tile_size_pixel_walked: 0,
//                 last_movement_intent: Direction::NONE
//             }
//             ],
//             row_firing: vec![false, false, false],
//             col_firing: vec![false, false, false],
//             lcg_rand_seed: wasm_input(1),
//         };


//     }
// }
