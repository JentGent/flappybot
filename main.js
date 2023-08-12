/**
 * Flappy Bird Neural Network
 * 7-5-2019
**/

// Setup
var slider, data, best, freeze;
function setup() {
    createCanvas(windowWidth, 600);
    angleMode(DEGREES);
    sprites.load();
    frameRate(Infinity);
    slider = document.getElementById("slider");
    data = document.getElementById("data");
    best = document.getElementById("best");
    freeze = document.getElementById("freeze");
    for(var i = 0; i < sampleSize; i ++) {
        birds.push(new Bird());
    }
    pipes = [];
    new Pipe();
    new Pipe();
    pipesPassed = 0;
};
function windowResized() {
    resizeCanvas(windowWidth, 600);
}

// Sprites
var sprites = {
	bird: "Bird.png",
	pipe: "Pipe.png",
	city: "City.png",

	load: function() {
		for(var key in this) {
			if(key === "load") continue;
			this[key] = loadImage(this[key]);
            // clear();
            // rect(0, 0, 10, 10);
            // this[key] = get(0, 0, 10, 10);
		}
	}
};

// Neural Network Settings
var sampleSize = 500;
var live = 10;
var change = 0.1;

// Pipe Settings
var gap = 150;
var pipeDist = 100;
var pipeSpeed = 3;
var pipeWidth = 100;
var pipeAppear = 100;

// Other Settings
var gravity = 0.5;
var ground = 550;

// Globals
var pipesPassed = 0;
var passedFirst = false;
var genNo = 1;
var offset = pipeDist + pipeWidth / 2;

// Rect Rect Intersection
var intersectRectRect = function(x, y, w, h, x2, y2, w2, h2) {
    return x > x2 - w && y > y2 - h && x < x2 + w2 && y < y2 + h2;
};

// Pipe
function hashCode(str) {
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}
var pipes = [];
class Pipe {
    constructor() {
        if(pipes.length) {
            this.x = pipes[pipes.length - 1].x + pipeWidth + pipeDist;
            if(pipes.length > 1) {
                var last = pipes[pipes.length - 1].y > pipes[pipes.length - 2].y;
                this.y = last && random() > 0.25 ? random(constrain(pipes[pipes.length - 1].y - gap, 0, ground - gap), constrain(pipes[pipes.length - 1].y, 0, ground - gap)) : random(constrain(pipes[pipes.length - 1].y, 0, ground - gap), constrain(pipes[pipes.length - 1].y + gap, 0, ground - gap));
            }
            else this.y = random(constrain(pipes[pipes.length - 1].y - gap, 0, ground - gap), constrain(pipes[pipes.length - 1].y + gap, 0, ground - gap));
        }
        else {
            this.x = 600;
            this.y = random(0, ground - gap);
        }
        this.y = constrain(this.y, 0, ground - gap)
        pipes.push(this);
    }
    draw() {
        fill(0, 255, 0);
        push();
        translate(this.x + pipeWidth / 2, this.y / 2);
        scale(1, -1);
        image(sprites.pipe, -pipeWidth / 2, -this.y / 2, pipeWidth, sprites.pipe.height * pipeWidth / sprites.pipe.width);
        pop();
        image(sprites.pipe, this.x, this.y + gap, pipeWidth, sprites.pipe.height * pipeWidth / sprites.pipe.width);
    }
    do() {
        this.x -= pipeSpeed;
    }
};

// Layers
class Linear {
    constructor(inputs, outputs) {
        this.inputs = inputs;
        this.outputs = outputs;
        this.weights = [];
        this.biases = [];
        for(var i = 0; i < inputs; i += 1) {
            var node = [];
            for(var j = 0; j < outputs; j += 1) {
                node.push(randomGaussian(0, 2 / sqrt(inputs + outputs)));
            }
            this.weights.push(node);
            this.biases.push(0);
        }
    }
    copy(layer) {
        for(var i = 0; i < this.inputs; i += 1) {
            this.weights[i] = [...layer.weights[i]];
            this.biases[i] = layer.biases[i];
        }
    }
    mutate(change) {
        for(var i = 0; i < this.inputs; i += 1) {
            for(var j = 0; j < this.outputs; j += 1) {
                this.weights[i][j] += randomGaussian(0, change / sqrt(this.inputs + this.outputs));
            }
            this.biases[i] += randomGaussian(0, change / sqrt(this.inputs + this.outputs));
        }
    }
    forward(input) {
        var output = [];
        for(var i = 0; i < this.outputs; i += 1) {
            var out = 0;
            for(var j = 0; j < this.inputs; j += 1) {
                out += input[j] * this.weights[j][i] + this.biases[j];
            }
            output.push(out);
        }
        return output;
    }
}

class Tanh {
    constructor() { }
    forward(input) {
        return input.map(Math.tanh);
    }
}

class RelU {
    constructor() { }
    forward(input) {
        return input.map(a => a > 0 ? a : 0);
    }
}

// Bird
var birds = [];
var bestBirds = [];
class Bird {
    constructor() {
        this.x = 0;
        this.y = 290;
        this.width = 48;
        this.height = 30;

        this.yVel = 0;

        this.time = 0;
        this.layers = [
            new Linear(7, 7),
            // new RelU(),
            new Tanh(),
            new Linear(7, 7),
            // new RelU(),
            new Tanh(),
            new Linear(7, 1),
        ];
        this.dead = false;
    }
    jump() {
        this.yVel = -7;
    }
    copy(bird) {
        for(var i = 0; i < this.layers.length; i += 1) {
            if(typeof this.layers[i].copy == "function") this.layers[i].copy(bird.layers[i]);
        }
    }
    mutate(change) {
        for(var i = 0; i < this.layers.length; i += 1) {
            if(typeof this.layers[i].mutate == "function") this.layers[i].mutate(change);
        }
    }
    draw() {
        fill(255, 255, 0);
        noStroke();
        push();
        translate(this.x + this.width / 2, this.y + this.height / 2);
        rotate(this.yVel * 6);
        image(sprites.bird, -this.width / 2, -this.height / 2, this.width, this.height);
        pop();
    }
    do() {
        this.time += 0.1;
        this.yVel += gravity;
        this.yVel = constrain(this.yVel, -7, 7);
        this.y += this.yVel;
        this.y = constrain(this.y, 0, height);

        var pipe1 = pipes[0], pipe2 = pipes[1];
        if(pipe1.x < this.x - pipeWidth) {
            pipe1 = pipes[1];
            pipe2 = pipes[2];
        }
        var tensor = [
            map(this.x, pipe1.x - pipeDist, pipe1.x, 0, 1), // x dist to next pipe
            map(this.x, pipe2.x - pipeDist, pipe2.x, 0, 1),
            this.yVel / 7,
            (pipe1.y - this.y) / 600, // y dist to top pipe
            (pipe2.y - this.y) / 600,
            (this.y + this.height - pipe1.y - gap) / 600, // y dist to bottom pipe
            (this.y + this.height - pipe2.y - gap) / 600,
        ];
        for(var i = 0; i < this.layers.length; i += 1) {
            tensor = this.layers[i].forward(tensor);
        }
        if(tensor[0] > 0) this.jump();

        if(this.y + this.height > ground) this.dead = true;
        for(var i = pipes.length - 1; i >= 0; i--) {
            if(!intersectRectRect(this.x, this.y, this.width, this.height, pipes[i].x, 0, pipeWidth, pipes[i].y) && !intersectRectRect(this.x, this.y, this.width, this.height, pipes[i].x, pipes[i].y + gap, pipeWidth, height)) continue;
            this.dead = true;
        }
    }
};

function sampleBird(birds) {
    let totalWeight = birds.reduce((sum, bird) => sum + bird.time, 0);
    let sample = random(totalWeight);
    for(var bird of birds) {
        sample -= bird.time;
        if(sample <= 0) return bird;
    }
}

function run() {
    frames += 1;
    while(pipes[pipes.length - 1].x + pipeWidth + pipeDist < width) {
        new Pipe();
    }

    for(var i = birds.length - 1; i >= 0; i --) {
        if(birds[i].dead) {
            if(birds.length > 1) {
                birds.splice(i, 1);
                if(birds.length <= live) break;
                continue;
            }
            else {
                allDead = true;
                break;
            }
        }
        birds[i].do();
    }
    // pipeSpeed += 0.001;
    for(var i = pipes.length - 1; i >= 0; i --) {
        pipes[i].do();
        if(pipes[i].x < -pipeWidth - offset) {
            passedFirst = true;
            pipesPassed ++;
            pipes.splice(i, 1);
        }
    }
}

function reset(successBirds) {
    frames = 0;
    dead = false;
    pipeSpeed = 3;
    pipes = [];
    new Pipe();
    new Pipe();
    birds = [];
    pipesPassed = 0;
    var newBirds = [];
    for(var i = 0; i < successBirds.length; i += 1) {
        var bird = new Bird();
        var successBird = successBirds[i];
        bird.copy(successBird);
        newBirds.push(bird);
    }
    for(var i = newBirds.length; i < sampleSize; i ++) {
        var newBird = new Bird();
        var successBird = sampleBird(successBirds);
        newBird.copy(successBird);
        newBird.mutate(change);
        newBirds.push(newBird);
    }
    birds = newBirds;
    genNo ++;
    allDead = false;
}

function display() {
    background(0, 230, 255);
    for(var i = -100; i < width + 100; i += 100) {
        image(sprites.city, i - (frames) % 100, 0);
    }
    push();
    translate(offset, 0);
    for(var i = pipes.length - 1; i >= 0; i --) {
        pipes[i].draw();
    }
    for(var i = birds.length - 1; i >= 0; i --) {
        // if(birds[i].dead) continue;
        birds[i].draw();
    }
    pop();
    fill(255);
    textAlign(LEFT, TOP);
    textSize(20);
    text("Generation " + genNo + "\nPipe " + pipesPassed, 10, 10);
}

// Draw
var frames = 0, dead = false, allDead = false;
function draw() {
    for(var asdf = 0; asdf < slider.value; asdf += 1) {
        run();
        if(birds.length <= live && !dead) {
            dead = true;
            
            bestBirds = [...birds];
            // for(var bird of birds) {
            //     bestBirds.push(bird);
            // }
            // bestBirds = [...new Set(bestBirds)];
            // bestBirds.sort((a, b) => b.time - a.time);
            // bestBirds = bestBirds.slice(0, live);
        }
        if(allDead) {
            var high = best.innerHTML.split(" ");
            high = high[high.length - 1];
            if(pipesPassed > high) {
                best.innerHTML = "Generation " + genNo + " best: " + pipesPassed;
                data.innerHTML = "<span class='best'>Generation " + genNo + " best: " + pipesPassed + "</span><br>" + data.innerHTML;
            }
            else data.innerHTML = "Generation " + genNo + " best: " + pipesPassed + "<br>" + data.innerHTML;
            if(freeze.value > 0) {
                display();
                reset(bestBirds);
                noLoop();
                setTimeout(loop, freeze.value);
                return;
            }
            else reset(bestBirds);
        }
    }
    display();
};
