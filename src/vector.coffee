class Vector
    constructor: (@x, @y) ->

    rotate: (_degree) ->
        radian = _degree * Math.PI / 180
        cos = Math.cos radian
        sin = Math.sin radian
        x = this.x * cos - this.y * sin
        y = this.x * sin + this.y * cos
        new Vector x, y

    dotProduct: (_otherVector) ->
        @x * _otherVector.x + @y * _otherVector.y;

module.exports = Vector