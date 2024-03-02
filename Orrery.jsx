/* the orrery will be represented as an object with 2 properties for each celestial body.
The properties will be
- The body's position, represented as a number (the angle of the body's widdershins edge, where 0 is 12 'o clock)
- The body's span, represented as a number (the angle between the body's widdershins and clockwise edge
The sun will be treated as a planet with a span of 30 degrees
*/

class Planet {
/*
Planets (including the sun) have two properties:
- Span, a number representing what arc they take up on the orrery (in degrees)
- Position, a number representing the angle of the body's widdershins edge in degrees.
*/
    constructor(span, start) {
        this.span = span;
        this._position = start;
    }

    advance(clockwise) {
        if (clockwise) {
            this.position = +this.position + this.span
        } else {
            this.position = +this.position - this.span
        }
    }

    set position(new_pos) {
        this._position = new_pos % 360;
    }

    get position() {
        return this._position;
    }
}

const bodies_list = ["sun", "sat", "jup", "mar", "ven", "mer"]; // all celestial bodies
const planet_list = ["sat", "jup", "mar", "ven", "mer"]; // moveable celestial bodies

const Orrery = {
    sun : new Planet(360 / 12, 330),
    sat : new Planet(360 / 36, (360 / 36) * 3.5),
    jup : new Planet((360 / 48) * 3, (360 / 24) * 10),
    mar : new Planet((360 / 24) * 3, (360 / 24) * 6),
    ven : new Planet((360 / 24) * 5, (360 / 24) * 8),
    mer : new Planet((360 / 24) * 7, (360 / 4) * 3),

    movePlanet : function (planet_name, dir) {
        if (bodies_list.includes(planet_name)) {
            console.log(this[planet_name]);
            this[planet_name].advance(dir);
            console.log(this[planet_name]);
        } else {
            throw new RangeError(`${planet_name} is not a valid planet!`);
        }
    }
}
