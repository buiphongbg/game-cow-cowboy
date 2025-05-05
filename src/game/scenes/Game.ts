import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    cowboy: Phaser.Physics.Arcade.Sprite;
    cows: any[];
    ropeBase: Phaser.GameObjects.Image;
    ropeGroup: Phaser.Physics.Arcade.Group;
    ropeLines: Phaser.GameObjects.Graphics;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x00ff00);

        this.background = this.add.image(512, 384, 'background');
        this.background.setAlpha(0.5);
        
        this.initAnimations();
        
        this.cowboy = this.physics.add.sprite(512, 740, 'cowboy');
        this.loadCows();
        this.loadRope();
        
        this.ropeGroup = this.physics.add.group({
            defaultKey: 'rope',
            maxSize: 20,
        });
        this.ropeLines = this.add.graphics();

        this.input.keyboard?.on('keydown-SPACE', () => {
            this.catchCow();
        });

        EventBus.emit('current-scene-ready', this);
    }
    
    update ()
    {
        const screenWidth = this.scale.width;

        this.cows.forEach((cow) => {
            cow.x -= cow.speed;

            // Nếu bò ra khỏi bên trái, đưa nó sang phải lại
            if (cow.x < -cow.width) {
                cow.x = screenWidth + Phaser.Math.Between(0, 300);
            }
        });
        
        const cursors = this.input.keyboard?.createCursorKeys();
        if (cursors) {
            if (cursors.left.isDown) {
                this.cowboy.anims.play('cowboy:left', true);
            } else if (cursors.right.isDown) {
                this.cowboy.anims.play('cowboy:right', true);
            } else {
                this.cowboy.anims.stop();
            }
        }
        
        this.ropeLines.clear();
        this.ropeGroup.children.iterate((rope) => {
            if (rope.cowTarget) {
                this.ropeLines.lineStyle(2, 0xffcc00);
                this.ropeLines.beginPath();
                this.ropeLines.moveTo(rope.cowTarget.x, rope.cowTarget.y);
                this.ropeLines.lineTo(512, 600); // vị trí trung tâm
                this.ropeLines.strokePath();
            }
            
            if (!rope.active) return;

            const outOfScreen = rope.x < 0 || rope.x > this.scale.width || rope.y < 0 || rope.y > this.scale.height;

            if (outOfScreen && !rope.body?.enable) {
                // Rope đã bắt bò thì body bị disable → không thu hồi
                return;
            }

            if (outOfScreen) {
                rope.setActive(false);
                rope.setVisible(false);
                rope.body.stop();
                rope.body.enable = false;
            }
        });
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
    
    catchCow() {
        // Stop cows
        this.cows.forEach((cow) => {
            cow.speed = 0;
        });

        // Get random 5 cows
        const selectedCows = Phaser.Utils.Array.Shuffle(this.cows).slice(0, 5);

        // Caught cows position
        const spacing = 100;  // the distance between cows
        const startX = this.scale.width / 2 - ((selectedCows.length - 1) * spacing) / 2;

        selectedCows.forEach((cow, index) => {
            const rope = this.getRope(this.scale.width / 2, this.scale.height - 50);
            if (!rope) {
                return;
            }

            

            // Xử lý va chạm giữa rope và bò
            const overlap = this.physics.add.overlap(rope, cow, () => {
                cow.setTint(0xff0000); // đánh dấu bò bị bắt
                rope.body.stop();
                rope.body.enable = false;

                // Gắn chặt vào bò
                rope.setDepth(1); // đảm bảo rope nằm trên bò
                rope.setPosition(cow.x, cow.y - 40); // hoặc điều chỉnh để rope nằm phía trên

                // Cập nhật vị trí rope theo cow
                rope.cowTarget = cow;

                this.physics.world.removeCollider(overlap);
            });

            // Move caught cow to position
            this.time.delayedCall(2000, () => {
                this.tweens.add({
                    targets: cow,
                    x: startX + index * spacing,
                    y: this.scale.height - 300,
                    duration: 2000,
                    ease: 'Power2'
                });
            });
        });
    }
    
    getRope(x: number, y: number) {
        const rope = this.ropeGroup.get(x, y);
        if (!rope) {
            return null;
        }
        rope.setActive(true);
        rope.setVisible(true);
        rope.body.enable = true;
        return rope;
    }
    
    loadRope() {
        this.ropeBase = this.physics.add.image(this.scale.width / 2, this.scale.height - 50, 'rope'); // bạn cần preload ảnh 'rope'
        this.ropeBase.setOrigin(0.5, 0.5);
    }
    
    drawRopeLine(cow, targetX, targetY) {
        
    }
    
    loadCows() {
        const cowCount = Phaser.Math.Between(10, 15);
        const screenWidth = this.scale.width;

        const rows = Phaser.Math.Between(2, 3); // số hàng: 2 hoặc 3
        const rowHeight = 80;

        this.cows = [];

        for (let i = 0; i < cowCount; i++) {
            const row = i % rows;
            const y = 50 + row * rowHeight;

            // bò sẽ bắt đầu ở vị trí random bên phải màn hình
            const x = Phaser.Math.Between(screenWidth, screenWidth + 500);

            const cow = this.physics.add.sprite(x, y, 'cow');
            cow.anims.play('cow:walk-left', true);
            cow.speed = Phaser.Math.FloatBetween(1, 2); // mỗi con bò có tốc độ riêng
            cow.body.setSize(70, 50);  // Thu nhỏ kích thước hitbox xuống
            cow.body.setOffset(20, 40);  // Đưa vị trí hitbox vào giữa

            this.cows.push(cow);
        }
    }
    
    initAnimations ()
    {
        this.anims.create({
            key: 'cowboy:left',
            frames: this.anims.generateFrameNumbers('cowboy', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'cowboy:right',
            frames: this.anims.generateFrameNumbers('cowboy', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'cowboy:idle',
            frames: this.anims.generateFrameNumbers('cowboy', { start: 4, end: 4 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'cow:back',
            frames: this.anims.generateFrameNumbers('cow', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'cow:idle',
            frames: this.anims.generateFrameNumbers('cow', { start: 8, end: 11 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'cow:walk-left',
            frames: this.anims.generateFrameNumbers('cow', { start: 4, end: 7 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'cow:walk-right',
            frames: this.anims.generateFrameNumbers('cow', { start: 12, end: 15 }),
            frameRate: 10,
            repeat: -1
        });
    }
}
