const MAX_BOUNCES = 3;
const NUM_SAMPLES_PER_DIRECTION = 2;
const NUM_SAMPLES_PER_PIXEL = NUM_SAMPLES_PER_DIRECTION * NUM_SAMPLES_PER_DIRECTION;
const USE_SSAA = true;
// const USE_SSAA = false;

function imageColorFromColor (color) {
  return {
    r: Math.floor(color.r * 255),
    g: Math.floor(color.g * 255),
    b: Math.floor(color.b * 255),
  };
}

function minimum(xs, fn) {
  if (xs.length === 0) {
    return null;
  }

  let minValue = Infinity;
  let minElement = null;
  for (let x of xs) {
    const value = fn(x);
    if (value < minValue) {
      minValue = value;
      minElement = x;
    }
  }
  return minElement;
}

function RayTracer(scene, w, h) {
  if (!(this instanceof RayTracer)) {
    return new RayTracer(scene, w, h);
  }

  this.scene = scene;
  this.w = w;
  this.h = h;
}

RayTracer.prototype.tracedColorAtPixel = function (x, y) {
  if (USE_SSAA) {
    /**
     * not using SuperSampling AntiAliasing
     */
    const color = new Color(0, 0, 0);

    for (let dx = 0; dx < NUM_SAMPLES_PER_DIRECTION; dx += 1) {
      for (let dy = 0; dy < NUM_SAMPLES_PER_DIRECTION; dy += 1) {
        const ray = this._rayForPixel(
          x + dx / NUM_SAMPLES_PER_DIRECTION,
          y + dy / NUM_SAMPLES_PER_DIRECTION
        );
        const sample = this._tracedColorForRay(ray, MAX_BOUNCES);
        // weight of the super-pixels
        color.addInPlace(sample.scale(1 / NUM_SAMPLES_PER_PIXEL));
      }
    }

    return color;
  } else {
    /**
     * not using SuperSampling AntiAliasing
     */
    const ray = this._rayForPixel(x, y);
    return this._tracedColorForRay(ray, MAX_BOUNCES);
  }
}

RayTracer.prototype._tracedColorForRay = function (ray, depth) {
  const objects = this.scene.objects
    .map(obj => {
      const t = obj.getIntersection(ray);
      if (!t) { return null; }

      const point = ray.at(t);
      return {
        object: obj,
        t,
        point,
        normal: obj.normalAt(point),
      };
    }).filter(Boolean);
  const intersection = minimum(
    objects,
    inter => inter.t
  );

  if (!intersection) {
    return new Color(0, 0, 0);
  }

  const color = this._colorAtIntersection(intersection);
  if (depth > 0) {
    const v = ray.direction.scale(-1).normalized();
    const r = intersection
      .normal
      .scale(2)
      .scale(intersection.normal.dot(v))
      .minus(v);

    const reflectionRay = new Ray(
      intersection.point.plus(intersection.normal.scale(0.01)),
      r
    );
    const reflected = this._tracedColorForRay(reflectionRay, depth - 1);
    color.addInPlace(reflected.times(intersection.object.material.kr));
  }
  return color;
}

RayTracer.prototype._colorAtIntersection = function (intersection) {
  const color = new Color(0, 0, 0);
  const material = intersection.object.material;

  const v = this.scene
    .camera
    .minus(intersection.point)
    .normalized();

  this.scene
    .lights
    .forEach(light => {
      const l = light
        .position
        .minus(intersection.point)
        .normalized();

      const lightInNormalDirection = intersection.normal.dot(l);
      // light does not shine on these part
      if (lightInNormalDirection < 0) {
        return;
      }

      // check the shadow condition
      const isShadowed = this._isPointInShadowFromLight(
        intersection.point,
        intersection.object,
        light
      );
      if (isShadowed) {
        return;
      }

      const diffuse = material
        .kd
        .times(light.id)
        .scale(lightInNormalDirection);
      color.addInPlace(diffuse);

      const r = intersection
        .normal
        .scale(2)
        .scale(lightInNormalDirection)
        .minus(l);

      const amountReflectedAtViewer = v.dot(r);
      const specular = material
        .ks
        .times(light.is)
        .scale(Math.pow(amountReflectedAtViewer, material.alpha));
      color.addInPlace(specular);
    });

  const ambient = material
    .ka
    .times(this.scene.ia);

  color.addInPlace(ambient);

  color.clampInPlace();

  return color;
}

RayTracer.prototype._isPointInShadowFromLight = function (point, objectToExclude, light) {
  const shadowRay = new Ray(
    point,
    light.position.minus(point)
  );

  for (let i in this.scene.objects) {
    const obj = this.scene.objects[i];
    if (obj === objectToExclude) {
      continue;
    }

    const t = obj.getIntersection(shadowRay);
    if (t && t <=1) {
      return true;
    }
  }
  return false;
}

RayTracer.prototype._rayForPixel = function (x, y) {
  const { w, h, scene } = this;
  const { camera, imagePlane } = scene;
  const xt = x / w;
  const yt = (h - y - 1) / h;

  const top = Vector3.lerp(
    imagePlane.topLeft,
    imagePlane.topRight,
    xt
  );

  const bottom = Vector3.lerp(
    imagePlane.bottomLeft,
    imagePlane.bottomRight,
    xt
  );

  const point = Vector3.lerp(
    bottom,
    top,
    yt
  );

  return new Ray(
    point,
    point.minus(camera)
  );
}

function main() {
  const WIDTH = 256;
  const HEIGHT = 192;
  const SCENE = {
    camera: new Vector3(0, 0, 2),
    imagePlane: {
      topLeft: new Vector3(-1.28, 0.86, -0.5),
      topRight: new Vector3(1.28, 0.86, -0.5),
      bottomLeft: new Vector3(-1.28, -0.86, -0.5),
      bottomRight: new Vector3(1.28, -0.86, -0.5),
    },
    ia: new Color(0.5, 0.5, 0.5),
    lights: [
      {
        position: new Vector3(-3, -0.5, 1),
        id: new Color(0.8, 0.3, 0.3),
        is: new Color(0.8, 0.8, 0.8),
      },
      {
        position: new Vector3(3, 2, 1),
        id: new Color(0.4, 0.4, 0.9),
        is: new Color(0.8, 0.8, 0.8),
      },
    ],
    objects: [
      new Sphere(
        new Vector3(-1.1, 0.6, -1),
        0.2,
        {
          ka: new Color(0.1, 0.1, 0.1), // ambient light portion
          kd: new Color(0.5, 0.5, 0.9), // diffuse light portion
          ks: new Color(0.7, 0.7, 0.7), // surface light portion
          kr: new Color(0.1, 0.1, 0.2), // refraction light portion
          alpha: 20,
        },
      ),
      new Sphere(
        new Vector3(0.2, -0.1, -1),
        0.5,
        {
          ka: new Color(0.1, 0.1, 0.1),
          kd: new Color(0.9, 0.5, 0.5),
          ks: new Color(0.7, 0.7, 0.7),
          kr: new Color(0.2, 0.1, 0.1),
          alpha: 20,
        }
      ),
      new Sphere(
        new Vector3(1.2, -0.5, -1.75),
        0.4,
        {
          ka: new Color(0.1, 0.1, 0.1),
          kd: new Color(0.5, 0.9, 0.5),
          ks: new Color(0.7, 0.7, 0.7),
          kr: new Color(0.8, 0.9, 0.8),
          alpha: 20,
        }
      ),
    ],
  };
  const image = new MyImage(WIDTH, HEIGHT);
  const tracer = new RayTracer(SCENE, WIDTH, HEIGHT);

  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      image.putPixel(
        x,
        y,
        imageColorFromColor(tracer.tracedColorAtPixel(x,y))
      );
    }
  }

  image.renderInto(document.querySelector('body'));
}

