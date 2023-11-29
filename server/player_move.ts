import { Vector2 } from './Vector2';
import { DIRECTION_VECS, Direction, MAP_HEIGHT, MAP_WIDTH, PIXEL_WALKED_PER_SEC, PlayerState, TILE_SIZE, clone_player_state } from './protocol';



// demo map 
const is_tile_blocking = (x, y) => {
    return (x <= 0) || (x >= MAP_WIDTH - 1) || (y <= 0) || (y >= MAP_HEIGHT - 1);
}



// heavily referencing https://medium.com/swlh/grid-based-movement-in-a-top-down-2d-rpg-with-phaser-3-e3a3486eb2fd 

// many of these need to be refactored to move to the server side

export class PlayerMove {
    private tileSizePixelsWalked: number = 0;
    private lastMovementIntent = Direction.NONE;
    public player: PlayerState;


    constructor(player: PlayerState) {
        this.player = clone_player_state(player);
    }

    
    // set player moving direction
    movePlayer(direction: Direction): void {
        // console.log('move player', this.player.id, direction);
        // console.log('[SERVER] move player', this.player.tilepos);

        this.lastMovementIntent = direction;

        if (this.player.moving) return;

        if (this.isBlockingDirection(direction)) {
            this.player.direction = direction;
            this.player.moving = false;

        } else {
            this.player.direction = direction;
            this.player.moving = true;
            this.updatePlayerTilePos();
        }
    }


    // move over tic
    update(delta: number) {
        this.lastMovementIntent = Direction.NONE;
        if (!this.player.moving) {
            return;
        }

        // if won't cross border, just walk
        const pixelsToWalkThisUpdate = Math.floor(PIXEL_WALKED_PER_SEC * delta / 1000);
        // console.log(pixelsToWalkThisUpdate);
        const will_cross_border = this.tileSizePixelsWalked + pixelsToWalkThisUpdate >= TILE_SIZE;
        if (!will_cross_border) {
            this.movePlayerSprite(pixelsToWalkThisUpdate);
            return;
        }

        // if crossing border, decide whether to stop 
        const should_continue_moving = 
            this.player.direction == this.lastMovementIntent &&
            !this.isBlockingDirection(this.lastMovementIntent);

        if (should_continue_moving) {
            this.movePlayerSprite(pixelsToWalkThisUpdate);
            this.updatePlayerTilePos();

        } else {
            this.movePlayerSprite(TILE_SIZE - this.tileSizePixelsWalked);
            this.player.moving = false;
        }
    }
    

    // update pixelpos
    private movePlayerSprite(pixelsToMove: number) {
        const directionVec = DIRECTION_VECS[this.player.direction].clone();
        const movementDistance = directionVec.multiply(new Vector2(pixelsToMove));
        this.player.pixelpos = this.player.pixelpos.add(movementDistance);

        this.tileSizePixelsWalked += pixelsToMove;
        this.tileSizePixelsWalked %= TILE_SIZE;
    }


    // update tilepos
    private updatePlayerTilePos() {
        this.player.tilepos.add(DIRECTION_VECS[this.player.direction]);
    }


    // map
    
    private isBlockingDirection(direction: Direction): boolean {
        const tileposInDirection = 
            this.player.tilepos.clone().add(DIRECTION_VECS[direction]);
        return this.hasBlockingTile(tileposInDirection);
    }
    
    private hasBlockingTile(pos: Vector2): boolean {
        return is_tile_blocking(pos.x, pos.y);
    }
}

