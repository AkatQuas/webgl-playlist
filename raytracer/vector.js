/**
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
function Vector3(x, y, z) {
  if (!(this instanceof Vector3)) {
    return new Vector3(x, y, z);
  }
  this.x = x;
  this.y = y;
  this.z = z;
}

Vector3.prototype.scale = function (scalar) {
  return new Vector3(
    this.x * scalar,
    this.y * scalar,
    this.z * scalar
  );
}

Vector3.prototype.plus = function (other) {
  return new Vector3(
    this.x + other.x,
    this.y + other.y,
    this.z + other.z
  );
}

Vector3.prototype.minus = function (other) {
  return new Vector3(
    this.x - other.x,
    this.y - other.y,
    this.z - other.z
  );
}

Vector3.prototype.dot = function (other) {
  return (
    this.x * other.x +
    this.y * other.y + 
    this.z * other.z
  );
}

Vector3.prototype.normalized = function () {
  const mag = Math.sqrt(this.dot(this));
  return mag === 0
    ? this
    : new Vector3(
        this.x / mag,
        this.y / mag,
        this.z / mag
      );
}

Vector3.lerp = function (start, end, t) {
  return start.scale(1-t).plus(end.scale(t));
}

/**
 * 
 * @param {Vector3} origin
 * @param {Vector3} direction
 */
function Ray (origin, direction){
  if (!(this instanceof Ray)) {
    return new Ray(origin, direction);
  }
  this.origin = origin;
  this.direction = direction;
}

Ray.prototype.at = function (t) {
  return this.origin.plus(this.direction.scale(t));
}

