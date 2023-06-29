// Initialize Fabric.js canvas
var canvas = new fabric.Canvas('canvas', {
  width: 1500,
  height: 1000,
  selection: false
});

// Set up Socket.IO connection
var socket = io();


// Function to send drawing data to other clients
function sendDrawData() {
  var jsonData = JSON.stringify(canvas.toJSON());
  socket.emit('draw', jsonData);
}

// Variable to track pencil mode
var pencilMode = false;
var lineMode = false;
var dragMode = false;
var startPoint = null;
let selectedColor = "#000"

// Function to handle shape drawing
function handleShapeDrawing(shape, options) {
  startPoint = canvas.getPointer(options.e);
  var obj;

  // Deselect all shapes if pencil mode is active
  if (pencilMode) {
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }

  switch (shape) {
    case 'rectangle':
      obj = new fabric.Rect({
        left: startPoint.x,
        top: startPoint.y,
        width: 0,
        height: 0,
        fill: 'transparent',
        stroke: selectedColor,
        strokeWidth: 2,
      });
      break;
    case 'circle':
      obj = new fabric.Circle({
        left: startPoint.x,
        top: startPoint.y,
        radius: 0,
        fill: 'transparent',
        stroke: selectedColor,
        strokeWidth: 2
      });
      break;
    case 'triangle':
      obj = new fabric.Triangle({
        left: startPoint.x,
        top: startPoint.y,
        width: 0,
        height: 0,
        fill: 'transparent',
        stroke: selectedColor,
        strokeWidth: 2
      });
      break;
  }

  canvas.add(obj);
  
  // Add click event listener to the shape
  obj.on('mousedown', function() {
    canvas.setActiveObject(obj);
  });

  canvas.on('mouse:move', function(options) {
    var currentPoint = canvas.getPointer(options.e);

    if (lineMode) {
      obj.set({
        x2: currentPoint.x,
        y2: currentPoint.y
      });
    } else {
      switch (shape) {
        case 'rectangle':
          obj.set({
            width: currentPoint.x - startPoint.x,
            height: currentPoint.y - startPoint.y
          });
          break;
        case 'circle':
          var radius = Math.abs(currentPoint.x - startPoint.x);
          obj.set({ radius: radius });
          break;
        case 'triangle':
          var width = Math.abs(currentPoint.x - startPoint.x);
          var height = Math.abs(currentPoint.y - startPoint.y);
          obj.set({ width: width, height: height });
          break;
      }
    }

    canvas.renderAll();
  });

  canvas.on('mouse:up', function() {
    canvas.off('mouse:move');
    canvas.off('mouse:up');
    sendDrawData();
  });
}

// Add event listeners for shape buttons
document.getElementById('rectangle').addEventListener('click', function() {
  pencilMode = false;
  lineMode = false;
  dragMode = false;
  canvas.isDrawingMode = false;
  canvas.off('mouse:down');
  canvas.off('mouse:move');
  canvas.off('mouse:up');

  canvas.on('mouse:down', function(options) {
    handleShapeDrawing('rectangle', options);
  });
});

document.getElementById('circle').addEventListener('click', function() {
  pencilMode = false;
  lineMode = false;
  dragMode = false;
  canvas.isDrawingMode = false;
  canvas.off('mouse:down');
  canvas.off('mouse:move');
  canvas.off('mouse:up');

  canvas.on('mouse:down', function(options) {
    handleShapeDrawing('circle', options);
  });
});

document.getElementById('triangle').addEventListener('click', function() {
  pencilMode = false;
  lineMode = false;
  dragMode = false;
  canvas.isDrawingMode = false;
  canvas.off('mouse:down');
  canvas.off('mouse:move');
  canvas.off('mouse:up');

  canvas.on('mouse:down', function(options) {
    handleShapeDrawing('triangle', options);
  });
});

document.getElementById('pencil').addEventListener('click', function() {
  pencilMode = true;
  lineMode = false;
  dragMode = false;
  canvas.isDrawingMode = true;
  canvas.freeDrawingBrush.width = 2;
  canvas.off('mouse:down');
  canvas.off('mouse:move');
  canvas.off('mouse:up');

  canvas.on('path:created', function() {
    sendDrawData();
  });
});

document.getElementById('line').addEventListener('click', function() {
  pencilMode = false;
  lineMode = true;
  dragMode = false;
  canvas.isDrawingMode = false;
  canvas.off('mouse:down');
  canvas.off('mouse:move');
  canvas.off('mouse:up');

  canvas.on('mouse:down', function(options) {
    startPoint = canvas.getPointer(options.e);
    var line = new fabric.Line([startPoint.x, startPoint.y, startPoint.x, startPoint.y], {
      stroke: selectedColor,
      strokeWidth: 2
    });
    canvas.add(line);

    canvas.on('mouse:move', function(options) {
      var currentPoint = canvas.getPointer(options.e);
      line.set({
        x2: currentPoint.x,
        y2: currentPoint.y
      });
      canvas.renderAll();
    });

    canvas.on('mouse:up', function() {
      canvas.off('mouse:move');
      canvas.off('mouse:up');
      sendDrawData();
    });
  });
});

document.getElementById('drag').addEventListener('click', function() {
  pencilMode = false;
  lineMode = false;
  dragMode = true;
  canvas.isDrawingMode = false;
  canvas.off('mouse:down');
  canvas.off('mouse:move');
  canvas.off('mouse:up');

  canvas.selection = true;
  canvas.forEachObject(function(obj) {
    obj.set('selectable', true);
    
    // Add click event listener to each shape
    obj.on('mousedown', function() {
      canvas.setActiveObject(obj);
    });
  });

  // Event listener for object modification
  canvas.on('object:modified', function(event) {
    if (dragMode) {
      sendDrawData();
    }
  });
});


// Add event listener for text button
document.getElementById('text').addEventListener('click', function() {
  pencilMode = false;
  lineMode = false;
  dragMode = false;
  canvas.isDrawingMode = false;
  canvas.off('mouse:down');
  canvas.off('mouse:move');
  canvas.off('mouse:up');

  var textModeActive = false;
  var activeTextObject = null;

  canvas.on('mouse:down', function(options) {
    if (textModeActive) {
      return;
    }

    var pointer = canvas.getPointer(options.e);
    var text = new fabric.IText('Enter text', {
      left: pointer.x,
      top: pointer.y,
      fill: selectedColor,
      fontSize: 16,
      fontFamily: 'Arial',
      editable: true
    });

    activeTextObject = text;

    canvas.add(text);
    canvas.setActiveObject(text);

    // Focus on the text input for immediate editing
    text.enterEditing();

    canvas.renderAll();

    canvas.on('mouse:up', function() {
      canvas.off('mouse:up');
      sendDrawData();
    });

    textModeActive = true;
  });

  canvas.on('text:changed', function(options) {
    if (textModeActive && activeTextObject) {
      sendDrawData();
    }
  });

  
});



// Add event listener for erase button
// Add event listener for the erase button
document.getElementById('eraser').addEventListener('click', function() {
  // Disable drawing mode and other shape buttons
  canvas.isDrawingMode = false;
  canvas.off('mouse:down');
  canvas.off('mouse:move');
  canvas.off('mouse:up');

  // Enable erase mode
  canvas.forEachObject(function(obj) {
    obj.selectable = true;
    obj.hoverCursor = 'pointer';
    obj.on('mouseover', function() {
      canvas.remove(obj);
      sendDrawData();
    });
  });
});


// Add event listener for the image button
document.getElementById('image').addEventListener('click', function() {
  // Create an input element of type "file"
  var input = document.createElement('input');
  input.type = 'file';

  // Trigger a click event on the input element
  input.click();

  // Event listener for when a file is selected
  input.addEventListener('change', function(e) {
    var file = e.target.files[0];

    // Create a FileReader object to read the file
    var reader = new FileReader();

    // Event listener for when the file has been loaded
    reader.onload = function(event) {
      var imgData = event.target.result;

      // Create a new image object using the loaded data
      fabric.Image.fromURL(imgData, function(img) {
        // Position the image at the center of the canvas
        img.set({
          left: canvas.width / 2,
          top: canvas.height / 2,
          originX: 'center',
          originY: 'center'
        });

        // Add event listener for object moving
        img.on('moving', function() {
          sendDrawData();
        });

        // Add the image to the canvas
        canvas.add(img);
        canvas.renderAll();
        sendDrawData();
      });
    };

    // Read the file as data URL
    reader.readAsDataURL(file);
  });
});







// Add event listener for delete button
document.getElementById('delete').addEventListener('click', function() {
  canvas.clear();
  sendDrawData();
});


// Add event listener for the download button
document.getElementById('download').addEventListener('click', function() {
  // Create a temporary canvas element to render the background color
  var tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  var tempCtx = tempCanvas.getContext('2d');

  // Set the background color
  tempCtx.fillStyle = canvas.backgroundColor || 'white'; // Use the canvas background color if defined, otherwise white
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

  // Overlay the main canvas on top of the background
  tempCtx.drawImage(canvas.getElement(), 0, 0);

  // Convert the temporary canvas to data URL
  var dataURL = tempCanvas.toDataURL({
    format: 'png',
    multiplier: 2 // Increase the multiplier to get higher resolution
  });

  // Create a temporary link element
  var link = document.createElement('a');
  link.href = dataURL;
  link.download = 'canvas_image.png';

  // Trigger the download
  link.click();
});


// Add event listeners to color palette buttons
var colorButtons = document.querySelectorAll('.color-button');
colorButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    var color = button.getAttribute('data-color');
    selectedColor = color;
    updateCursorColor(color);
    updateShapeStrokeColor(color);
    canvas.freeDrawingBrush.color = color;
    canvas.renderAll();
  });
});

// Add event listener to color selector
var colorSelector = document.getElementById('color-selector');
colorSelector.addEventListener('input', function () {
  var color = colorSelector.value;
  selectedColor = color;
  updateCursorColor(color);
  updateShapeStrokeColor(color);
  canvas.freeDrawingBrush.color = color;
  canvas.renderAll();
});

// Function to update the cursor color
function updateCursorColor(color) {
  var canvasElement = document.getElementById('canvas');
  canvasElement.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="${encodeURIComponent(color)}"><circle cx="16" cy="16" r="14"/></svg>') 8 8, auto`;
}

// Function to update the stroke color of shapes
function updateShapeStrokeColor(color) {
  var activeObject = canvas.getActiveObject();
  if (activeObject) {
    activeObject.set('stroke', color);
    canvas.renderAll();
  }
}



// Socket.IO client configuration
var socket = io();

// Join the room
socket.emit('joinRoom', 'whiteboard');

// Event listener for receiving drawing data from other clients
socket.on('draw', function(data) {
  var obj = JSON.parse(data);
  canvas.loadFromJSON(obj);
  canvas.renderAll();
});

