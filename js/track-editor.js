///////////////////////////////////////////////////////////////////////////////
// Constants and global variables.
///////////////////////////////////////////////////////////////////////////////
var CANVAS_WIDTH = 600;
var CANVAS_HEIGHT = 400;
var POINT_WIDTH = 4;
var POINT_HEIGHT = 4;
var grassBackground = false;
var showControlPoints = false;
var showTrackLines = true;
var controlPoints = [];

///////////////////////////////////////////////////////////////////////////////
// Function to clear the list of points from memory.
///////////////////////////////////////////////////////////////////////////////
function clearPoints() {
	controlPoints = [];
}

///////////////////////////////////////////////////////////////////////////////
// Function to create a random track object based on the trackParams options.
///////////////////////////////////////////////////////////////////////////////
function generateProceduralTrack(trackParams) {
	var min = trackParams.min;
	var max = trackParams.max;
	var minSegmentLength = trackParams.minSegmentLength;
	var maxSegmentLength = trackParams.maxSegmentLength;
	var curviness = trackParams.curviness;
	var maxAngle = trackParams.maxAngle / 360.0 * Math.PI;

	var track = {};
	track.data = [];
	track.points = Math.floor((max - min) * Math.random()) + min;
	track.minX = 0;
	track.minY = 0;
	track.maxX = 0;
	track.maxY = 0;
	track.data[0] = { x: 300, y: 200, z: 0 };
	direction = 0;

	for (var i = 1; i < track.points; i++) {
		var len = Math.floor((maxSegmentLength - minSegmentLength) * Math.random()) + minSegmentLength;
		var dx = Math.sin(direction) * len;
		var dy = Math.cos(direction) * len;
		var x = track.data[i - 1].x + dx;
		var y = track.data[i - 1].y + dy;
		track.data[i] = {
			x: x,
			y: y,
			z: 0
		};
		turn = Math.pow(Math.random(), 1 / curviness);
		if (Math.random() < 0.5) {
			turn = -turn;
		}
		direction += turn * maxAngle;
	}

	q = Math.floor(track.points * 0.75);
	c = track.points - q;
	var x0 = track.data[0].x;
	var y0 = track.data[0].y;

	for (i = q; i < track.points; i++) {
		var x = track.data[i].x;
		var y = track.data[i].y;
		var a = i-q;
		track.data[i].x = x0 * a/c + x * (1 - a/c);
		track.data[i].y = y0 * a/c + y * (1 - a/c);
	}

	for (i = 1; i < track.points; i++) {
		x = track.data[i].x;
		y = track.data[i].y;
		if(x < track.minX) {
			track.minX = x;
		}
		if (y < track.minY) {
			track.minY = y;
		}
		if (x > track.maxX) {
			track.maxX = x;
		}
		if (y > track.maxY) {
			track.maxY = y;
		}
		track.minSize = Math.min(track.minX, track.minY);
		track.maxSize = Math.max(track.maxX, track.maxY);
	}

	return track;
}

///////////////////////////////////////////////////////////////////////////////
// Function to save the list of points to disk.
///////////////////////////////////////////////////////////////////////////////
function savePoints() {
    var csvContent = "data:text/csv;charset=utf-8,";
    controlPoints.forEach(function (point, index) {
        dataString = point.x.toFixed(2) + ',' + point.y.toFixed(2) + ',' + point.z.toFixed(2);
        csvContent += dataString + '\n';
    });
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "control_points.csv");
    document.body.appendChild(link);
    link.click();
}

///////////////////////////////////////////////////////////////////////////////
// Function to test if all points of the track are inside the canvas limits.
///////////////////////////////////////////////////////////////////////////////
function isEntireTrackInsideCanvas(track) {
	for (var i = 0; i < track.data.length; i++) {
		var isTrackPointOutsideCanvas = (
			track.data[i].x < 0
			|| track.data[i].x > CANVAS_WIDTH
			|| track.data[i].y < 0
			|| track.data[i].y > CANVAS_HEIGHT
		);

		if (isTrackPointOutsideCanvas) {
			return false;
		}
	}
	return true;
}

///////////////////////////////////////////////////////////////////////////////
// Function to display and hide the grass background image.
///////////////////////////////////////////////////////////////////////////////
function toggleDisplayGrass() {
    grassBackground = !grassBackground;
    var btnLabel = (grassBackground) ? 'hide grass image' : 'show grass image';
    $('.btn-show-grass').html(btnLabel);
}

///////////////////////////////////////////////////////////////////////////////
// Function to display and hide the track center lines.
///////////////////////////////////////////////////////////////////////////////
function toggleDisplayTrackLines() {
    showTrackLines = !showTrackLines;
    var btnLabel = (showTrackLines) ? 'hide track lines' : 'show track lines';
    $('.btn-show-track-lines').html(btnLabel);
}

///////////////////////////////////////////////////////////////////////////////
// Function to display and hide the control points.
///////////////////////////////////////////////////////////////////////////////
function toggleDisplayControlPoints() {
    showControlPoints = !showControlPoints;
    var btnLabel = (showControlPoints) ? 'hide control points' : 'show control points';
    $('.btn-show-points').html(btnLabel);
}

///////////////////////////////////////////////////////////////////////////////
// Function to generate a random procedural track.
///////////////////////////////////////////////////////////////////////////////
function generateTrack() {
	var track = { data: [{ x: -1, y: -1, z: -1 }] };
	while (!isEntireTrackInsideCanvas(track)) {
		track = generateProceduralTrack({
			min: 100,
			max: 200,
			minSegmentLength: 3,
			maxSegmentLength: 6,
			curviness: 0.1,
			maxAngle: 70
		});
	}
	controlPoints = track.data;
	controlPoints.push(track.data[0]);
}

///////////////////////////////////////////////////////////////////////////////
// Mouse pressed action to add points to the list.
///////////////////////////////////////////////////////////////////////////////
function mousePressed() {
	var isMouseInsideCanvas = (
		mouseX >= 0
		&& mouseX <= CANVAS_WIDTH
		&& mouseY >= 0
		&& mouseY <= CANVAS_HEIGHT
	);
	if (!isMouseInsideCanvas) {
		return;
	}
    var newVector = new Vector(
        mouseX - POINT_WIDTH,
		mouseY - POINT_HEIGHT - 2,
		0
    );
    controlPoints.splice(-1, 1);
    controlPoints.push(newVector);
    controlPoints.push(controlPoints[0]);
}

///////////////////////////////////////////////////////////////////////////////
// Setup function that runs on the beginning of the animation loop.
///////////////////////////////////////////////////////////////////////////////
function setup() {
	createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    var canvasElement = document.getElementById('defaultCanvas0');
    canvasContext = canvas.getContext('2d');
}

///////////////////////////////////////////////////////////////////////////////
// Draw function that runs every frame of the animation loop.
///////////////////////////////////////////////////////////////////////////////
function draw() {
    if (grassBackground) {
        var grassImg = new Image();
        grassImg.src = 'img/grass.jpg';
        grassImg.onload = function () {
            for (var w = 0; w < canvas.width; w += grassImg.width) {
                for (var h = 0; h < canvas.height; h  += grassImg.height) {
                    canvasContext.drawImage(grassImg, w, h);
                }
            }
        }
    }
    else {
        background('#27692c');
    }

    // draws track
    canvasContext.beginPath();
    canvasContext.strokeStyle = '#111';
    canvasContext.lineWidth = 20;
    for (var i = 0; i < controlPoints.length; i++) {
        var p1 = i % controlPoints.length;
        var p2 = (i + 1) % controlPoints.length;
        x = (controlPoints[p1].x + controlPoints[p2].x) / 2;
        y = (controlPoints[p1].y + controlPoints[p2].y) / 2;
        canvasContext.quadraticCurveTo(
            controlPoints[p1].x,
            controlPoints[p1].y,
            x,
            y
        );
    }
    canvasContext.stroke();

    // draws white center lines
    if (showTrackLines) {
        canvasContext.beginPath();
        canvasContext.setLineDash([3, 6]);
        canvasContext.strokeStyle = '#bbb';
        canvasContext.lineWidth = 1;
        for (var i = 0; i < controlPoints.length; i++) {
            var p1 = i % controlPoints.length;
            var p2 = (i + 1) % controlPoints.length;
            x = (controlPoints[p1].x + controlPoints[p2].x) / 2;
            y = (controlPoints[p1].y + controlPoints[p2].y) / 2;
            canvasContext.quadraticCurveTo(
                controlPoints[p1].x,
                controlPoints[p1].y,
                x,
                y
            );
        }
        canvasContext.stroke();
    }

    // draw control points
    if (showControlPoints) {
        noStroke();
    	fill('#f00');
    	strokeWeight(5);
    	for (var i = 0; i < controlPoints.length; i++) {
    		rect(controlPoints[i].x, controlPoints[i].y, POINT_WIDTH, POINT_HEIGHT);
    	}
    }
}
