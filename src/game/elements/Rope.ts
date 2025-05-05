import { GameObjects } from 'phaser';

export class Rope {
    private scene: Phaser.Scene;
    private start: Phaser.Math.Vector2;
    private to: Phaser.Math.Vector2;
    private target: GameObjects.Sprite;
    private rope: Phaser.GameObjects.TileSprite;
    private progress: number = 0;
    private state: 'extending' | 'pulling' | 'done' = 'extending';
    private speed: number = 0.02;
    
    constructor(scene: Phaser.Scene, start: Phaser.Math.Vector2) {
        this.scene = scene;
        this.rope = scene.add.tileSprite(start.x, start.y, 0, 32, 'rope-img');
    }
    
    update() {
        if (this.state === 'extending') {
            this.progress += this.speed;

            const dist = Phaser.Math.Distance.BetweenPoints(this.start, this.target);
            const currentLength = Phaser.Math.Linear(0, dist, this.progress);

            this.rope.width = currentLength;
            const angle = Phaser.Math.Angle.BetweenPoints(this.start, this.target);
            this.rope.setPosition(this.start.x, this.start.y);
            this.rope.setRotation(angle);

            if (this.progress >= 1) {
                this.rope.width = dist;
                this.state = 'done';
            }
        } else if (this.state === 'pulling') {
            const pullSpeed = 2;
            const pullTo = this.to || this.start;

            const dir = new Phaser.Math.Vector2(pullTo.x - this.target.x, pullTo.y - this.target.y);
            const dist = dir.length();

            if (dist < pullSpeed) {
                this.target.setPosition(this.start.x, this.start.y);
                this.state = 'done';
            } else {
                dir.normalize().scale(pullSpeed);
                this.target.x += dir.x;
                this.target.y += dir.y;

                // cập nhật dây theo mục tiêu đang di chuyển
                const angle = Phaser.Math.Angle.BetweenPoints(this.start, this.target);
                const length = Phaser.Math.Distance.BetweenPoints(this.start, this.target);
                this.rope.setRotation(angle);
                this.rope.width = length;
            }
        }
    }
    
    catch(target: GameObjects.Sprite) {
        this.target = target;
        this.state = 'extending';
    }
    
    pull(to: Phaser.Math.Vector2) {
        
    }
    
    destroy() {
        this.rope.destroy();
    }
}