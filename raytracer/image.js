function MyImage(w, h) {
  if (!(this instanceof MyImage)) {
    return new MyImage(w,h)
  }

  this.w = w;
  this.h = h;
  this.canvas = this._createCanvas();
}

MyImage.prototype._createCanvas = function () {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('width', this.w);
  canvas.setAttribute('height', this.h);

  const context = canvas.getContext('2d');
  const imageData = context.getImageData(0, 0, this.w, this.h);
  const pixels = imageData.data;

  return {
    canvas,
    context,
    imageData,
    pixels,
  };
}

MyImage.prototype.putPixel = function (x, y, color) {
  const offset = ( y * this.w + x ) * 4;
  this.canvas.pixels[offset] = color.r | 0;
  this.canvas.pixels[offset + 1] = color.g | 0;
  this.canvas.pixels[offset + 2] = color.b | 0;
  this.canvas.pixels[offset + 3] = 255;
}

MyImage.prototype.renderInto = function (elem) {
  this.canvas.context.putImageData(this.canvas.imageData, 0, 0);
   
  elem.insertAdjacentElement('afterbegin', this.canvas.canvas);
}
