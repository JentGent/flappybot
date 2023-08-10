/**
 * Flappy Bird Neural Network
 * 7-5-2019
**/

// Setup
var setup = function() {
    createCanvas(600, 600);
    angleMode(DEGREES);
    sprites.load();
    frameRate(Infinity);
};

// Sprites
var sprites = {
	bird: "Bird.png",
	pipe: "Pipe.png",
	city: "City.png",

	load: function() {
		for(var key in this) {
			if(key === "load") {
				continue;
			}
			// this[key] = loadImage(this[key]);
            clear();
            rect(0, 0, 10, 10);
            this[key] = get(0, 0, 10, 10);
		}
	}

}

// Neural Network Settings
var sampleSize = 500;
var easeOfLife = 1;
var change = 0.1;

// Pipe Settings
var gap = 100;
var pipeSpeed = 3;
var pipeWidth = 50;
var pipeAppear = 100;

// Other Settings
var gravity = 0.5;
var ground = 550;

// Globals
var pipeSpawn = 0;
var passedFirst = false;
var genNo = 1;
var successBird;

// Copy Object
var copyObject = function(o) {
	var a = {};
	for(var i in o) {
		a[i] = o[i];
	}
	return a;
};

// Rect Rect Intersection
var intersectRectRect = function(x, y, w, h, x2, y2, w2, h2) {
    return x > x2 - w && y > y2 - h && x < x2 + w2 && y < y2 + h2;
};

// Pipe
var pipes = [];
var Pipe = function() {
    this.x = width;
    this.y = random(150, height - gap - 150);
};
Pipe.prototype.do = function() {
    fill(0, 255, 0);
    push();
    translate(this.x + pipeWidth / 2, this.y / 2);
    scale(1, -1);
    image(sprites.pipe, -pipeWidth / 2, -this.y / 2);
    pop();
    image(sprites.pipe, this.x, this.y + gap);
    this.x -= pipeSpeed;
};

// Bird
var birds = [];
var Bird = function() {
    this.x = 0;
    this.y = 290;
    this.width = 48;
    this.height = 30;

    this.velocityY = 0;

    this.nodes = [];
    this.inputs = {
    	xDist: [550, random(-1 / 50, 1 / 50)],
    	velocityY: [0, random(-1 / 7, 1 / 7)],
    	yDistTop: [30, random(-1 / 375, 1 / 375)],
    	yDistBottom: [20, random(-1 / 350, 1 / 350)],
    	pipeSpeed: [3, random(-1 / 100, 1 / 100)],
    };
    this.willJump = 0;
    this.dead = false;
    this.survivedFor = 0;

    this.jump = function() {
        this.velocityY = -7;
    };
    this.do = function() {
    	this.survivedFor ++;
        fill(255, 255, 0);
        noStroke();
        push();
        translate(this.x + this.width / 2, this.y + this.height / 2);
        rotate(this.velocityY * 6);
        image(sprites.bird, -this.width / 2, -this.height / 2, this.width, this.height);
        pop();

        for(var i = pipes.length - 1; i >= 0; i --) {
            if(!intersectRectRect(this.x, this.y, this.width, this.height, pipes[i].x, 0, pipeWidth, pipes[i].y) && !intersectRectRect(this.x, this.y, this.width, this.height, pipes[i].x, pipes[i].y + gap, pipeWidth, height)) {
                continue;
            }
            this.dead = true;
        }

        this.velocityY += gravity;
        this.velocityY = constrain(this.velocityY, -7, 7);
        this.y += this.velocityY;
        this.y = constrain(this.y, 0, height);

        var nextPipe = pipes[0];
        if(nextPipe.x < this.x - pipeWidth) {
        	nextPipe = pipes[1];
        }
        this.inputs.xDist[0] = nextPipe.x - this.x + this.width;
        this.inputs.velocityY[0] = this.velocityY;
        this.inputs.yDistTop[0] = abs(this.y - nextPipe.y);
        this.inputs.yDistBottom[0] = abs(nextPipe.y + gap - this.y + this.height);
        this.inputs.pipeSpeed[0] = pipeSpeed;
        this.willJump = 0;
        this.willJump += this.inputs.xDist[0] * this.inputs.xDist[1] / ((passedFirst) ? 1 : 11);
        this.willJump += this.inputs.velocityY[0] * this.inputs.velocityY[1];
        this.willJump += this.inputs.yDistTop[0] * this.inputs.yDistTop[1];
        this.willJump += this.inputs.yDistBottom[0] * this.inputs.yDistBottom[1];
        this.willJump += this.inputs.pipeSpeed[0] * this.inputs.pipeSpeed[1];
        if(this.willJump > 0) {
        	this.jump();
        }

        if(this.y + this.height > ground) {
            this.dead = true;
        }
    };
};

// Draw
var draw = function() {
    for(var asdf = 0; asdf < 10; asdf += 1) {
        if(birds.length === 0) {
            for(var i = 0; i < sampleSize; i ++) {
                birds.push(new Bird());
            }
            pipes = [];
            pipeSpawn = 0;
        }
        if(pipes.length === 0 || (pipes.length > 0 && pipes[pipes.length - 1].x < 300)) {
            pipes.push(new Pipe());
            pipeSpawn ++;
        }
        background(0, 230, 255);
        for(var i = -100; i < width + 100; i += 100) {
            image(sprites.city, i - (frameCount) % 100, 0);
        }

        var alive = false;
        for(var i = birds.length - 1; i >= 0; i --) {
            if(birds[i].dead) {
                continue;
            }
            alive = true;
            birds[i].do();
        }
        if(!alive) {
            pipeSpeed = 3;
            pipes.length = 0;
            pipeSpawn = 0;
            var best = 0;
            for(var i = 0; i < birds.length; i ++) {
                if(birds[i].survivedFor < best) {
                    continue;
                }
                best = birds[i].survivedFor;
                successBird = {
                    xDist: [550, birds[i].inputs.xDist[1]],
                    velocityY: [0, birds[i].inputs.velocityY[1]],
                    yDistTop: [30, birds[i].inputs.yDistTop[1]],
                    yDistBottom: [20, birds[i].inputs.yDistBottom[1]],
                    pipeSpeed: [3, birds[i].inputs.pipeSpeed[1]],
                };
            }
            birds = [];
            for(var i = 0; i < sampleSize; i ++) {
                birds.push(new Bird());
                var newBird = birds[birds.length - 1];
                newBird.inputs = {
                    xDist: [550, successBird.xDist[1]],
                    velocityY: [0, successBird.velocityY[1]],
                    yDistTop: [30, successBird.yDistTop[1]],
                    yDistBottom: [20, successBird.yDistBottom[1]],
                    pipeSpeed: [3, successBird.pipeSpeed[1]],
                };
                newBird.inputs.xDist[1] += random(-change, change);
                newBird.inputs.velocityY[1] += random(-change, change);
                newBird.inputs.yDistTop[1] += random(-change, change);
                newBird.inputs.yDistBottom[1] += random(-change, change);
                newBird.inputs.pipeSpeed[1] += random(-change, change);
            }
            genNo ++;
        }
        pipeSpeed += 0.01;
        for(var i = pipes.length - 1; i >= 0; i --) {
            pipes[i].do();
            if(pipes[i].x < -pipeWidth) {
                passedFirst = true;
                pipes.splice(i, 1);
            }
        }

        fill(0);
        textAlign(LEFT, TOP);
        textSize(20);
        text(genNo + "\n" + pipeSpawn, 0, 0);
    }
};
