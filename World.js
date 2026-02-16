// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }
`;

// Fragment shader program
//usample0=sky
//usample1=ground
//usample2=wall
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform int u_whichTexture;
  void main() {

  if(u_whichTexture == -2) { //Use color
    gl_FragColor = u_FragColor;

  } else if(u_whichTexture == -1) {
    gl_FragColor = vec4(v_UV, 1.0, 1.0); //Use UV color

  } else if(u_whichTexture == 0) {
    gl_FragColor = texture2D(u_Sampler0, v_UV); //Use texture0

  } else if(u_whichTexture == 1) {
    gl_FragColor = texture2D(u_Sampler1, v_UV); //Use texture1
  } else if(u_whichTexture == 2) {
    gl_FragColor = texture2D(u_Sampler2, v_UV); //Use texture2
  }
    else {
    gl_FragColor = vec4(1.0, 0.2, 0.2, 1.0); //Error color
  }

  }
`;

// global variables: user interface elements or data passed from JavaScript to GLSL shaders
let canvas;
let gl;
let a_Position
let u_FragColor;
let a_UV;
let u_whichTexture;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;

function setupWebGL() {
  canvas = document.getElementById('webgl'); //do not use var, that makes a new local variable instead of using the current global one 

  // Get the rendering context for WebGL
  //gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl",{ preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST);

}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
  
  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0){
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
   console.log('Failed to get the storage location of u_ModelMatrix');
   return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if(!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix){
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if(!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');


  // Get the storage location of u_Sampler
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler0');
    return false;
  }

  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1) {
    console.log('Failed to get the storage location of u_Sampler1');
    return false;
  }

  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  if (!u_Sampler2) {
    console.log('Failed to get the storage location of u_Sampler2');
    return false;
  }

}

//Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Global variables related to UI elements
let g_selectedColor=[1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_globalAngle = 0;
let g_camera;

let g_isDragging = false;
let g_lastMouseX = 0;
let g_lastMouseY = 0;
let g_flyMode = false;
let g_targetBlock = null;
let g_enemy = {
    x: 30,
    y: 0.75,
    z: -8,
    speed: 0.06,
    chaseRadius: 1000000000,  // How far away it can detect you
    caught: false,
    path: null,
    pathUpdateTimer: 0
};

let g_gameStartTime = null;
let g_gameWon = false;
let g_goalPosition = {x: 25, z: 25};  // End goal position


var minimapCanvas;
var minimapCtx;

// A* pathfinding
function findPath(startX, startZ, endX, endZ) {
    // Convert world to map coordinates
    var startMapX = Math.floor(startX + 16);
    var startMapZ = Math.floor(startZ + 16);
    var endMapX = Math.floor(endX + 16);
    var endMapZ = Math.floor(endZ + 16);
    
    // Check if start/end are valid
    if(startMapX < 0 || startMapX >= g_map[0].length || startMapZ < 0 || startMapZ >= g_map.length) return null;
    if(endMapX < 0 || endMapX >= g_map[0].length || endMapZ < 0 || endMapZ >= g_map.length) return null;
    
    var openSet = [{x: startMapX, z: startMapZ, g: 0, h: 0, f: 0, parent: null}];
    var closedSet = [];
    
    while(openSet.length > 0) {
        // Find node with lowest f score
        var currentIndex = 0;
        for(var i = 1; i < openSet.length; i++) {
            if(openSet[i].f < openSet[currentIndex].f) {
                currentIndex = i;
            }
        }
        
        var current = openSet[currentIndex];
        
        // Reached goal
        if(current.x === endMapX && current.z === endMapZ) {
            var path = [];
            var temp = current;
            while(temp) {
                path.push({x: temp.x - 16, z: temp.z - 16}); // Convert back to world coords
                temp = temp.parent;
            }
            return path.reverse();
        }
        
        // Move current from open to closed
        openSet.splice(currentIndex, 1);
        closedSet.push(current);
        
        // Check neighbors (4 directions)
        var neighbors = [
            {x: current.x + 1, z: current.z},
            {x: current.x - 1, z: current.z},
            {x: current.x, z: current.z + 1},
            {x: current.x, z: current.z - 1}
        ];
        
        for(var i = 0; i < neighbors.length; i++) {
            var neighbor = neighbors[i];
            
            // Check bounds
            if(neighbor.x < 0 || neighbor.x >= g_map[0].length || neighbor.z < 0 || neighbor.z >= g_map.length) continue;
            
            // Check if walkable
            if(g_map[neighbor.z][neighbor.x] > 0) continue;
            
            // Check if in closed set
            var inClosed = false;
            for(var j = 0; j < closedSet.length; j++) {
                if(closedSet[j].x === neighbor.x && closedSet[j].z === neighbor.z) {
                    inClosed = true;
                    break;
                }
            }
            if(inClosed) continue;
            
            // Calculate scores
            var g = current.g + 1;
            var h = Math.abs(neighbor.x - endMapX) + Math.abs(neighbor.z - endMapZ);
            var f = g + h;
            
            // Check if in open set with better score
            var inOpen = false;
            for(var j = 0; j < openSet.length; j++) {
                if(openSet[j].x === neighbor.x && openSet[j].z === neighbor.z) {
                    inOpen = true;
                    if(g < openSet[j].g) {
                        openSet[j].g = g;
                        openSet[j].f = f;
                        openSet[j].parent = current;
                    }
                    break;
                }
            }
            
            if(!inOpen) {
                openSet.push({x: neighbor.x, z: neighbor.z, g: g, h: h, f: f, parent: current});
            }
        }
        
        // Prevent infinite loops
        if(closedSet.length > 1000) break;
    }
    
    return null; // No path found
}

function setupMinimap() {
    minimapCanvas = document.getElementById('minimap');
    if(!minimapCanvas) {
        console.log("Minimap canvas not found");
        return;
    }
    minimapCtx = minimapCanvas.getContext('2d');
}

function drawMinimap() {
    if(!minimapCtx) return;
    
    var mapWidth = g_map[0].length;
    var mapHeight = g_map.length;
    var canvasWidth = minimapCanvas.width;
    var canvasHeight = minimapCanvas.height;
    
    // Calculate scale to fit map in canvas
    var scaleX = canvasWidth / mapWidth;
    var scaleY = canvasHeight / mapHeight;
    var scale = Math.min(scaleX, scaleY);
    
    // Clear minimap
    minimapCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    minimapCtx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw walls
    for(var z = 0; z < mapHeight; z++) {
        for(var x = 0; x < mapWidth; x++) {
            if(g_map[z][x] > 0) {
                minimapCtx.fillStyle = '#444444';
                minimapCtx.fillRect(x * scale, z * scale, scale, scale);
            }
        }
    }
    
    // Draw goal (green)
    var goalMapX = g_goalPosition.x + 16;
    var goalMapZ = g_goalPosition.z + 16;
    minimapCtx.fillStyle = '#00FF00';
    minimapCtx.beginPath();
    minimapCtx.arc(goalMapX * scale, goalMapZ * scale, scale * 2, 0, Math.PI * 2);
    minimapCtx.fill();
    
    // Draw enemy (red)
    var enemyMapX = g_enemy.x + 16;
    var enemyMapZ = g_enemy.z + 16;
    minimapCtx.fillStyle = '#FF0000';
    minimapCtx.beginPath();
    minimapCtx.arc(enemyMapX * scale, enemyMapZ * scale, scale * 2, 0, Math.PI * 2);
    minimapCtx.fill();
    
    // Draw player (blue)
    var playerMapX = g_camera.eye.elements[0] + 16;
    var playerMapZ = g_camera.eye.elements[2] + 16;
    minimapCtx.fillStyle = '#00FFFF';
    minimapCtx.beginPath();
    minimapCtx.arc(playerMapX * scale, playerMapZ * scale, scale * 2.5, 0, Math.PI * 2);
    minimapCtx.fill();
    
    // Draw player direction indicator
    var dirX = g_camera.at.elements[0] - g_camera.eye.elements[0];
    var dirZ = g_camera.at.elements[2] - g_camera.eye.elements[2];
    var dirLen = Math.sqrt(dirX * dirX + dirZ * dirZ);
    dirX /= dirLen;
    dirZ /= dirLen;
    
    minimapCtx.strokeStyle = '#00FFFF';
    minimapCtx.lineWidth = 2;
    minimapCtx.beginPath();
    minimapCtx.moveTo(playerMapX * scale, playerMapZ * scale);
    minimapCtx.lineTo((playerMapX + dirX * 3) * scale, (playerMapZ + dirZ * 3) * scale);
    minimapCtx.stroke();
}



function updateEnemy() {
    if(g_gameWon || g_enemy.caught) return;
    
    var distToPlayer = Math.sqrt(
        Math.pow(g_camera.eye.elements[0] - g_enemy.x, 2) +
        Math.pow(g_camera.eye.elements[2] - g_enemy.z, 2)
    );
    
    // Only chase if within radius
    if(distToPlayer > g_enemy.chaseRadius) {
        g_enemy.path = null;
        return;
    }
    
    // Update path every 30 frames (about 0.5 seconds)
    g_enemy.pathUpdateTimer++;
    if(g_enemy.pathUpdateTimer > 30 || !g_enemy.path) {
        g_enemy.pathUpdateTimer = 0;
        g_enemy.path = findPath(
            g_enemy.x, 
            g_enemy.z, 
            g_camera.eye.elements[0], 
            g_camera.eye.elements[2]
        );
    }
    
    // Follow path
    if(g_enemy.path && g_enemy.path.length > 1) {
        var nextWaypoint = g_enemy.path[1]; // [0] is current position, [1] is next
        
        var dirX = nextWaypoint.x - g_enemy.x;
        var dirZ = nextWaypoint.z - g_enemy.z;
        var dist = Math.sqrt(dirX * dirX + dirZ * dirZ);
        
        if(dist > 0.1) {
            // Move toward waypoint
            dirX /= dist;
            dirZ /= dist;
            
            g_enemy.x += dirX * g_enemy.speed;
            g_enemy.z += dirZ * g_enemy.speed;
        } else {
            // Reached waypoint, remove it from path
            g_enemy.path.shift();
        }
    }
    
    // Check if caught player
    if(distToPlayer < 1.5) {
        g_enemy.caught = true;
        console.log("CAUGHT! Game Over!");
        alert("You were caught! Time survived: " + Math.floor((performance.now() - g_gameStartTime) / 1000) + " seconds");
    }
}

function checkGoal() {
    if(g_gameWon) return;
    
    var distToGoal = Math.sqrt(
        Math.pow(g_camera.eye.elements[0] - g_goalPosition.x, 2) +
        Math.pow(g_camera.eye.elements[2] - g_goalPosition.z, 2)
    );
    
    if(distToGoal < 2) {
        g_gameWon = true;
        var timeTaken = Math.floor((performance.now() - g_gameStartTime) / 1000);
        console.log("YOU WIN! Time: " + timeTaken + " seconds");
        alert("YOU ESCAPED! Time: " + timeTaken + " seconds");
    }
}



function addActionsForHtmlUI(){
  //angle slider events
  document.getElementById('angleSlide').addEventListener('mousemove', function() {g_globalAngle=this.value; renderAllShapes();});
}

function tick() {
  renderAllShapes();
  requestAnimationFrame(tick);
}

function updateTargetBlock() {
    var rayOrigin = g_camera.eye;
    var rayDir = new Vector3();
    rayDir.set(g_camera.at);
    rayDir.sub(g_camera.eye);
    rayDir.normalize();
    
    var maxDistance = 5;      // TUNE THIS: reach distance
    var step = 0.01;           // TUNE THIS: precision
    var startDist = 0.2;       // TUNE THIS: starting distance
    
    for(var dist = startDist; dist < maxDistance; dist += step) {
        var checkX = rayOrigin.elements[0] + rayDir.elements[0] * dist;
        var checkY = rayOrigin.elements[1] + rayDir.elements[1] * dist;
        var checkZ = rayOrigin.elements[2] + rayDir.elements[2] * dist;
        
        var mapX = Math.floor(checkX + 16);   // TUNE THIS: should match drawMap offset
        var mapZ = Math.floor(checkZ + 16);
        
        if(mapX < 0 || mapX >= g_map[0].length || mapZ < 0 || mapZ >= g_map.length) continue;
        
        var columnHeight = g_map[mapZ][mapX];
        
        if(columnHeight > 0) {
            var layerHeight = Math.floor(checkY + 0.75);  // TUNE THIS: Y alignment
            
            // DEBUG: Uncomment to see what's being checked
            // console.log("Checking", mapX, mapZ, "layer", layerHeight, "of", columnHeight);
            
            if(layerHeight >= 0 && layerHeight < columnHeight) {
                g_targetBlock = {
                    mapX: mapX,
                    mapZ: mapZ,
                    worldX: mapX - 16,
                    worldZ: mapZ - 16,
                    height: columnHeight,
                    targetLayer: layerHeight,
                    distance: dist  // Add distance for debugging
                };
                return;
            }
        }
    }
    
    g_targetBlock = null;
}


function handleMouseDown(ev) {
  g_isDragging = true;
  g_lastMouseX = ev.clientX;
  g_lastMouseY = ev.clientY;
}

function handleMouseMove(ev) {
  if(!g_isDragging) return;
  var deltaX = ev.clientX - g_lastMouseX;
  var deltaY = ev.clientY - g_lastMouseY;
  g_lastMouseX = ev.clientX;
  g_lastMouseY = ev.clientY;
  var sensitivity = 0.2;
  if(deltaX !== 0) {
    var angle = -deltaX * sensitivity;
    rotateCameraHorizontal(angle);
  }
  if(deltaY !== 0) {
    var angleY = -deltaY * sensitivity;
    rotateCameraVertical(angleY);
  }
  renderAllShapes();
}

function rotateCameraHorizontal(angle) {
  var f = new Vector3();
  f.set(g_camera.at);
  f.sub(g_camera.eye);
  var rotationMatrix = new Matrix4();
  rotationMatrix.setRotate(angle, g_camera.up.elements[0], g_camera.up.elements[1], g_camera.up.elements[2]);
  var f_prime = rotationMatrix.multiplyVector3(f);
  g_camera.at = new Vector3();
  g_camera.at.set(g_camera.eye);
  g_camera.at.add(f_prime);
}

function rotateCameraVertical(angle) {
  var f = new Vector3();
  f.set(g_camera.at);
  f.sub(g_camera.eye);
  var s = Vector3.cross(g_camera.up, f);
  var rotationMatrix = new Matrix4();
  rotationMatrix.setRotate(angle, s.elements[0], s.elements[1], s.elements[2]);
  var f_prime = rotationMatrix.multiplyVector3(f);
  g_camera.at = new Vector3();
  g_camera.at.set(g_camera.eye);
  g_camera.at.add(f_prime);
}

function handleMouseUp(ev) {
  g_isDragging = false;
}



function main() {
  // Retrieve <canvas> element
  setupWebGL();
  window.gl = gl;
  resizeCanvas();

  
  // Initialize shaders
  connectVariablesToGLSL();

  //set up actions for HTML UI elements
  addActionsForHtmlUI();

  document.onkeydown = keydown;

  //mouse controls
  canvas.onmousedown = handleMouseDown;
  canvas.onmousemove = handleMouseMove;
  canvas.onmouseup = handleMouseUp;
  initTextures();
  setupMinimap();
 
  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  requestAnimationFrame(tick);
}



var g_shapesList = [];

// var g_points = [];  // The array for the position of a mouse press
// var g_colors = [];  // The array to store the color of a point
// var g_sizes = [];   // The array to store the size of a point




function click(ev) {
  //extract event click and convert coordinates to webGL coordinates
  let [x,y] = convertCoordinatesEventToGL(ev);

  //create and store the new point
  let point;
  if(g_selectedType == POINT){
    point = new Point();
  } else if (g_selectedType == CIRCLE){
    point = new Circle();
  } else{
    point = new Triangle();
  }
  point.position=[x, y];
  point.color=g_selectedColor.slice();
  point.size=g_selectedSize;
  g_shapesList.push(point);
  
  renderAllShapes();
}

function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
  return([x, y]);
}


g_camera = new Camera();

var g_map = [
  [6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6],
  [6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,0,0,0,0,0,0,6],
  [6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,0,0,0,0,0,0,6],
  [6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,0,0,0,0,0,0,6],
  [6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,0,0,0,0,0,0,6],
  [6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,0,0,0,0,0,0,6],
  [6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,0,0,0,0,0,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,0,0,0,0,0,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,0,0,0,0,0,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,0,0,0,0,0,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,0,0,0,0,0,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,5,5,5,5,5,5,5,0,0,0,0,0,0,0,0,6],
  [6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6],
  [6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6],
  [6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6],
  [6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6],
  [6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6],
  [6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,6,6,6,6,5,3,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,6,6,6,6,5,3,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6],
  [6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6],
];

function drawMap(){          
  var body = new Cube();
  
  for(var z=0; z<g_map.length; z++){
    for(var x=0; x<g_map[0].length; x++){
      var height = g_map[z][x];
      
      if(height > 0){
        for(var h=0; h<height; h++){
          body.color = [1.0, 1.0, 1.0, 1.0];
          body.textureNum = 2;  // Your rock texture
          body.matrix.setIdentity();
          body.matrix.translate(x-16, -0.75 + h, z-16);
          
          // Make texture span 4x4 cubes
          var uvScaleX = 0.25;
          var uvScaleY = 0.25;
          var uvOffsetX = (x % 4) * 0.25;
          var uvOffsetY = (z % 4) * 0.25;
          
          body.renderfastWithUV(uvScaleX, uvScaleY, uvOffsetX, uvOffsetY);
        }
      }  
    }
  }
}

function keydown(ev) {
    if(ev.keyCode == 87) { // W
        g_camera.forward();
    } else if(ev.keyCode == 83) { // S
        g_camera.back();
    } else if(ev.keyCode == 65) { // A
        g_camera.left();
    } else if(ev.keyCode == 68) { // D
        g_camera.right();
    } else if(ev.keyCode == 81) { // Q
        g_camera.panLeft();
    } else if(ev.keyCode == 69) { // E
        g_camera.panRight();
    } else if(ev.keyCode == 70) { // F
        g_flyMode = !g_flyMode;
        console.log("Fly mode: " + (g_flyMode ? "ON" : "OFF"));
        if (!g_flyMode) {
          var groundLevel = 0.75;
          if (g_camera.eye.elements[1] > groundLevel) {
            var dropAmount = g_camera.eye.elements[1] - groundLevel;
            g_camera.eye.elements[1] -= dropAmount;
            g_camera.at.elements[1] -= dropAmount;
          }
        }
    } else if(ev.keyCode == 66) { // B key - Break block
        breakBlock();
    } else if(ev.keyCode == 80) { // P key - Place block
        placeBlock();
    } else if(ev.keyCode == 82) { // R key - Restart
        restartGame();
    }
    renderAllShapes();
}

function restartGame() {
    g_camera.eye = new Vector3([0, 0.75, 3]);
    g_camera.at = new Vector3([0, 0.75, -100]);
    g_enemy.x = -10;
    g_enemy.z = -10;
    g_enemy.caught = false;
    g_enemy.path = null;
    g_enemy.pathUpdateTimer = 0;
    g_gameWon = false;
    g_gameStartTime = performance.now();
    console.log("Game restarted!");
}


function breakBlock() {
    if(!g_targetBlock) {
        console.log("No block targeted to break!");
        return;
    }
    
    // Calculate direction vector from eye to at
    var dirX = g_camera.at.elements[0] - g_camera.eye.elements[0];
    var dirZ = g_camera.at.elements[2] - g_camera.eye.elements[2];
    
    // Get block 2 units in front of camera
    var targetX = g_camera.eye.elements[0] + dirX * 0.05;
    var targetZ = g_camera.eye.elements[2] + dirZ * 0.05;
    
    var mapX = Math.floor(targetX + 16);
    var mapZ = Math.floor(targetZ + 16);
    
    console.log("Breaking at map coords:", mapX, mapZ, "world coords:", targetX, targetZ);
    
    // Check bounds - your map is 51x45 now!
    if(mapX < 0 || mapX >= g_map[0].length || mapZ < 0 || mapZ >= g_map.length) {
        console.log("Out of bounds!");
        return;
    }
    
    // Break block
    if(g_map[mapZ][mapX] > 0) {
        g_map[mapZ][mapX]--;
        console.log("Broke block at", mapX, mapZ, "new height:", g_map[mapZ][mapX]);
    } else {
        console.log("No block to break!");
    }
}

function placeBlock() {
    // Calculate direction vector from eye to at
    var dirX = g_camera.at.elements[0] - g_camera.eye.elements[0];
    var dirZ = g_camera.at.elements[2] - g_camera.eye.elements[2];
    
    // Get block 2 units in front of camera
    var targetX = g_camera.eye.elements[0] + dirX * 0.05;
    var targetZ = g_camera.eye.elements[2] + dirZ * 0.05;
    
    var mapX = Math.floor(targetX + 16);
    var mapZ = Math.floor(targetZ + 16);
    
    console.log("Placing at map coords:", mapX, mapZ, "world coords:", targetX, targetZ);
    
    // Check bounds
    if(mapX < 0 || mapX >= g_map[0].length || mapZ < 0 || mapZ >= g_map.length) {
        console.log("Out of bounds!");
        return;
    }
    
    // Place block
    if(g_map[mapZ][mapX] < 10) {
        g_map[mapZ][mapX]++;
        console.log("Placed block at", mapX, mapZ, "new height:", g_map[mapZ][mapX]);
    } else {
        console.log("Already at max height!");
    }
}
function renderAllShapes(){
    var startTime = performance.now();

    
    // Start timer on first frame
    if(g_gameStartTime == null) {
        g_gameStartTime = performance.now();
    }
    
    var projMat = new Matrix4();
    projMat.setPerspective(50, canvas.width/canvas.height, 1, 1000);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);
    
    var viewMat = new Matrix4();
    viewMat.setLookAt(
        g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2],
        g_camera.at.elements[0], g_camera.at.elements[1], g_camera.at.elements[2],
        g_camera.up.elements[0], g_camera.up.elements[1], g_camera.up.elements[2]
    ); 
    
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);
    
    var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Update game logic
    updateEnemy();
    checkGoal();
    updateTargetBlock();
    drawMap();
    
    // Draw enemy (red )
    var enemy = new Cube();
    enemy.color = [1.0, 0.0, 0.0, 1.0];  // Red
    enemy.textureNum = -2;
    enemy.matrix.translate(g_enemy.x, g_enemy.y, g_enemy.z);
    enemy.matrix.scale(0.5, 0.5, 0.5);
    enemy.renderfast();
    
    // Draw goal (green)
    var goal = new Cube();
    goal.color = [0.0, 1.0, 0.0, 1.0];  // Green
    goal.textureNum = -2;
    goal.matrix.translate(g_goalPosition.x, 0.75, g_goalPosition.z);
    goal.matrix.scale(0.8, 0.8, 0.8);
    goal.renderfast();
    
    // Draw target marker
    if(g_targetBlock) {
        gl.disable(gl.DEPTH_TEST);
        var marker = new Cube();
        marker.color = [1.0, 1.0, 0.0, 1.0];
        marker.textureNum = -2;
        marker.matrix.translate(g_targetBlock.worldX, -0.75 + g_targetBlock.targetLayer, g_targetBlock.worldZ);
        marker.matrix.scale(1.05, 1.05, 1.05);
        marker.render();
        gl.enable(gl.DEPTH_TEST);
    }
    
    var floor = new Cube();
    floor.color = [0.5, 0.5, 0.5, 1.0];
    floor.textureNum = 1;
    floor.matrix.translate(3, -.75, -0.0);
    floor.matrix.scale(60, 0.01, 60);
    floor.matrix.translate(-.4, 1, -.4);
    floor.render();
    
    var sky = new Sphere();
    sky.color = [0.0, 1.0, 0.0, 1.0];
    sky.textureNum = 0;
    sky.matrix.scale(50, 50, 50);
    sky.matrix.translate(0.2, .3, 0);
    sky.renderfast();
    
    // Remove the test objects (body, leftArm, box) or keep them if you want

    drawMinimap();
    
    var duration = performance.now() - startTime;
    
    // Show timer
    var gameTime = Math.floor((performance.now() - g_gameStartTime) / 1000);
    sendTextToHTML("Time: " + gameTime + "s | ms: "+Math.floor(duration) + " fps: " + Math.floor(10000/duration), "numdot");
}

function sendTextToHTML(text, htmlID){
  var htmlElm = document.getElementById(htmlID);
  if(!htmlElm){
    console.log("Failed to get" + htmlID + "from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}




//initalize and load textures : functions taken from Matsuda textbook

function initTextures() {
  var image = new Image();  // Create the image object
  if (!image) {
    console.log('Failed to create the image object');
    return false;
  }
  // Register the event handler to be called on loading an image
  image.onload = function(){ sendImageToTEXTURE0(image); };
  // Tell the browser to load an image
  image.src = 'sky.jpg';

  //add more textures here
  var image1 = new Image();
  if (!image1) {
    console.log('Failed to create the image object');
    return false;
  }
  image1.onload = function(){ sendImageToTEXTURE1(image1); };
  image1.onerror = function() { console.log('Failed to load uvgrid.png'); };  // Add this

  image1.src = 'uvgrid.jpg';

  var image2 = new Image();
  if (!image2) {
    console.log('Failed to create the image object');
    return false;
  }
  image2.onload = function(){ sendImageToTEXTURE2(image2); };
  image2.onerror = function() { console.log('Failed to load wall.jpg'); };  // Add this
  image2.src = 'wall.jpg';


  return true;
}

function sendImageToTEXTURE0(image) {
  var texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit0
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  
  gl.generateMipmap(gl.TEXTURE_2D); // Generate mipmap for the texture
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);  // Add this line
  
  // Set the texture unit 0 to the sampler
  gl.uniform1i(u_Sampler0, 0);

  console.log("texture 0 loaded with mipmaps");
}

function sendImageToTEXTURE1(image) {
  console.log("sendImageToTEXTURE1 called");
  console.log("Image dimensions:", image.width, image.height);
  
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  
  gl.generateMipmap(gl.TEXTURE_2D); // Generate mipmap for the texture

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    
// Set the texture unit 1 to the sampler
  gl.uniform1i(u_Sampler1, 1);

  console.log("texture 1 loaded with mapmaps");
  console.log("GL error:", gl.getError()); // Should be 0

}

function sendImageToTEXTURE2(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D); // Generate mipmap for the texture
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
  gl.uniform1i(u_Sampler2, 2);
  console.log("texture 2 loaded with mapmaps");
  console.log("GL error:", gl.getError()); // Should be 0
}