# Introduction

OpenGL is a cross-language, cross-platform API for 2D and 3D graphics.

|**API**|**Technology Used**|
|-|-|
|OpenGL ES|It is the library for 2D and 3D graphics on embedded systems - including consoles, phones, appliances, and vehicles. OpenGL ES 3.1 is its latest version. It is maintained by the Khronos Group [www.khronos.org](https://www.khronos.org/)|
|JOGL|It is the Java binding for OpenGL. JOGL 4.5 is its latest version and it is maintained by [jogamp.org](https://jogamp.org/).|
|WebGL|It is the JavaScript binding for OpenGL. It is maintained by the [khronos group](https://www.khronos.org/).|
|OpenGLSL|OpenGL Shading Language. It is a programming language which is a companion to OpenGL 2.0 and higher. It is a part of the core OpenGL 4.4 specification. It is an API specifically tailored for embedded systems such as those present on mobile phones and tablets.|

> **Note**: In WebGL, we use GLSL to write shaders.

WebGL (Web Graphics Library) is the new standard for 3D graphics on the Web, It is designed for the purpose of rendering 2D graphics and interactive 3D graphics. It is derived from OpenGL's ES 2.0 library which is a low-level 3D API for phones and other mobile devices. WebGL provides similar functionality of ES 2.0 (Embedded Systems) and performs well on modern 3D graphics hardware.

It is a JavaScript API that can be used with HTML5. WebGL code is written within the `<canvas>` tag of HTML5. It is a specification that allows Internet browsers access to Graphic Processing Units (GPUs) on those computers where they were used.

# Rendering

Rendering is the process of generating an image from a model using computer programs. In graphics, a virtual scene is described using information like geometry, viewpoint, texture, lighting, and shading, which is passed through a render program. The output of this render program will be a digital image.

There are two types of rendering:

- **Software Rendering**: All the rendering calculations are done with the help of CPU.

- **Hardware Rendering**: All the graphics computations are done by the GPU.

Rendering con be done locally or remotely. If the image to be rendered is way too complex, then rendering is done remotely on a dedicated server having enough of hardware resources required to render complex scenes. It is also called as **server-based rendering**. Rendering can also be done locally by the GPU. It is called as **client-based rendering**.

WebGL follows a client-based rendering approach to render 3D scenes. All the processing required to obtain an image is performed locally using the client's graphics hardware.

# WebGL Context in Canvas

```html
<!DOCTYPE html>
<html>
   <canvas id = 'my_canvas'></canvas>
	
   <script>
      var canvas = document.getElementById('my_canvas');
      var gl = canvas.getContext('experimental-webgl');
      gl.clearColor(0.9,0.9,0.8,1);
      gl.clear(gl.COLOR_BUFFER_BIT);
   </script>
</html>

```

























