function Color(r, g, b) {
  if (!(this instanceof Color)) {
    return new Color(r, g, b);
  }
  this.r = r;
  this.g = g;
  this.b = b;
}

Color.prototype.times = function (other) {
  return new Color(
    this.r * other.r,
    this.g * other.g,
    this.b * other.b
  );
}

Color.prototype.scale = function (scalar) {
  return new Color(
    this.r * scalar,
    this.g * scalar,
    this.b * scalar
  );
}

Color.prototype.addInPlace = function (other) {
  this.r += other.r;
  this.g += other.g;
  this.b += other.b;
}

Color.prototype.clampInPlace = function () {
  const { r, g ,b } = this;
  this.r = r < 0 ? 0 : ( r > 1 ? 1 : r );
  this.g = g < 0 ? 0 : ( g > 1 ? 1 : g );
  this.b = b < 0 ? 0 : ( b > 1 ? 1 : b );
}

