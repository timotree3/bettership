/*jshint esversion: 6*/

const up = 0,
        left = 1,
        right = 2,
        down = 3;

function Coords(x, y) {
        this.x = x;
        this.y = y;

        this.travel = function(direction, distance) {
                switch (direction) {
                        case up:
                                return new Coords(this.x, this.y - distance);
                        case left:
                                return new Coords(this.x - distance, this.y);
                        case right:
                                return new Coords(this.x + distance, this.y);
                        case down:
                                return new Coords(this.x, this.y + distance);
                }
        };

        this.toString = function() {
                return [this.x, this.y].toString();
        };
}

function Cell(ship, attacked = false) {
        this.attacked = attacked;
        this.ship = ship;

        this.is_ship = function() {
                return this.ship !== undefined;
        };

        this.is_attacked = function() {
                return this.attacked;
        };

        this.place = function(ship) {
                this.ship = ship;
        };

        this.attack = function() {
                this.attacked = true;
        };
}

function Vector(start, direction, magnitude) {
        this.start = start;
        this.direction = direction;
        this.magnitude = magnitude;

        this.coords = function*(skip = 0) {
                for (let shifts = 0; shifts < magnitude; shifts++) {
                        yield this.start.travel(this.direction, shifts);
                }
        };
}

Vue.component('grid', {
        props: {
                owner: {
                        type: String,
                        default: "Grid",
                },
        },
        template: `\
<div class="grid_div">
        <div v-for="(row, y) of grid" class="grid_row">
                <div v-for="(cell, x) of row" class="square">
                        <cell @clicked="click(x,y)" :cell="cell"></cell>
                </div>
        </div>
</div>`,
        data: function() {
                let grid = [];
                for (let y = 0; y < 10; y++) {
                        grid[y] = [];
                        for (let x = 0; x < 10; x++) {
                                grid[y][x] = new Cell();
                        }
                }
                return {
                        grid: grid,
                        place_queue: [5,4,3,3,2],
                };
        },
        methods: {
                click: function(x, y) {
                        let coords = new Coords(x, y);
                        console.log(`click(${coords.toString()})`);
                        this.place(coords, down);
                },
                place: function(start, direction) {
                        let magnitude = this.place_queue[0];
                        this.place_queue.splice(0, 1);
                        this._place(new Vector(start, direction, magnitude));
                },
                _place: function(vector) {
                        for (let spot of vector.coords()) {
                                this.get(spot).place({
                                        "thisisaship": false
                                });
                        }
                },
                get: function(coords) {
                        return this.grid[coords.y][coords.x];
                }
        },
        components: {
                'cell': {
                        props: {
                                cell: {
                                        type: Cell,
                                        required: true,
                                },
                        },
                        template: `\
<div :class="[status, content]" @click="click()""></div>`,
                        methods: {
                                click: function() {
                                        this.$emit('clicked');
                                },
                        },
                        computed: {
                                status: function() {
                                        return this.cell.attacked ? "attacked" : "untouched";
                                },
                                content: function() {
                                        return this.cell.is_ship() ? "ship" : "water";
                                }
                        }
                },
        },
});

var vm = new Vue({
        el: '.parent',
});
