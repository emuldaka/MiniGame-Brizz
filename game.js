const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const timerElement = document.getElementById("timer");
let projectileDamage = 5;

// Game variables
let gameInterval;
let spawnInterval;
let timerInterval;
let shootingInterval;
let elapsedTime = 0;
let score = 0;
let brizz;
let projectiles = [];
let poops = [];
let spikes = [];
let lastSpikeTime = 0;
//Test

class Brizz {
  constructor(x, y, size, speed, health) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.speed = speed;
    this.health = 20;
    this.sprite = new Image();
    this.sprite.src = "BrizzblastLeft.png";
  }

  draw() {
    ctx.drawImage(this.sprite, this.x, this.y, this.size, this.size);
  }

  update() {
    this.handleInput();
  }

  handleInput() {
    if (keys["w"] && this.y > 0) {
      this.y -= this.speed;
      this.lastDirection = "up";
      this.sprite.src = "BrizzblastUp.png";
    }
    if (keys["s"] && this.y < canvas.height - this.size) {
      this.y += this.speed;
      this.lastDirection = "down";
      this.sprite.src = "BrizzblastDown.png";
    }
    if (keys["a"] && this.x > 0) {
      this.x -= this.speed;
      this.lastDirection = "left";
      this.sprite.src = "BrizzblastLeft.png";
    }
    if (keys["d"] && this.x < canvas.width - this.size) {
      this.x += this.speed;
      this.lastDirection = "right";
      this.sprite.src = "BrizzblastRight.png";
    }
  }

  shoot() {
    const projectile = new Projectile(
      this.x + this.size / 2,
      this.y + this.size / 3,
      20,
      5,
      projectileDamage, // Use the projectileDamage variable
      this.lastDirection
    );
    projectiles.push(projectile);
  }
}

class Projectile {
  constructor(x, y, size, speed, health, direction = "left") {
    this.x = x;
    this.y = y;
    this.size = size;
    this.speed = brizz.speed * 1.5;
    this.health = health;
    this.direction = direction; // Add this line
    this.damage = 5; // Add damage property
    this.distanceTraveled = 0; // Add distanceTraveled property and initialize it with 0
    this.sprite = new Image();
    this.sprite.src = "explosion 2019-1.png (1).png";
  }
  draw() {
    ctx.drawImage(this.sprite, this.x, this.y, this.size, this.size);
  }
  update() {
    if (!this.direction) {
      return;
    }

    if (this.direction === "up") this.y -= this.speed;
    if (this.direction === "down") this.y += this.speed;
    if (this.direction === "left") this.x -= this.speed;
    if (this.direction === "right") this.x += this.speed;

    this.distanceTraveled += this.speed;
  }

  handleCollision(poop) {
    return (
      this.x < poop.x + poop.size &&
      this.x + this.size > poop.x &&
      this.y < poop.y + poop.size &&
      this.y + this.size > poop.y
    );
  }
}

class Spikes {
  constructor(x, y, size, speed, health, direction) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.speed = 0;
    this.health = health;
    this.direction = direction;
    this.damage = 20;
    this.distanceTraveled = 0; // Add distanceTraveled property and initialize it with 0
    this.sprite = new Image();
    this.sprite.src = "spikesfromgoogle-1.png.png";
  }
  draw() {
    ctx.drawImage(this.sprite, this.x, this.y, this.size, this.size);
  }
  update() {}

  handleCollision(poop) {
    return (
      this.x < poop.x + poop.size &&
      this.x + this.size > poop.x &&
      this.y < poop.y + poop.size &&
      this.y + this.size > poop.y
    );
  }
}

class Poop {
  constructor(x, y, size, speed, health) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.speed = speed;
    this.health = health;
    this.currentHealth = health;
    this.damage = 5;
    this.sprite = new Image();
    this.sprite.src = "poop.png"; // Add the sprite file path
  }

  draw() {
    ctx.drawImage(this.sprite, this.x, this.y, this.size, this.size); // Use the drawImage method to draw the sprite
  }

  update() {
    const dx = brizz.x - this.x;
    const dy = brizz.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    this.x += (dx / distance) * this.speed;
    this.y += (dy / distance) * this.speed;
  }

  handleCollision(brizz) {
    return (
      this.x < brizz.x + brizz.size &&
      this.x + this.size > brizz.x &&
      this.y < brizz.y + brizz.size &&
      this.y + this.size > brizz.y
    );
  }
}

class Arrow {
  constructor(x, y, speed, damage) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.damage = damage;
    this.width = 30;
    this.height = 10;
    this.direction = 0;
  }

  draw() {
    ctx.fillStyle = "black";
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.direction);
    ctx.fillRect(0, -this.height / 2, this.width, this.height);
    ctx.restore();
  }

  update() {
    this.x += this.speed * Math.cos(this.direction);
    this.y += this.speed * Math.sin(this.direction);
  }

  handleCollision(poop) {
    if (
      this.x < poop.x + poop.size &&
      this.x + this.width > poop.x &&
      this.y < poop.y + poop.size &&
      this.y + this.height > poop.y
    ) {
      // Reduce the health of the poop by the arrow's damage
      poop.currentHealth -= this.damage;

      if (poop.currentHealth <= 0) {
        // Remove the poop from the poops array if its health is 0 or less
        const index = poops.indexOf(poop);
        if (index !== -1) {
          poops.splice(index, 1);
          score++;
          scoreElement.textContent = score;
        }
      }

      // Don't remove the arrow from the arrows array
    }
  }
}

function startGame() {
  // Initialize Brizz
  brizz = new Brizz(canvas.width / 4, canvas.height / 4, 75, 5, 20);

  // Set up intervals for game loop, Poop spawning, and timer
  gameInterval = setInterval(update, 1000 / 60); // 60 FPS
  spawnInterval = setInterval(spawnPoop, 5000); // Spawn Poop every 5 seconds
  timerInterval = setInterval(updateTimer, 1000); // Update timer every second
  shootingInterval = setInterval(() => {
    if (brizz.health > 0) {
      brizz.shoot();
    }
  }, 500); // Shoot every 0.5 seconds

  // Call handleInput directly here
  brizz.handleInput();

  // Add event listener for mouse click
  document.addEventListener("keydown", (event) => {
    if (event.code === "Space" && Date.now() - lastSpikeTime >= 30000) {
      // Space key was pressed and cooldown is over
      const spike = new Spikes(brizz.x, brizz.y, 30, 0, 100, null);
      spikes.push(spike);

      // Set timeout to remove spike after 30 seconds
      setTimeout(() => {
        const index = spikes.indexOf(spike);
        if (index !== -1) {
          spikes.splice(index, 1);
        }
      }, 30000);

      lastSpikeTime = Date.now(); // Update lastSpikeTime
    }
  });

  let lastShotTime = 0; // Initialize lastShotTime variable
  const rect = canvas.getBoundingClientRect();
  canvas.addEventListener("click", (event) => {
    if (event.button === 0 && Date.now() - lastShotTime >= 15000) {
      // Left mouse button was pressed and cooldown is over
      const arrow = new Arrow(brizz.x, brizz.y, 10, 5);
      arrow.direction = Math.atan2(
        event.clientY - rect.top - brizz.y,
        event.clientX - rect.left - brizz.x
      );
      arrows.push(arrow);
      lastShotTime = Date.now(); // Update lastShotTime
    }
  });
}

let arrows = [];

function update() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update and draw Brizz

  brizz.update();
  brizz.draw();

  // Update and draw health bar
  const healthBar = document.getElementById("healthBar");
  const healthBarBorder = document.getElementById("healthBarBorder");
  healthBar.style.width = `${(brizz.health / 20) * 10}%`;
  healthBarBorder.style.width = 18;

  // Update and draw Poops
  poops.forEach((poop, index) => {
    poop.update(brizz);
    poop.draw();

    // Handle Brizz and Poop collisions
    if (poop.handleCollision(brizz)) {
      console.log("collide");
      brizz.health -= poop.damage;
      if (brizz.health <= 0) {
        endGame();
      }
      poops.splice(index, 1);
    }
  });

  // Update and draw projectiles
  projectiles.forEach((projectile, pIndex) => {
    projectile.update();
    projectile.draw();

    // Remove projectiles that traveled 500 pixels
    if (projectile.distanceTraveled >= 500) {
      projectiles.splice(pIndex, 1);
    }

    // Handle projectile and Poop collisions
    poops.forEach((poop, poopIndex) => {
      if (projectile.handleCollision(poop)) {
        poop.currentHealth -= projectile.damage;
        if (poop.currentHealth <= 0) {
          score++;
          scoreElement.textContent = score;
          // Increase the projectileDamage variable by 1%
          projectileDamage *= 1.01;
          poops.splice(poopIndex, 1);
        }
        projectiles.splice(pIndex, 1);
      }
    });
  });
  console.log(Brizz.health);

  // Update and draw arrows
  arrows.forEach((arrow, index) => {
    arrow.update();
    arrow.draw();

    // Remove arrows that go out of canvas
    if (
      arrow.x < 0 ||
      arrow.x > canvas.width ||
      arrow.y < 0 ||
      arrow.y > canvas.height
    ) {
      arrows.splice(index, 1);
    }

    // Handle arrow and Poop collisions
    poops.forEach((poop, poopIndex) => {
      if (arrow.handleCollision(poop)) {
        poop.currentHealth -= arrow.damage;
        if (poop.currentHealth <= 0) {
          score++;
          scoreElement.textContent = score;
          poops.splice(poopIndex, 1);
        }
        arrows.splice(index, 1);
      }
    });
  });

  // Draw and update spikes
  spikes.forEach((spike) => {
    spike.draw();
    spike.update();
  });
  poops.forEach((poop, poopIndex) => {
    spikes.forEach((spike, spikeIndex) => {
      if (spike.handleCollision(poop)) {
        poop.currentHealth -= spike.damage;
        if (poop.currentHealth <= 0) {
          score++;
          scoreElement.textContent = score;
          poops.splice(poopIndex, 1);
        }
        spikes.splice(spikeIndex, 1);
      }
    });
  });
} //^^^^^^^^^^^^^^^^^^^ Draw and update spikes may be in wrong spot

let poopHealth = 10;

function spawnPoop() {
  let x, y;
  do {
    x = Math.random() * (canvas.width - 35);
    y = Math.random() * (canvas.height - 27);
  } while (
    Math.sqrt(Math.pow(x - brizz.x, 2) + Math.pow(y - brizz.y, 2)) < 300
  );

  const poop = new Poop(
    x,
    y,
    30,
    brizz.speed * (1 + (Math.random() - 0.95)),
    poopHealth
  );
  poops.push(poop);
}

function updateTimer() {
  elapsedTime++;
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;
  timerElement.textContent = `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;

  if (elapsedTime === 300) {
    // 5 minutes reached
    endGame();
  }
  if (Brizz.health < 1) {
    endGame();
  }

  if (elapsedTime % 60 === 0) {
    // Every minute
    poops.forEach((poop) => {
      // Generate a random color
      let a = Math.floor(Math.random() * 255);
      let b = Math.floor(Math.random() * 255);
      let c = Math.floor(Math.random() * 255);
      const randomColor = "rgb(" + a + "," + c + "," + b + ")";
      poop.color = randomColor;
      poopHealth *= 1.2;
      console.log(poop.currentHealth + " " + poop.health);
    });
  }
}

function endGame() {
  clearInterval(gameInterval);
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  clearInterval(shootingInterval);

  alert(`Game Over! You scored ${score} points.`);
}

let keys = {};

document.addEventListener("keydown", (event) => {
  keys[event.key] = true;
});

document.addEventListener("keyup", (event) => {
  keys[event.key] = false;
});

startGame();
