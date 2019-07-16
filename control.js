
// Store frame for motion functions
var previousFrame = null;
var paused = true;
var pauseOnGesture = false;
// Setup Leap loop with frame callback function
var controllerOptions = { enableGestures: true };

// to use HMD mode:
// controllerOptions.optimizeHMD = true;

var oldDirection = 's';
var bluetooth;

Leap.loop(controllerOptions, function (frame) {
    if (paused) {
        return; // Skip this update
    }



    function sendSignal(direction) {
        if (oldDirection !== direction) {
            console.log(direction);
            oldDirection = direction;
            let encoder = new TextEncoder('utf-8');
            let userDescription = encoder.encode(direction);
            bluetooth.writeValue(userDescription);
        }
    }



    // Display Frame object data
    var frameOutput = document.getElementById("frameData");

    var frameString = "Frame ID: " + frame.id + "<br />"
        + "Timestamp: " + frame.timestamp + " &micro;s<br />"
        + "Hands: " + frame.hands.length + "<br />"
        + "Fingers: " + frame.fingers.length + "<br />"
        + "Tools: " + frame.tools.length + "<br />"
        + "Gestures: " + frame.gestures.length + "<br />";

    // Frame motion factors
    if (previousFrame && previousFrame.valid) {
        var translation = frame.translation(previousFrame);
        frameString += "Translation: " + vectorToString(translation) + " mm <br />";

        var rotationAxis = frame.rotationAxis(previousFrame);
        var rotationAngle = frame.rotationAngle(previousFrame);
        frameString += "Rotation axis: " + vectorToString(rotationAxis, 2) + "<br />";
        frameString += "Rotation angle: " + rotationAngle.toFixed(2) + " radians<br />";

        var scaleFactor = frame.scaleFactor(previousFrame);
        frameString += "Scale factor: " + scaleFactor.toFixed(2) + "<br />";
    }
    frameOutput.innerHTML = "<div style='width:300px; float:left; padding:5px'>" + frameString + "</div>";

    // Display Hand object data
    var handOutput = document.getElementById("handData");
    var handString = "";
    if (frame.hands.length > 0) {
        for (var i = 0; i < frame.hands.length; i++) {
            var hand = frame.hands[i];

            handString += "<div style='width:300px; float:left; padding:5px'>";
            handString += "Hand ID: " + hand.id + "<br />";
            handString += "Type: " + hand.type + " hand" + "<br />";
            handString += "Direction: " + vectorToString(hand.direction, 2) + "<br />";
            handString += "Palm position: " + vectorToString(hand.palmPosition) + " mm<br />";
            handString += "Grab strength: " + hand.grabStrength + "<br />";
            handString += "Pinch strength: " + hand.pinchStrength + "<br />";
            handString += "Confidence: " + hand.confidence + "<br />";
            handString += "Arm direction: " + vectorToString(hand.arm.direction()) + "<br />";
            handString += "Arm center: " + vectorToString(hand.arm.center()) + "<br />";
            handString += "Arm up vector: " + vectorToString(hand.arm.basis[1]) + "<br />";

            if (hand.grabStrength > 0.8) {
                sendSignal('s');
            }
            else if (hand.palmPosition[0] <= -100.0) {
                sendSignal('l');
            }
            else if (hand.palmPosition[0] >= 100.0) {
                sendSignal('r');
            }
            else if (hand.palmPosition[2] >= 140.0) {
                sendSignal('b');
            }
            else if (hand.palmPosition[2] <= -100.0) {
                sendSignal('f');
            }




            // Hand motion factors
            if (previousFrame && previousFrame.valid) {
                var translation = hand.translation(previousFrame);
                handString += "Translation: " + vectorToString(translation) + " mm<br />";

                var rotationAxis = hand.rotationAxis(previousFrame, 2);
                var rotationAngle = hand.rotationAngle(previousFrame);
                handString += "Rotation axis: " + vectorToString(rotationAxis) + "<br />";
                handString += "Rotation angle: " + rotationAngle.toFixed(2) + " radians<br />";

                var scaleFactor = hand.scaleFactor(previousFrame);
                handString += "Scale factor: " + scaleFactor.toFixed(2) + "<br />";
            }

            // IDs of pointables associated with this hand
            if (hand.pointables.length > 0) {
                var fingerIds = [];
                for (var j = 0; j < hand.pointables.length; j++) {
                    var pointable = hand.pointables[j];
                    fingerIds.push(pointable.id);
                }
                if (fingerIds.length > 0) {
                    handString += "Fingers IDs: " + fingerIds.join(", ") + "<br />";
                }
            }

            handString += "</div>";
        }
    }
    else {
        handString += "No hands";
    }
    handOutput.innerHTML = handString;

    // Store frame for motion functions
    previousFrame = frame;
})




function vectorToString(vector, digits) {
    if (typeof digits === "undefined") {
        digits = 1;
    }
    return "(" + vector[0].toFixed(digits) + ", "
        + vector[1].toFixed(digits) + ", "
        + vector[2].toFixed(digits) + ")";
}

function togglePause() {
    paused = !paused;

    if (paused) {
        document.getElementById("pause").innerText = "Resume";
    } else {
        document.getElementById("pause").innerText = "Pause";
        if (navigator.bluetooth) {
            navigator.bluetooth.requestDevice({
                // filters: [...] <- Prefer filters to save energy & show relevant devices.
                acceptAllDevices: true,
                optionalServices: [0xFFE0]
            })
                .then(device => {

                    return device.gatt.connect();
                })
                .then(server => {

                    return server.getPrimaryService(0xFFE0);
                })
                .then(service => {
                    return service.getCharacteristic(0xFFE1);
                })
                .then(characteristic => {

                    bluetooth = characteristic;
                    return characteristic;

                })
                .catch(error => {

                    console.error('Argh! ' + error);
                });
        } else {
            console.error('Web Bluetooth API is not available.\n' +
                'Please make sure the "Experimental Web Platform features" flag is enabled.');
        }
    }

}

function pauseForGestures() {
    if (document.getElementById("pauseOnGesture").checked) {
        pauseOnGesture = true;
    } else {
        pauseOnGesture = false;
    }
}