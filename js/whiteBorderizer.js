var BLACK_THRESHOLD = 50;
var DFLT_INSET = 5;

var pixelData = null;
var imageWidth = null;
var imageHeight = null;

function convertCanvasToWhiteBorder2(canvas) {

    console.log("Whiteborderizing!!!");

    // HACK HACK HACK:  This isn't the 'real' way to do this, but it may be good enough

    var ctx = canvas.getContext('2d');
    imageWidth = canvas.width;
    imageHeight = canvas.height;
    pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    var upperBottomBorder = imageHeight - 5;
    var innerLeftBorder = 0;
    var innerRightBorder = imageWidth - 5;

    var halfHeight = imageHeight / 2;
    var halfWidth = imageWidth / 2;

    var bottomBorderHeight = -1;
    var leftBorderWidth = -1;


    // First, move up from the bottom trying to measure the bottom border
    var x = Math.round(imageWidth * 0.70);
    for (var y = imageHeight-DFLT_INSET; y > halfHeight; y--) {
        if (!isBlack(ctx, x, y)) {
            // We hit an edge!
            bottomBorderHeight = imageHeight - y;
            upperBottomBorder = y;
            break;
        }
    }

    upperBottomBorder = upperBottomBorder + 1;

    // Now...invert everything below that border!
    for (var x = 0; x < imageWidth + 1; x++) {
        for (var y = upperBottomBorder; y < imageHeight; y++) {
            invertPixel(ctx, x, y);
        }
    }

    // Get the inner-left border
    var y = bottomBorderHeight + 20;
    for (var x = DFLT_INSET; x < halfWidth; x++) {
        if (!isBlack(ctx, x, y)) {
            // We hit an edge!
            leftBorderWidth = x;
            innerLeftBorder = x;
            break;
        }
    }
    fillRectWhite(ctx, 0, 0, leftBorderWidth, imageHeight - bottomBorderHeight + 1);

    // Get the inner-right border
    var y = bottomBorderHeight + 20;
    for (var x = imageWidth-DFLT_INSET; x > halfWidth; x--) {
        if (!isBlack(ctx, x, y)) {
            // We hit an edge!
            rightBorderWidth = imageWidth - x;
            innerRightBorder = x;
            break;
        }
    }
    fillRectWhite(ctx, innerRightBorder, 0, rightBorderWidth, imageHeight - bottomBorderHeight + 1);




    // Fix up the little smidgens of black in the bottom-left corner
    var xMax = Math.round((2*leftBorderWidth) + leftBorderWidth * 0.25);
    var yStart = Math.round(imageHeight - (2*leftBorderWidth + leftBorderWidth * 0.25));
    for (var x = 0; x < xMax ; x++) {
        for (var y = yStart; y < imageHeight; y++) {

            var maxXToColor = y - yStart;
            if (y <= upperBottomBorder && x >= innerLeftBorder && x < maxXToColor) {
                setPixel(ctx, x, y, 255, 255, 255);
            }

        }
    }


    // Fix up the bottom-right smidgen
    var xStart = imageWidth - Math.round((2*leftBorderWidth) + leftBorderWidth * 0.25);
    var yStart = Math.round(imageHeight - (2*leftBorderWidth + leftBorderWidth * 0.25));
    for (var x = xStart; x < imageWidth ; x++) {
        for (var y = yStart; y < imageHeight; y++) {

            var minXToColor = imageWidth - (y - yStart);
            if (y <= upperBottomBorder && x <= innerRightBorder && x > minXToColor) {
                setPixel(ctx, x, y, 255, 255, 255);
            }

        }
    }


    ctx.putImageData(pixelData, 0, 0);
}


function fillRectWhite(ctx, x, y, width, height) {
    for (var i = 0; i < width; i++) {
        for (var j = 0; j < height; j++) {
            setPixel(ctx, i+x, j+y, 255, 255, 255);
        }
    }

}

function setPixel(ctx, x, y, r, g, b) {
  /*
    var id = ctx.createImageData(1,1); // only do this once per page
    var d  = id.data;                        // only do this once per page
    d[0]   = r;
    d[1]   = g;
    d[2]   = b;
    d[3]   = 255;
    ctx.putImageData( id, x, y );
    */

    // pixel data is layed out sequentially
    var offset = (y * imageWidth + x) * 4;
    pixelData.data[offset] = r;
    pixelData.data[offset+1] = g;
    pixelData.data[offset+2] = b;
}


function invertPixel(ctx, x, y) {
    var p = getPixel(ctx, x, y);

    var newR = p[0] <= BLACK_THRESHOLD ? 255 : 255 - p[0];
    var newG = p[1] <= BLACK_THRESHOLD ? 255 : 255 - p[1];
    var newB = p[2] <= BLACK_THRESHOLD ? 255 : 255 - p[2];

    setPixel(ctx, x, y, newR, newG, newB);
}


function getPixel(ctx, x, y) {
  /*
    var p = ctx.getImageData(x, y, 1, 1).data;
    return p;
    */

    var offset = (y * imageWidth + x) * 4;
    return [ pixelData.data[offset], pixelData.data[offset+1], pixelData.data[offset+2], pixelData.data[offset+3] ];
}

function isBlack(ctx, x, y) {
    var p = getPixel(ctx, x, y);
    console.log("Values: " + p[0] + ", " + p[1] + ", " + p[2]);
    if (p[0] < BLACK_THRESHOLD && p[1] < BLACK_THRESHOLD && p[2] < BLACK_THRESHOLD) {
        return true;
    }
    return false;
}
