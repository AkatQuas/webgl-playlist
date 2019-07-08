# A simple webgl tutorial

A WebGL tutorial from [**tutorialspoint**](https://www.tutorialspoint.com/webgl/index.htm).

More tutorials or documents can be found at [MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Getting_started_with_WebGL).

# What I Have learned ?

Unless you want to develop on WebGL, you'd better never write the `webgl code` yourself. Using library instead!

# Contents

- [Introduction](docs/introduction.md)

- [Basic](docs/basics.md)

- [Application](docs/application.md)

- [Quick Guides](https://www.tutorialspoint.com/webgl/webgl_quick_guide.htm)

- [Draw an image in webgl](https://webglfundamentals.org/webgl/lessons/webgl-image-processing.html): `gl.createTexture();`.

- FrameBuffer:  In WebGL and OpenGL, a Framebuffer is actually a poor name. A WebGL/OpenGL Framebuffer is really just a collection of state (a list of attachments) and not actually a buffer of any kind.

- [WebGL official site](https://www.khronos.org/webgl/)

# Examples

- [webgl boilerplates](https://webglfundamentals.org/webgl/lessons/webgl-boilerplate.html): A bunch of codes for writing your webgl faster.

- [test](examples/play-a-test.html)

- [point](examples/point.html)

    ![](images/example-point.png)

- [triangle](examples/triangle.html)

    ![](images/example-triangle.png)

- [triangle with gradient color](examples/triangle-gradient.html)

- [circle](examples/circle.html)

    ![](images/example-circle.png)

- [ring](examples/ring.html): Be careful when you drawing a triangle, the draw direction matters. [reference](https://webglfundamentals.org/webgl/lessons/webgl-3d-orthographic.html)

    ![](images/example-ring.png)

- [parallel lines](examples/parallel-lines.html)

    ![](images/example-parallel-lines.png)

- [quad](examples/quad.html)

    ![](images/example-quad.png)

- [colors](examples/colors.html)

    ![](images/example-colors.png)

- [f-colorful-3d](examples/f-colorful-3d.html)

    ![](images/example-f-colorful.png)

- [f-letter-3d](examples/f-letter-3d.html)

    ![](images/example-f-letter.png)

- [translation](examples/translation.html)

    ![](images/example-translation.png)

- [scaling](examples/scaling.html)

    ![](images/example-scaling.png)

- [rotation](examples/rotation.html)

- [perspective](examples/perspective.html): The _camera_ is moving!

    ![](images/example-perspective.png)

- [FOV: field of view](examples/field-of-view.html): The _camera_ is moving!

- [cube rotation](examples/cube-rotation.html)

- [interactive cube](examples/interactive-cube.html)

- [cube with image texture](examples/texture-cube.html): Derived from this [MDN detailed document](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL)

    ![](images/example-texture-cube.png)

- [Square with image, transparency](examples/texture-square.html).

    ![](images/example-texture-square.png)

## Get ActiveInfo in program

This will collect all the variable used in shader program.

```js
function checkActiveInfo(gl, program) {
  console.group('ActiveInfo in program');
  {
    const count = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    console.log(count);
    for (let i = 0; i < count; i++) {
      let attribute = gl.getActiveAttrib(program, i);
      console.log(attribute);
    }
  }
  {
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    console.log(count);
    for (let i = 0; i < count; i++) {
      let attribute = gl.getActiveUniform(program, i);
      console.log(attribute);
    }
  }
  console.groupEnd();
}
```

## Understanding Matrix

**[Matrix math for web](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Matrix_math_for_the_web)**: Matrix can be not only used in `webgl`, but also in `style.transform`.

The order of matrix multiplication matters, and the elements in arrays in not the same row-column order in math. [Here is an article](https://webglfundamentals.org/webgl/lessons/webgl-matrix-vs-math.html).

So, the way WebGL, and OpenGL ES on which WebGL is based, gets around this is it calls rows "columns".

```js
const some4x4TranslationMatrix = [
   1,  0,  0,  0,   // this is column 0
   0,  1,  0,  0,   // this is column 1
   0,  0,  1,  0,   // this is column 2
  tx, ty, tz,  1,   // this is column 3
];

/*
the above matrix matches the real math

  x-axis, y-axis, z-axis, w
| 1,      0,      0,      tx |
| 0,      1,      0,      ty |
| 0,      0,      1,      tz |
| 0,      0,      0,      1  |

*/

const positon = [
    1.0, 0.2, 0.3
];

/*

| 1.0 | -> x-axis
| 0.2 | -> y-axis
| 0.3 | -> z-axis

*/

```

## Camera


## Texture

To activate the transparency in PNG image, in fragment shader code, using

```glsl

void main() {
    gl_FragColor = vec4(1.0, 1.0, 0.0, 0.6);
    // ...
    if (gl_FragColor.a < 0.5) discard;
}
```
