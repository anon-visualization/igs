// Super class with 2 sub-classes drawDataMovement and drawDataConversation
class DrawData {

    constructor() {}

    overTimeline(timeValue) {
        return timeValue >= currPixelTimeMin && timeValue <= currPixelTimeMax;
    }

    // Test if data is showing on floor plan
    overFloorPlan(xPos, yPos) {
        return (xPos >= 0 && xPos <= displayFloorPlanWidth) && (yPos >= 0 && yPos <= displayFloorPlanHeight);
    }

    overCursor(xPos, yPos) {
        return overCircle(xPos, yPos, floorPlanSelectorSize);
    }

    // Return true if not over floor plan, if over floor plan test if over cursor
    testOverCursor(xPos, yPos) {
        if (overRect(0, 0, displayFloorPlanWidth, displayFloorPlanHeight)) return overCircle(xPos, yPos, floorPlanSelectorSize);
        else return true;
    }

    // If animation on, returns true if time is less than counter. Returns true if animation is off.
    testAnimation(timeValue) {
        if (animation) {
            let reMapTime = map(timeValue, timelineStart, timelineEnd, 0, totalTimeInSeconds);
            return animationCounter > reMapTime;
        } else return true;
    }
}

class DrawDataMovement extends DrawData {

    constructor() {
        super();
        this.bugXPos = -1;
        this.bugYPos = -1;
        this.bugTimePos = -1;
        this.bugSize = width / 50;
        this.bugSpacingComparison = timelineLength;
    }

    setData(path) {
        this.resetBug(); // always reset bug values
        // if overMap draw selection of movement and gray scale the rest
        if (overRect(0, 0, displayFloorPlanWidth, displayFloorPlanHeight)) {
            this.drawWithCursorHighlight(PLAN, path.movement, path.color);
            this.drawWithCursorHighlight(SPACETIME, path.movement, path.color);
        } else {
            this.draw(PLAN, path.movement, path.color);
            this.draw(SPACETIME, path.movement, path.color);
        }
        if (this.bugXPos != -1) this.drawBug(path.color); // if selected, draw bug
    }



    // // Main draw method to draw movement paths, also sets bug values
    // draw(view, points, shade) {
    //     strokeWeight(pathWeight);
    //     stroke(shade);
    //     noFill(); // important for curve drawing
    //     beginShape();
    //     for (let i = 0; i < points.length; i++) {
    //         let point = points[i];
    //         let pixelTime = map(point.time, 0, totalTimeInSeconds, timelineStart, timelineEnd);
    //         let scaledTime = map(pixelTime, currPixelTimeMin, currPixelTimeMax, timelineStart, timelineEnd);
    //         let scaledXPos = point.xPos * displayFloorPlanWidth / inputFloorPlanPixelWidth; // scale to floor plan image file
    //         let scaledYPos = point.yPos * displayFloorPlanHeight / inputFloorPlanPixelHeight; // scale to floor plan image file
    //         if (super.overTimeline(pixelTime) && super.overFloorPlan(scaledXPos, scaledYPos) && super.testAnimation(pixelTime)) {
    //             if (view == PLAN) curveVertex(scaledXPos, scaledYPos);
    //             else if (view == SPACETIME) {
    //                 curveVertex(scaledTime, scaledYPos);
    //                 this.testPointForBug(scaledTime, scaledXPos, scaledYPos);
    //             }
    //         }
    //     }
    //     endShape();
    // }

    // Main draw method to draw movement paths, also sets bug values
    draw(view, points, shade) {
        strokeWeight(pathWeight);
        stroke(shade);
        noFill(); // important for curve drawing
        let drawStopPointMode = false;
        beginShape();
        for (let i = 0; i < points.length; i++) {
            let pixelTime = map(points[i].time, 0, totalTimeInSeconds, timelineStart, timelineEnd);
            let scaledTime = map(pixelTime, currPixelTimeMin, currPixelTimeMax, timelineStart, timelineEnd);
            let scaledXPos = points[i].xPos * displayFloorPlanWidth / inputFloorPlanPixelWidth; // scale to floor plan image file
            let scaledYPos = points[i].yPos * displayFloorPlanHeight / inputFloorPlanPixelHeight; // scale to floor plan image file   
            if (super.overTimeline(pixelTime) && super.overFloorPlan(scaledXPos, scaledYPos) && super.testAnimation(pixelTime)) {
                let xPosToDraw;
                if (view == PLAN) xPosToDraw = scaledXPos;
                else if (view == SPACETIME) xPosToDraw = scaledTime;
                if (i !== 0 && scaledXPos === (points[i - 1].xPos * displayFloorPlanWidth / inputFloorPlanPixelWidth) && scaledYPos === (points[i - 1].yPos * displayFloorPlanHeight / inputFloorPlanPixelHeight)) {

                    let priorPixelTime = map(points[i - 1].time, 0, totalTimeInSeconds, timelineStart, timelineEnd);
                    let priorScaledTime = map(priorPixelTime, currPixelTimeMin, currPixelTimeMax, timelineStart, timelineEnd);
                    let priorScaledXPos = points[i - 1].xPos * displayFloorPlanWidth / inputFloorPlanPixelWidth; // scale to floor plan image file
                    let priorSscaledYPos = points[i - 1].yPos * displayFloorPlanHeight / inputFloorPlanPixelHeight; // scale to floor plan image file
                    let priorXPosToDraw;
                    if (view == PLAN) priorXPosToDraw = priorScaledXPos;
                    else if (view == SPACETIME) priorXPosToDraw = priorScaledTime;

                    if (drawStopPointMode) { // if already drawing in stop mode, continue it
                        curveVertex(xPosToDraw, scaledYPos);
                        if (view == SPACETIME) this.testPointForBug(scaledTime, scaledXPos, scaledYPos);
                    } else { // if not in drawing stop mode, begin it
                        curveVertex(priorXPosToDraw, priorSscaledYPos); // draw cur point twice to mark end point
                        curveVertex(priorXPosToDraw, priorSscaledYPos);
                        endShape(); // then end shape
                        strokeWeight(pathWeight * 2); // set large strokeWeight for not moving/stopped
                        //stroke(0);
                        beginShape(); // begin new shape
                        curveVertex(priorXPosToDraw, priorSscaledYPos); // draw cur point twice to mark starting point
                        curveVertex(priorXPosToDraw, priorSscaledYPos);
                        if (view == SPACETIME) this.testPointForBug(xPosToDraw, scaledXPos, scaledYPos);
                        drawStopPointMode = true;
                    }
                } else {
                    if (drawStopPointMode) { // if drawing in stop mode, end it
                        curveVertex(xPosToDraw, scaledYPos); // draw cur point twice to mark end point
                        curveVertex(xPosToDraw, scaledYPos);
                        endShape(); // then end shape
                        strokeWeight(pathWeight); // set small strokeWeight for moving
                        //stroke(shade);
                        beginShape(); // begin new shape
                        curveVertex(xPosToDraw, scaledYPos); // draw cur point twice to mark starting point
                        curveVertex(xPosToDraw, scaledYPos);
                        if (view == SPACETIME) this.testPointForBug(xPosToDraw, scaledXPos, scaledYPos);
                        drawStopPointMode = false;
                    } else {
                        curveVertex(xPosToDraw, scaledYPos);
                        if (view == SPACETIME) this.testPointForBug(xPosToDraw, scaledXPos, scaledYPos);
                    }
                }
            }
        }
        endShape();
    }



    // Main draw method to draw movement paths, also sets bug values
    drawWithCursorHighlight(view, points, shade) {
        strokeWeight(pathWeight);
        stroke(colorGray);
        noFill(); // important for curve drawing
        let drawOverCursorPointMode = false;
        beginShape();
        for (let i = 0; i < points.length; i++) {
            let point = points[i];
            let pixelTime = map(point.time, 0, totalTimeInSeconds, timelineStart, timelineEnd);
            let scaledTime = map(pixelTime, currPixelTimeMin, currPixelTimeMax, timelineStart, timelineEnd);
            let scaledXPos = point.xPos * displayFloorPlanWidth / inputFloorPlanPixelWidth; // scale to floor plan image file
            let scaledYPos = point.yPos * displayFloorPlanHeight / inputFloorPlanPixelHeight; // scale to floor plan image file
            if (super.overTimeline(pixelTime) && super.overFloorPlan(scaledXPos, scaledYPos) && super.testAnimation(pixelTime)) {
                let xPosToDraw;
                if (view == PLAN) xPosToDraw = scaledXPos;
                else if (view == SPACETIME) xPosToDraw = scaledTime;
                if (i !== 0 && super.overCursor(scaledXPos, scaledYPos)) {
                    if (drawOverCursorPointMode) { // if already drawing in stop mode, continue it
                        curveVertex(xPosToDraw, scaledYPos);
                        if (view == SPACETIME) this.testPointForBug(scaledTime, scaledXPos, scaledYPos);
                    } else { // if not in drawing stop mode, begin it
                        curveVertex(xPosToDraw, scaledYPos); // draw cur point twice to mark end point
                        curveVertex(xPosToDraw, scaledYPos);
                        endShape(); // then end shape
                        strokeWeight(pathWeight * 2); // set large strokeWeight for not moving/stopped
                        stroke(shade);
                        beginShape(); // begin new shape
                        curveVertex(xPosToDraw, scaledYPos); // draw cur point twice to mark starting point
                        curveVertex(xPosToDraw, scaledYPos);
                        if (view == SPACETIME) this.testPointForBug(xPosToDraw, scaledXPos, scaledYPos);
                        drawOverCursorPointMode = true;
                    }
                } else {
                    if (drawOverCursorPointMode) { // if drawing in stop mode, end it
                        curveVertex(xPosToDraw, scaledYPos); // draw cur point twice to mark end point
                        curveVertex(xPosToDraw, scaledYPos);
                        endShape(); // then end shape
                        strokeWeight(pathWeight); // set small strokeWeight for moving
                        stroke(colorGray);
                        beginShape(); // begin new shape
                        curveVertex(xPosToDraw, scaledYPos); // draw cur point twice to mark starting point
                        curveVertex(xPosToDraw, scaledYPos);
                        if (view == SPACETIME) this.testPointForBug(xPosToDraw, scaledXPos, scaledYPos);
                        drawOverCursorPointMode = false;
                    } else {
                        curveVertex(xPosToDraw, scaledYPos);
                        if (view == SPACETIME) this.testPointForBug(xPosToDraw, scaledXPos, scaledYPos);
                    }
                }
            }
        }
        endShape();
    }

    /**
     * Tests for 3 modes: animation, video and mouse over space-time view
     * For current mode, tests parameter values to set/record bug correctly
     * @param  {Number/Float} scaledTimeToTest
     * @param  {Number/Float} xPos
     * @param  {Number/Float} yPos
     */
    testPointForBug(scaledTimeToTest, xPos, yPos) {
        if (animation) this.recordBug(scaledTimeToTest, xPos, yPos); // always return true to set last/most recent point as the bug
        else if (videoIsPlaying) {
            // Separate this test out from 3 mode tests to make sure if this is not true know other mode tests are run when video is playing
            if (this.testVideoForBugPoint(scaledTimeToTest)) this.recordBug(scaledTimeToTest, xPos, yPos);
        } else if (overRect(timelineStart, 0, timelineLength, timelineHeight) && this.testMouseForBugPoint(scaledTimeToTest)) this.recordBug(mouseX, xPos, yPos);
        return false;
    }

    testVideoForBugPoint(scaledTimeToTest) {
        const videoX = map(videoPlayer.getCurrentTime(), 0, totalTimeInSeconds, timelineStart, timelineEnd);
        const scaledVideoX = map(videoX, currPixelTimeMin, currPixelTimeMax, timelineStart, timelineEnd);
        if (scaledVideoX >= scaledTimeToTest - this.bugSpacingComparison && scaledVideoX <= scaledTimeToTest + this.bugSpacingComparison) {
            this.bugSpacingComparison = Math.abs(scaledVideoX - scaledTimeToTest); // 
            return true;
        } else return false;
    }

    testMouseForBugPoint(scaledTimeToTest) {
        if (mouseX >= scaledTimeToTest - this.bugSpacingComparison && mouseX <= scaledTimeToTest + this.bugSpacingComparison) {
            this.bugSpacingComparison = Math.abs(mouseX - scaledTimeToTest);
            return true;
        } else return false;
    }

    resetBug() {
        this.bugXPos = -1;
        this.bugYPos = -1;
        this.bugTimePos = -1;
        this.bugSpacingComparison = timelineLength;
    }
    recordBug(timePos, xPos, yPos) {
        this.bugXPos = xPos;
        this.bugYPos = yPos;
        this.bugTimePos = timePos;
        bugTimePosForVideoScrubbing = timePos;
    }

    drawBug(shade) {
        stroke(0);
        strokeWeight(5);
        fill(shade);
        ellipse(this.bugXPos, this.bugYPos, this.bugSize, this.bugSize);
        ellipse(this.bugTimePos, this.bugYPos, this.bugSize, this.bugSize);
    }

    drawSlicer() {
        fill(0);
        stroke(0);
        strokeWeight(2);
        line(mouseX, 0, mouseX, timelineHeight);
    }
}

class DrawDataConversation extends DrawData {

    constructor() {
        super();
        this.conversationIsSelected = false;
        this.conversationToDraw = 0; //stores the Point_Conversation object
        this.view = 0
    }

    setData(path) {
        this.setRects(path.conversation, path.name); // if path has conversation
    }

    setConversationBubble() {
        if (this.conversationIsSelected) this.drawTextBox(); // done last to be overlaid on top
    }

    numOfPaths() {
        let numOfPaths = 0; // determine how many paths are being drawn
        for (let i = 0; i < paths.length; i++) {
            let path = paths[i];
            if (path.show == true) numOfPaths++;
        }
        return numOfPaths;
    }

    // Test if point is showing and send to draw Rect depending on conversation mode
    setRects(points, pathName) {
        for (let i = 0; i < points.length; i++) {
            let point = points[i];
            let pixelTime = map(point.time, 0, totalTimeInSeconds, timelineStart, timelineEnd);
            let scaledXPos = point.xPos * displayFloorPlanWidth / inputFloorPlanPixelWidth; // scale to floor plan image file
            let scaledYPos = point.yPos * displayFloorPlanHeight / inputFloorPlanPixelHeight; // scale to floor plan image file
            if (super.overTimeline(pixelTime) && super.overFloorPlan(scaledXPos, scaledYPos) && super.testAnimation(pixelTime) && super.testOverCursor(scaledXPos, scaledYPos)) {
                let curSpeaker = this.getSpeakerObject(points[i].speaker); // get speaker object equivalent to character
                if (curSpeaker.show) {
                    if (allConversation) this.drawRects(point, curSpeaker.color); // draws all rects
                    else {
                        if (curSpeaker.name === pathName) this.drawRects(point, curSpeaker.color); // draws rects only for speaker matching path
                    }
                }
            }
        }
    }

    drawRects(point, curColor) {
        noStroke(); // reset if setDrawText is called previously in loop
        textFont(font_Lato, keyTextSize);
        textSize(1); // determines how many pixels a string is which corresponds to vertical height of rectangle
        let pixelTime = map(point.time, 0, totalTimeInSeconds, timelineStart, timelineEnd);
        let scaledTime = map(pixelTime, currPixelTimeMin, currPixelTimeMax, timelineStart, timelineEnd);
        let minRectHeight = 3; // for really short conversation turns set a minimum        
        let rectWidthMin = map(totalTimeInSeconds, 0, 3600, 10, 1, true); // map to inverse, values constrained between 10 and 1 (pixels)
        let rectWidthMax = 10;
        // map to inverse of min/max to set rectWidth based on amount of pixel time selected
        let rectWidth = map(currPixelTimeMax - currPixelTimeMin, 0, timelineLength, rectWidthMax, rectWidthMin);
        let rectLength = textWidth(point.talkTurn);
        if (rectLength < minRectHeight) rectLength = minRectHeight; // set small strings to minimum
        let xPos = point.xPos * displayFloorPlanWidth / inputFloorPlanPixelWidth; // scale to floor plan image file
        let yPos;
        if (conversationPositionTop) yPos = 0; // if conversation turn positioning is at top of screen
        else yPos = point.yPos * displayFloorPlanHeight / inputFloorPlanPixelHeight - rectLength;
        // setText sets stroke/strokeWeight to highlight rect if selected
        if (overRect(xPos, yPos, rectWidth, rectLength)) this.setText(point, PLAN); // if over plan
        else if (overRect(scaledTime, yPos, rectWidth, rectLength)) this.setText(point, SPACETIME); // if over spacetime
        fill(curColor); // Set color
        rect(xPos, yPos, rectWidth, rectLength); // Plan
        rect(scaledTime, yPos, rectWidth, rectLength); // Spacetime
    }

    // Returns speaker object based on string/character
    getSpeakerObject(s) {
        for (let i = 0; i < speakerList.length; i++) {
            if (speakerList[i].name === s) return speakerList[i];
        }
        return null; // Update with error handling here
    }

    setText(num, view) {
        this.conversationIsSelected = true;
        this.conversationToDraw = num;
        this.view = view;
        stroke(0);
        strokeWeight(4);
    }

    drawTextBox() {

        let textBoxWidth = width / 3; // width of text and textbox drawn
        let textSpacing = width / 57; // textbox leading
        let boxSpacing = width / 141; // general textBox spacing variable
        let boxDistFromRect = width / 28.2; // distance from text rectangle of textbox

        textFont(font_Lato, keyTextSize);
        textLeading(textSpacing);
        let point = this.conversationToDraw;
        let pixelTime = map(point.time, 0, totalTimeInSeconds, timelineStart, timelineEnd);
        let scaledTime = map(pixelTime, currPixelTimeMin, currPixelTimeMax, timelineStart, timelineEnd);
        let textBoxHeight = textSpacing * (ceil(textWidth(point.talkTurn) / textBoxWidth)); // lines of talk in a text box rounded up
        let xPos; // set xPos, constrain prevents drawing off screen
        if (this.view == PLAN) xPos = constrain((point.xPos * displayFloorPlanWidth / inputFloorPlanPixelWidth) - textBoxWidth / 2, boxSpacing, width - textBoxWidth - boxSpacing);
        else xPos = constrain(scaledTime - textBoxWidth / 2, 0, width - textBoxWidth - boxSpacing);
        let yPos, yDif;
        if (mouseY < height / 2) { //if top half of screen, text box below rectangle
            yPos = mouseY + boxDistFromRect;
            yDif = -boxSpacing;
        } else { //if bottom half of screen, text box above rectangle
            yPos = mouseY - boxDistFromRect - textBoxHeight;
            yDif = textBoxHeight + boxSpacing;
        }
        // textbox
        stroke(0); //set color to black
        strokeWeight(1);
        fill(255, 200); // transparency for textbox
        rect(xPos - boxSpacing, yPos - boxSpacing, textBoxWidth + 2 * boxSpacing, textBoxHeight + 2 * boxSpacing);
        fill(0);
        text(point.speaker + ": " + point.talkTurn, xPos, yPos, textBoxWidth, textBoxHeight); // text
        // conversation bubble
        stroke(255);
        strokeWeight(2);
        line(mouseX - boxDistFromRect, yPos + yDif, mouseX - boxDistFromRect / 2, yPos + yDif);
        stroke(0);
        strokeWeight(1);
        line(mouseX, mouseY, mouseX - boxDistFromRect, yPos + yDif);
        line(mouseX, mouseY, mouseX - boxDistFromRect / 2, yPos + yDif);
    }
}