function radToDeg(r) {
  return r * 180 / Math.PI;
}

function degToRad(d) {
  return d * Math.PI / 180;
}

function randomInt(upper) {
  return Math.floor(Math.random() * upper);
}

function randomDecimal() {
  return Math.random();
}

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

/**
 * Creates a program from 2 script tags.
 *
 * @param {WebGLRenderingContext} gl The WebGLRenderingContext
 *        to use.
 * @param {string} vertId Id of the script
 *        tags for the vertex shaders.
 * @param {string} fragId Id of the script
 *        tags for the frage shaders.
 * @param {module:webgl-utils.ErrorCallback} opt_errorCallback callback for errors. By default it just prints an error to the console
 *        on error. If you want something else pass an callback. It's passed an error message.
 * @return {WebGLProgram} The created program.
 * @memberOf module:webgl-utils
 */
function createProgramFromScripts(gl, vertId, fragId) {
  const vertCode = document.getElementById(vertId).textContent;
  const vertShader = loadShader(gl, vertCode, gl.VERTEX_SHADER);

  const fragCode = document.getElementById(fragId).textContent;
  const fragShader = loadShader(gl, fragCode, gl.FRAGMENT_SHADER);

  return createProgram(gl, [vertShader, fragShader]);
}


/**
 * Loads a shader.
 * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
 * @param {string} shaderSource The shader source.
 * @param {number} shaderType The type of shader.
 * @param {module:webgl-utils.ErrorCallback} opt_errorCallback callback for errors.
 * @return {WebGLShader} The created shader.
 */
function loadShader(gl, shaderSource, shaderType, opt_errorCallback) {
  var errFn = opt_errorCallback || error;
  // Create the shader object
  var shader = gl.createShader(shaderType);

  // Load the shader source
  gl.shaderSource(shader, shaderSource);

  // Compile the shader
  gl.compileShader(shader);

  // Check the compile status
  var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!compiled) {
    // Something went wrong during compilation; get the error
    var lastError = gl.getShaderInfoLog(shader);
    errFn("*** Error compiling shader '" + shader + "':" + lastError);
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

/**
* Creates a program, attaches shaders, binds attrib locations, links the
* program and calls useProgram.
* @param {WebGLShader[]} shaders The shaders to attach
* @param {string[]} [opt_attribs] An array of attribs names. Locations will be assigned by index if not passed in
* @param {number[]} [opt_locations] The locations for the. A parallel array to opt_attribs letting you assign locations.
* @param {module:webgl-utils.ErrorCallback} opt_errorCallback callback for errors. By default it just prints an error to the console
*        on error. If you want something else pass an callback. It's passed an error message.
* @memberOf module:webgl-utils
*/
function createProgram(
  gl, shaders, opt_errorCallback) {
  var errFn = opt_errorCallback || error;
  var program = gl.createProgram();
  shaders.forEach(function (shader) {
    gl.attachShader(program, shader);
  });
  gl.linkProgram(program);

  // Check the link status
  var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {
    // something went wrong with the link
    var lastError = gl.getProgramInfoLog(program);
    errFn("Error in program linking:" + lastError);

    gl.deleteProgram(program);
    return null;
  }
  return program;
}

/**
 * Wrapped logging function.
 * @param {string} msg The message to log.
 */
function error(msg) {
  if (window.console) {
    if (window.console.error) {
      window.console.error(msg);
    } else if (window.console.log) {
      window.console.log(msg);
    }
  }
}

