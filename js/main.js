/*
CREDITS/LICENSE INFORMATION: 
This software is written in JavaScript and p5.js and uses YouTube and Kaltura Video Player APIs and the PapaParse library by Matt Holt for CSV file processing. 
This software is licensed under the GNU General Public License Version 2.0. 
See the GNU General Public License included with this software for more details. 
Classroom discussion example data is used with special permission from Mathematics Teaching and Learning to Teach (MTLT), 
University of Michigan. (2010). Sean Numbers-Ofala. Classroom science lesson data is made possible by the researchers 
and teachers who created The Third International Mathematics and Science Study (TIMSS) 1999 Video Study. 
IGS software was originally developed by Ben Rydal Shapiro at Vanderbilt University 
as part of his dissertation titled Interaction Geography & the Learning Sciences. 
Copyright (C) 2018 Ben Rydal Shapiro, and contributors. 
To reference or read more about this work please see: 
https://etd.library.vanderbilt.edu/available/etd-03212018-140140/unrestricted/Shapiro_Dissertation.pdf
*/

let core;
let exampleData;
let parseData;
let processData;
let testData;
let keys;
let handlers;
let videoPlayer; // Object to interact with platform specific set of video player methods
let movie; // Div to hold the videoPlayer object

// CONSTANTS
const movementHeaders = ['time', 'x', 'y']; // String array indicating movement movement file headers, data in each column should be of type number or it won't process
const conversationHeaders = ['time', 'speaker', 'talk']; // String array indicating conversation file headers, data in time column shout be of type number, speaker column should be of type String, talk column should be not null or undefined
const PLAN = 0; // Number constants indicating core.floorPlan or space-time drawing modes
const SPACETIME = 1;
const NO_DATA = -1;
const SELPADDING = 20;
const introMSG = "INTERACTION GEOGRAPHY SLICER (IGS)\n\nby Ben Rydal Shapiro & contributors\nbuilt with p5.js & JavaScript\n\nHi There! This is a tool to visualize movement, conversation, and video data over space and time. Data are displayed over a floor plan view (left) and a space-time view (right), where the vertical axis corresponds to the vertical dimension of the floor plan. Use the top menu to visualize different sample datasets or upload your own data. Hover over the floor plan and use the timeline to selectively study displayed data. Use the bottom buttons to animate data, visualize conversation in different ways, and interact with video data by clicking the timeline to play & pause video. For more information see: benrydal.com/software/igs";
const buttons = ["Animate", "Align Talk", "All Talk", "Video", "How to Use"];
// 12 Class Paired color scheme: (Dark) purple, orange, green, blue, red, yellow, brown, (Light) lPurple, lOrange, lGreen, lBlue, lRed
const colorList = ['#6a3d9a', '#ff7f00', '#33a02c', '#1f78b4', '#e31a1c', '#ffff99', '#b15928', '#cab2d6', '#fdbf6f', '#b2df8a', '#a6cee3', '#fb9a99'];
let font_PlayfairReg, font_PlayfairItalic, font_Lato;

/**
 * Optional P5.js method, here used to preload fonts
 */
function preload() {
    font_PlayfairReg = loadFont("data/fonts/PlayfairDisplay-Regular.ttf");
    font_PlayfairItalic = loadFont("data/fonts/PlayfairDisplay-Italic.ttf");
    font_Lato = loadFont("data/fonts/Lato-Light.ttf");
}

/**
 * Required P5.js method, here used to setup GUI
 */
function setup() {
    canvas = createCanvas(window.innerWidth, window.innerHeight, P2D);
    frameRate(30);
    core = new Core();
    parseData = new ParseData();
    exampleData = new ExampleData();
    processData = new ProcessData();
    testData = new TestData();
    keys = new Keys();
    handlers = new Handlers();
    textAlign(LEFT, TOP);
    textFont(font_Lato, keys.keyTextSize);
}
/**
 * Always draws background and keys. Organizes what data is drawing if it is loaded/not undefined.
 * NOTE: Each conditional tests if particular data structure is loaded (core.floorPlan, core.paths[], core.speakerList[], videoPlayer)
 * NOTE: Conversation can never be drawn unless movement has been loaded (core.paths[])
 * NOTE: Movement can be drawn if conversation has not been loaded
 */
function draw() {
    background(255);
    if (testData.dataIsLoaded(core.floorPlan)) image(core.floorPlan, 0, 0, keys.displayFloorPlanWidth, keys.displayFloorPlanHeight);
    if (testData.dataIsLoaded(core.paths) && testData.dataIsLoaded(core.speakerList)) setMovementAndConversationData();
    else if (testData.dataIsLoaded(core.paths)) setMovementData();
    if (testData.dataIsLoaded(videoPlayer) && core.isModeVideoShowing && (mouseX !== pmouseX || mouseY !== pmouseY)) {
        if (!core.isModeVideoPlaying) setVideoScrubbing();
        select('#moviePlayer').position(mouseX - videoPlayer.videoWidth, mouseY - videoPlayer.videoHeight);
    }
    keys.drawKeys();
}

/**
 * Organizes drawing methods for movement and conversation drawData classes
 * Also organizes drawing of slicer line, conversation bubble if selected by user, and updating core.isModeAnimate
 */
function setMovementAndConversationData() {
    let drawConversationData = new DrawDataConversation();
    let drawMovementData = new DrawDataMovement();
    for (let i = 0; i < core.paths.length; i++) {
        if (core.paths[i].show) {
            drawConversationData.setData(core.paths[i]);
            drawMovementData.setData(core.paths[i]); // draw after conversation so bug displays on top
        }
    }
    if (overRect(keys.timelineStart, 0, keys.timelineLength, keys.timelineHeight)) drawMovementData.drawSlicer(); // draw slicer line after calculating all movement
    drawConversationData.setConversationBubble(); // draw conversation text last so it displays on top
    if (core.isModeAnimate) setUpAnimation();
}

/**
 * Organizes drawing methods for movement drawData class only
 * Also organizes drawing of slicer line and updating core.isModeAnimate
 */
function setMovementData() {
    let drawMovementData = new DrawDataMovement();
    for (let i = 0; i < core.paths.length; i++) {
        if (core.paths[i].show) drawMovementData.setData(core.paths[i]); // draw after conversation so bug displays on top
    }
    if (overRect(keys.timelineStart, 0, keys.timelineLength, keys.timelineHeight)) drawMovementData.drawSlicer(); // draw slicer line after calculating all movement
    if (core.isModeAnimate) setUpAnimation();
}

/**
 * Updates global core.isModeAnimate counter to control core.isModeAnimate or sets core.isModeAnimate to false if core.isModeAnimate complete
 */
function setUpAnimation() {
    let animationIncrementRateDivisor = 1000; // this seems to work best
    // Get amount of time in seconds currently displayed
    let curTimeIntervalInSeconds = map(keys.curPixelTimeMax, keys.timelineStart, keys.timelineEnd, 0, core.totalTimeInSeconds) - map(keys.curPixelTimeMin, keys.timelineStart, keys.timelineEnd, 0, core.totalTimeInSeconds);
    // set increment value based on that value/divisor to keep constant core.isModeAnimate speed regardless of time interval selected
    let animationIncrementValue = curTimeIntervalInSeconds / animationIncrementRateDivisor;
    if (core.animationCounter < map(keys.curPixelTimeMax, keys.timelineStart, keys.timelineEnd, 0, core.totalTimeInSeconds)) core.animationCounter += animationIncrementValue; // updates core.isModeAnimate
    else core.isModeAnimate = false;
}

/**
 * Updates time selected in video depending on mouse position or core.isModeAnimate over timeline
 */
function setVideoScrubbing() {
    if (core.isModeAnimate) {
        let startValue = map(keys.curPixelTimeMin, keys.timelineStart, keys.timelineEnd, 0, Math.floor(videoPlayer.getVideoDuration())); // remap starting point to seek for video
        let endValue = map(keys.curPixelTimeMax, keys.timelineStart, keys.timelineEnd, 0, Math.floor(videoPlayer.getVideoDuration())); // remap starting point to seek for video
        let vPos = Math.floor(map(core.bugTimePosForVideoScrubbing, keys.timelineStart, keys.timelineEnd, startValue, endValue));
        videoPlayer.seekTo(vPos);
    } else if (overRect(keys.timelineStart, 0, keys.timelineEnd, keys.timelineHeight)) {
        let mPos = map(mouseX, keys.timelineStart, keys.timelineEnd, keys.curPixelTimeMin, keys.curPixelTimeMax); // first map mouse to selected time values in GUI
        // must floor vPos to prevent double finite error
        let vPos = Math.floor(map(mPos, keys.timelineStart, keys.timelineEnd, 0, Math.floor(videoPlayer.getVideoDuration())));
        videoPlayer.seekTo(vPos);
        videoPlayer.pause(); // Add to prevent accidental video playing that seems to occur
    }
}

/**
 * Organizes mousePressed method calls for video, movement/conversation and interaction buttons and path/speaker keys
 */
function mousePressed() {
    handlers.handleMousePressed();
}

function mouseDragged() {
    handlers.handleMouseDragged();
}

function mouseReleased() {
    handlers.handleMouseReleased();
}

function overCircle(x, y, diameter) {
    const disX = x - mouseX;
    const disY = y - mouseY;
    return sqrt(sq(disX) + sq(disY)) < diameter / 2;
}

// Tests if over rectangle with x, y, and width/height
function overRect(x, y, boxWidth, boxHeight) {
    return mouseX >= x && mouseX <= x + boxWidth && mouseY >= y && mouseY <= y + boxHeight;
}