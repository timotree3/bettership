/*jshint esversion: 6 */

const grid_length = 10;
const ship_list = [5, 4, 3, 3, 2];
const difficulty = "medium";

function Player(name, button_prefix, ai_difficulty = null) {
        this.name = name;
        this.button_prefix = button_prefix;
        this.ai_difficulty = ai_difficulty;
        this.grid = new Grid(grid_length);
        this.place_queue = ship_list;

        if (ai_difficulty !== null) {
                this.interests = {
                        "-1": [],
                        "1": [],
                        "2": []
                };
                this.best = function() {
                        if (this.interests[2].length != 0) {
                                return this.interests[2].splice(0, 1)[0];
                        }
                        if (this.interests[1].length != 0) {
                                return this.interests[1].splice(0, 1)[0];
                        }
                        let coords = random_coords();
                        while (this.ai_difficulty === "hard" && this.interests[-1].indexOf(coords) > -1) {
                                coords = random_coords();
                        }
                        return coords;
                };
        }

        this.render = function(hide = this.ai_difficulty !== null) {
                for (let i in this.grid.changes) {
                        let coords = this.grid.changes[i];
                        let new_cell = this.grid.get_cell(coords);
                        // Give it the proper color
                        let status = new_cell.attacked ? "attacked" : "untouched";
                        let contents;
                        if (hide && status === "untouched") {
                                contents = "water";
                        } else {
                                contents = new_cell.hasOwnProperty("ship") ? "ship" : "water";
                        }
                        this.button_element(coords).style.backgroundColor = "var(--" + status + "-" + contents + ")";
                }
                this.grid.changes = [];
                for (let i in this.grid.sunks) {
                        let length = this.grid.sunks[i];
                        alert("The " + ship_name(length) + " owned by " + this.name + " is gone!");
                }
                this.grid.sunks = [];
        };

        this.button_element = function(coords) {
                return document.getElementById(this.button_prefix + "(" + coords.x + "," + coords.y + ")");
        };
}

function Grid(size) {
        this.size = size;
        this.changes = [];
        this.sunks = [];
        this.grid = [];
        this.attacks = [];
        this.ships = {};

        this.coords_ok = coords => coords.x >= 0 && coords.x < this.size && coords.y >= 0 && coords.y < this.size;

        this.can_place = coords => this.coords_ok(coords) && !this.get_cell(coords).hasOwnProperty("ship");

        this.vector_can_place = vector => Array.from(vector.coords()).every(this.can_place, this);

        this.vector_place = function(vector) {
                Array.from(vector.coords()).forEach(function(coords, distance) {
                        this.set_cell(coords, {
                                "attacked": false,
                                "ship": {
                                        "direction": vector.direction,
                                        "distance": distance
                                }
                        });
                        this.ships[serialize(vector.start)] = {
                                "remaining": vector.magnitude,
                                "size": vector.magnitude
                        };
                }, this);
        };

        this.get_cell = function(coords) {
                // create the row if needed
                if (!this.grid.hasOwnProperty(coords.x)) {
                        this.grid[coords.x] = [];
                }
                // create the cell if needed
                if (!this.grid[coords.x].hasOwnProperty(coords.y)) {
                        this.grid[coords.x][coords.y] = {
                                "attacked": false
                        };
                }
                return this.grid[coords.x][coords.y];
        };

        this.set_cell = function(coords, new_object) {
                // create the row if needed
                if (!this.grid.hasOwnProperty(coords.x)) {
                        this.grid[coords.x] = [];
                }
                this.grid[coords.x][coords.y] = new_object;
                // mark it as being changed so it can be recolored
                this.changes.push(coords);
        };

        this.can_attack = coords => this.coords_ok(coords) && !this.get_cell(coords).attacked;
        // Must be in bounds && Can't attack the same spot twice

        this.attack = function(coords) {
                this.sunk = 0;
                let cell = this.get_cell(coords);
                cell.attacked = true;
                this.set_cell(coords, cell);
                this.attacks.push(coords);
                if (cell.hasOwnProperty("ship")) {
                        let start = travel(coords, invert(cell.ship.direction), cell.ship.distance);
                        let serialized = serialize(start);
                        this.ships[serialized].remaining--;
                        if (this.ships[serialized].remaining == 0) {
                                this.sunks.push(this.ships[serialized].size);
                                delete this.ships[serialized];
                        }
                }
        };

        this.lost = () => Object.keys(this.ships).length == 0;
}

function Vector(start, direction, magnitude, skip = 0) {
        this.skip = skip;
        this.start = start;
        this.direction = direction;
        this.magnitude = magnitude;

        this.coords = function*() {
                for (let shifts = this.skip; shifts < this.magnitude; shifts++) {
                        yield travel(this.start, this.direction, shifts);
                }
        };
}

function Scanner(start, distance) {
        this.start = start;
        this.magnitude = distance + 1;

        this.coords = function*() {
                yield* new Vector(this.start, "up", this.magnitude, 1).coords();
                yield* new Vector(this.start, "left", this.magnitude, 1).coords();
                yield* new Vector(this.start, "right", this.magnitude, 1).coords();
                yield* new Vector(this.start, "down", this.magnitude, 1).coords();
        };
}

function travel(coords, direction, distance) {
        switch (direction) {
                case "up":
                        return {
                                "x": coords.x,
                                "y": coords.y - distance
                        };
                case "left":
                        return {
                                "x": coords.x - distance,
                                "y": coords.y
                        };
                case "right":
                        return {
                                "x": coords.x + distance,
                                "y": coords.y
                        };
                case "down":
                        return {
                                "x": coords.x,
                                "y": coords.y + distance
                        };
        }
}

function invert(direction) {
        switch (direction) {
                case "up":
                        return "down";
                case "left":
                        return "right";
                case "right":
                        return "left";
                case "down":
                        return "up";
        }
}

function serialize(coords) {
        return coords.y * grid_length + coords.x;
}

function deserialize(serialized) {
        return {
                "x": serialized % grid_length,
                "y": Math.floor(serialized / grid_length)
        };
}

function ship_name(ship_length) {
        switch (ship_length) {
                case 1:
                        return "sailboat";
                case 2:
                        return "partol boat";
                case 3:
                        return "submarine";
                case 4:
                        return "battleship";
                case 5:
                        return "aircraft carrier";
                default:
                        return "*REDACTED*";
        }
}

var winner = null;
var user = new Player("you", "click_mine");
var bot = new Player("the bot", "click_bots", difficulty);
// {"attacked": bool, "ship": {"direction": "up"|"left"|"right"|"down", "distance": uint}}

window.onload = function() {
        bot_place_all();
        refresh_stage();
};

function click_mine(x, y) {
        // player is trying to place
        if (user.place_queue.length === 0) {
                return;
                // placing is done
        }

        let direction = read_dpad();
        if (direction === null) {
                return;
        }
        vector = new Vector({
                "x": x,
                "y": y
        }, direction, user.place_queue[0]);
        if (!user.grid.vector_can_place(vector)) {
                return;
        }
        user.place_queue.splice(0, 1);
        user.grid.vector_place(vector);
        // update color coding after making changes
        user.render();
        refresh_stage();
}

function click_bots(x, y) {
        // player is trying to attack
        if (user.place_queue.length > 0 || winner !== null) {
                return;
        }

        let coords = {
                "x": x,
                "y": y
        };

        if (!bot.grid.can_attack(coords)) {
                return;
        }

        bot.grid.attack(coords);

        // finish up the turn
        if (bot.grid.lost()) {
                winner = user;
        }
        bot.render();
        // update color coding after making changes
        refresh_stage();
        bot_turn();
}

function read_dpad() {
        let checked = document.querySelector('input[name = "direction"]:checked');
        return checked === null ? null : checked.value;
}

function random_coords(bound = grid_length) {
        return {
                "x": Math.floor(Math.random() * bound),
                "y": Math.floor(Math.random() * bound)
        };
}

function random_vector(magnitude) {
        return new Vector(random_coords(), ["up", "left", "right", "down"][Math.floor(Math.random() * 4)], magnitude);
}

function bot_place(magnitude) {
        let vector = random_vector(magnitude);
        while (!bot.grid.vector_can_place(vector)) {
                vector = random_vector(magnitude);
        }
        bot.grid.vector_place(vector);
}

function bot_place_all() {
        for (let i in bot.place_queue) {
                bot_place(bot.place_queue[i]);
        }
        bot.place_queue = [];
}

function bot_turn() {
        bot_attack();
        if (user.grid.lost()) {
                winner = bot;
                show_ships(bot);
        }

        user.render();
        // update color coding after making changes
        refresh_stage();
}

function bot_attack() {
        let move;
        if (difficulty == "easy") {
                move = random_coords;
        } else {
                move = bot.best.bind(bot);
        }
        let coords = move();
        while (!user.grid.can_attack(coords)) {
                coords = move();
        }
        user.grid.attack(coords);
        if (difficulty != "easy") {
                if (user.grid.get_cell(coords).hasOwnProperty("ship")) {
                        for (let adjacents of new Scanner(coords, 1).coords()) {
                                bot.interests[1].push(adjacents);
                        }
                }
        }
}

function show_ships(player) {
        for (let serialized in player.grid.ships) {
                let ship = player.grid.ships[serialized];
                let coords = deserialize(serialized);
                let direction = player.grid.get_cell(coords).ship.direction;
                let vector = new Vector(coords, direction, ship.size);
                player.grid.changes = player.grid.changes.concat(Array.from(vector.coords()));
        }
        player.render(false);
}

function refresh_stage() {
        let header;
        if (user.place_queue.length > 0) {
                header = "Place your ships!";
                document.getElementById("dpad").style.display = null;
                // reset to default
        } else if (winner === null) {
                header = "Attack the enemy!";
                document.getElementById("dpad").style.display = "none";
        } else if (winner === user) {
                header = "Congratulations! You won!";
        } else if (winner === bot) {
                header = "Congratulations, AI! You won!";
        }
        document.getElementById("stage_header").innerHTML = header;
}
