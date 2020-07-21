function Sphere(center, radius, material) {
  if (!(this instanceof Sphere)) {
    return new Sphere(center, radius, material);
  }
  this.center = center;
  this.radius = radius;
  this.material = material;
}

Sphere.prototype.getIntersection = function (ray) {
  const { origin, direction } = ray;
  const cp = origin.minus(this.center);

  const a = direction.dot(direction);
  const b = 2 * cp.dot(direction);
  const c = cp.dot(cp) - this.radius * this.radius;

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) {
    // no intersection
    return null;
  }

  const sqrt = Math.sqrt(discriminant);
  const ts = [];

  const sub = (-b - sqrt) / (2 * a);
  if (sub >= 0) {
    ts.push(sub);
  }

  const add = (-b + sqrt) / (2 * a);
  if (add >= 0) {
    ts.push(add);
  }

  return ts.length === 0 ? null : Math.min.apply(null, ts);
};

Sphere.prototype.normalAt = function (point) {
  return point.minus(this.center).normalized();
}
