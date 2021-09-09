class SketchController {

    constructor(sketch) {
        this.sk = sketch;
        this.mode = {
            isAnimate: false,
            isAlignTalk: false,
            isAllTalk: true,
            isIntro: true,
            isVideoPlay: false,
            isVideoShow: false
        }
        this.view3D = {
            isShowing: false,
            isTransitioning: false,
            zoom: -700,
            curZoom: 0,
            xPosTranslate: 500,
            yPosTranslate: 650,
            curXPos: 0,
            curYPos: 0,
            rotateX: this.sk.PI / 2.3,
            curRotateX: 0
        }
        this.curFloorPlanRotation = 0; // [0-3] 4 rotation modes none, 90, 180, 270
        this.animationCounter = 0; // counter to synchronize animation across all data
        this.bugTimeForVideoScrub = null; // Set in draw movement data and used to display correct video frame when scrubbing video
    }

    handleView3D() {
        this.view3D.isShowing = !this.view3D.isShowing;
        this.view3D.isTransitioning = true;
        if (this.view3D.isShowing) this.setRotateLeft(); // must rotate floor plan to make matching space-time view appear in both 2D and 3D
        else this.setRotateRight();
    }

    update3DTranslation() {
        if (this.view3D.isTransitioning) {
            if (this.view3D.isShowing) this.view3D.isTransitioning = this.transition3D();
            else this.view3D.isTransitioning = this.resetTranslation();
            this.update3DCanvas();
        } else {
            if (this.view3D.isShowing) this.update3DCanvas();
        }
    }

    translationComplete() {
        return this.view3D.isShowing || this.view3D.isTransitioning;
    }

    update3DCanvas() {
        this.sk.set3DCanvas(this.view3D.curXPos, this.view3D.curYPos, this.view3D.curZoom, this.view3D.curRotateX);
    }

    transition3D() {
        let isRunning = false;
        this.view3D.curZoom = this.view3D.zoom;
        if (this.view3D.curRotateX < this.view3D.rotateX) {
            this.view3D.curRotateX += .03;
            isRunning = true;
        }
        if (this.view3D.curXPos < this.view3D.xPosTranslate) {
            this.view3D.curXPos += 10;
            isRunning = true;
        }
        if (this.view3D.curYPos < this.view3D.yPosTranslate) {
            this.view3D.curYPos += 10;
            isRunning = true;
        }
        return isRunning;
    }

    resetTranslation() {
        this.view3D.curRotateX = 0;
        this.view3D.curXPos = 0;
        this.view3D.curYPos = 0;
        this.view3D.curZoom = 0;
        return false;
    }




    // ****** P5 HANDLERS ****** //
    updateLoop() {
        if (this.mode.isAnimate || this.mode.isVideoPlay || this.view3D.isTransitioning) this.sk.loop();
        else this.sk.noLoop();
    }

    startLoop() {
        this.sk.loop();
    }

    handleMousePressed() {
        if (this.testVideoToPlay()) this.playPauseMovie();
        else this.sk.gui.handleKeys(this.sk.core.paths, this.sk.core.speakerList);
    }

    handleMouseDragged() {
        if (!this.mode.isAnimate) this.sk.gui.handleTimeline();
    }

    handleMouseReleased() {
        this.sk.gui.handleResetTimelineLock();
    }

    // ****** UPDATE METHODS ****** //
    updateAnimationCounter() {
        if (this.mode.isAnimate) this.animationCounter = this.mapFromPixelToTotalTime(this.sk.gui.getCurTimelineSelectEnd());
        else this.animationCounter = this.mapFromPixelToTotalTime(this.sk.gui.getCurTimelineSelectStart());
        this.setIsAnimate(!this.mode.isAnimate);
    }

    updateAnimation() {
        if (this.mode.isAnimate) {
            const animationIncrementRateDivisor = 1000; // this divisor seems to work best
            const curTimeIntervalInSeconds = this.mapFromPixelToTotalTime(this.sk.gui.getCurTimelineSelectEnd()) - this.mapFromPixelToTotalTime(this.sk.gui.getCurTimelineSelectStart()); // Get amount of time in seconds currently displayed
            const animationIncrementValue = curTimeIntervalInSeconds / animationIncrementRateDivisor; // set increment value based on that value/divisor to keep constant sketchController.mode.isAnimate speed regardless of time interval selected
            if (this.animationCounter < this.mapFromPixelToTotalTime(this.sk.gui.getCurTimelineSelectEnd())) this.animationCounter += animationIncrementValue;
            else this.setIsAnimate(false);
        }
    }

    updateVideoDisplay() {
        if (this.mode.isVideoShow) {
            this.sk.core.updateVideoPosition(this.sk.mouseX, this.sk.mouseY);
            if (!this.mode.isVideoPlay) this.setVideoScrubbing();
        }
    }

    setVideoScrubbing() {
        if (this.mode.isAnimate) this.sk.core.updateVideoScrubAnimate(Math.floor(this.sk.map(this.bugTimeForVideoScrub, this.sk.gui.getTimelineStart(), this.sk.gui.getTimelineEnd(), this.mapFromPixelToVideoTime(this.sk.gui.getCurTimelineSelectStart()), this.mapFromPixelToVideoTime(this.sk.gui.getCurTimelineSelectEnd()))));
        else if (this.sk.gui.overSpaceTimeView(this.sk.mouseX, this.sk.mouseY)) this.sk.core.updateVideoScrub(Math.floor(this.mapFromPixelToVideoTime(this.mapFromPixelToSelectedTime(this.sk.mouseX))));
    }

    toggleVideoShowHide() {
        if (this.mode.isVideoShow) {
            this.sk.core.hideVideo();
            this.setIsVideoPlay(false);
            this.setIsVideoShow(false);
        } else {
            this.sk.core.showVideo();
            this.setIsVideoShow(true);
        }
    }

    playPauseMovie() {
        if (this.mode.isVideoPlay) {
            this.sk.core.pauseVideo();
            this.setIsVideoPlay(false);
        } else {
            this.sk.core.playVideo(this.mapFromPixelToVideoTime(this.mapFromPixelToSelectedTime(this.sk.mouseX)));
            this.setIsVideoPlay(true);
        }
    }

    // ****** DRAW HELPER METHODS ****** //
    /**
     * Returns properly scaled pixel values to GUI from data points
     * @param  {Movement Or Conversation Point} point
     * @param  {Integer} view
     */
    getScaledPos(point, view) {
        const timelineXPos = this.mapFromTotalToPixelTime(point.time);
        const selTimelineXPos = this.zzzNewMapFromSelectPixelToTimeline(timelineXPos);
        const [floorPlanXPos, floorPlanYPos] = this.getScaledXYPos(point.xPos, point.yPos);
        let viewXPos;
        // this would be changed to if 2D/3D...
        if (view === this.sk.PLAN) viewXPos = floorPlanXPos;
        else if (view === this.sk.SPACETIME) {
            if (this.view3D.isShowing === true) viewXPos = floorPlanXPos;
            else viewXPos = selTimelineXPos;
        } else viewXPos = null;

        let zPos;
        if (view === this.sk.PLAN) zPos = 0;
        else {
            if (this.view3D.isShowing) zPos = selTimelineXPos;
            else zPos = 0;
        }

        return {
            timelineXPos,
            selTimelineXPos,
            floorPlanXPos,
            floorPlanYPos,
            viewXPos,
            zPos
        };
    }

    // mapFromSelectPixelToTimeline(value) {
    //     return this.sk.map(value, this.sk.gui.getCurTimelineSelectStart(), this.sk.gui.getCurTimelineSelectEnd(), this.sk.gui.getTimelineStart(), this.sk.gui.getTimelineEnd());
    // }

    zzzNewMapFromSelectPixelToTimeline(value) {
        if (this.view3D.isShowing) return this.sk.map(value, this.sk.gui.getCurTimelineSelectStart(), this.sk.gui.getCurTimelineSelectEnd(), this.sk.gui.getTimelineStart() - 800, this.sk.gui.getTimelineEnd() - 1150);
        else return this.sk.map(value, this.sk.gui.getCurTimelineSelectStart(), this.sk.gui.getCurTimelineSelectEnd(), this.sk.gui.getTimelineStart(), this.sk.gui.getTimelineEnd());
    }

    mapFromTotalToPixelTime(value) {
        return this.sk.map(value, 0, this.sk.core.totalTimeInSeconds, this.sk.gui.getTimelineStart(), this.sk.gui.getTimelineEnd());
    }

    /**
     * Converts x/y pixel positions from data point to floor plan depending on floor plan rotation mode
     * @param  {Float} xPos
     * @param  {Float} yPos
     */
    getScaledXYPos(xPos, yPos) {
        let scaledXPos, scaledYPos;
        switch (this.getRotationMode()) {
            case 0:
                scaledXPos = xPos * this.sk.gui.floorPlanContainer.width / this.sk.core.inputFloorPlan.width;
                scaledYPos = yPos * this.sk.gui.floorPlanContainer.height / this.sk.core.inputFloorPlan.height;
                return [scaledXPos, scaledYPos];
            case 1:
                scaledXPos = this.sk.gui.floorPlanContainer.width - (yPos * this.sk.gui.floorPlanContainer.width / this.sk.core.inputFloorPlan.height);
                scaledYPos = xPos * this.sk.gui.floorPlanContainer.height / this.sk.core.inputFloorPlan.width;
                return [scaledXPos, scaledYPos];
            case 2:
                scaledXPos = this.sk.gui.floorPlanContainer.width - (xPos * this.sk.gui.floorPlanContainer.width / this.sk.core.inputFloorPlan.width);
                scaledYPos = this.sk.gui.floorPlanContainer.height - (yPos * this.sk.gui.floorPlanContainer.height / this.sk.core.inputFloorPlan.height);
                return [scaledXPos, scaledYPos];
            case 3:
                scaledXPos = yPos * this.sk.gui.floorPlanContainer.width / this.sk.core.inputFloorPlan.height;
                scaledYPos = this.sk.gui.floorPlanContainer.height - xPos * this.sk.gui.floorPlanContainer.height / this.sk.core.inputFloorPlan.width;
                return [scaledXPos, scaledYPos];
        }
    }

    /**
     * Organizes floor plan drawing methods with and without rotation
     */
    setFloorPlan() {
        switch (this.getRotationMode()) {
            case 0:
                this.sk.drawFloorPlan(this.sk.gui.floorPlanContainer.width, this.sk.gui.floorPlanContainer.height);
                break;
            case 1:
                this.sk.drawRotatedFloorPlan(this.sk.HALF_PI, this.sk.gui.floorPlanContainer.height, this.sk.gui.floorPlanContainer.width);
                break;
            case 2:
                this.sk.drawRotatedFloorPlan(this.sk.PI, this.sk.gui.floorPlanContainer.width, this.sk.gui.floorPlanContainer.height);
                break;
            case 3:
                this.sk.drawRotatedFloorPlan(-this.sk.HALF_PI, this.sk.gui.floorPlanContainer.height, this.sk.gui.floorPlanContainer.width);
                break;
        }
    }

    /**
     * Test if point is in user view
     * @param  {MovementPoint} curPoint
     */
    testPointIsShowing(curPoint) {
        return this.sk.gui.overTimelineAxis(curPoint.timelineXPos) && this.sk.gui.overFloorPlan(curPoint.floorPlanXPos, curPoint.floorPlanYPos) && this.testAnimation(curPoint.timelineXPos);
    }

    /**
     * @param  {Number/Float} value
     */
    testAnimation(value) {
        if (this.mode.isAnimate) return this.animationCounter > this.mapFromPixelToTotalTime(value);
        else return true;
    }

    testVideoToPlay() {
        return this.testVideoAndDivAreLoaded() && this.mode.isVideoShow && !this.mode.isAnimate && this.sk.gui.overSpaceTimeView(this.sk.mouseX, this.sk.mouseY);
    }

    testVideoAndDivAreLoaded() {
        return (this.sk.testData.dataIsLoaded(this.sk.core.videoPlayer) && this.sk.core.videoDivIsLoaded());
    }

    // Sets conversation rectangle scaling range (size of rectangles as timeline is rescaled)
    mapConversationRectRange() {
        return this.sk.map(this.sk.core.totalTimeInSeconds, 0, 3600, 10, 1, true); // map to inverse, values constrained between 10 and 1 (pixels)
    }

    // map to inverse of min/max to set rectWidth based on amount of pixel time selected
    mapRectInverse(rectMaxPixelWidth, rectMinPixelWidth) {
        return this.sk.map(this.sk.gui.getCurTimelineSelectEnd() - this.sk.gui.getCurTimelineSelectStart(), 0, this.sk.gui.getTimelineEnd() - this.sk.gui.getTimelineStart(), rectMaxPixelWidth, rectMinPixelWidth);
    }

    mapFromVideoToSelectedTime() {
        const timelinePos = this.mapFromTotalToPixelTime(this.sk.core.videoPlayer.getCurrentTime());
        return this.zzzNewMapFromSelectPixelToTimeline(timelinePos);
    }

    mapFromPixelToTotalTime(value) {
        return this.sk.map(value, this.sk.gui.getTimelineStart(), this.sk.gui.getTimelineEnd(), 0, this.sk.core.totalTimeInSeconds);
    }

    mapFromPixelToVideoTime(value) {
        return Math.floor(this.sk.map(value, this.sk.gui.getTimelineStart(), this.sk.gui.getTimelineEnd(), 0, Math.floor(this.sk.core.videoPlayer.getVideoDuration()))); // must floor vPos to prevent double finite error
    }

    mapFromPixelToSelectedTime(value) {
        return this.sk.map(value, this.sk.gui.getTimelineStart(), this.sk.gui.getTimelineEnd(), this.sk.gui.getCurTimelineSelectStart(), this.sk.gui.getCurTimelineSelectEnd());
    }

    setIsAnimate(value) {
        this.mode.isAnimate = value;
    }

    setIsAlignTalk(value) {
        this.mode.isAlignTalk = value;
    }

    setIsAllTalk(value) {
        this.mode.isAllTalk = value;
    }

    setIsIntro(value) {
        this.mode.isIntro = value;
    }

    setIsVideoPlay(value) {
        this.mode.isVideoPlay = value;
    }

    setIsVideoShow(value) {
        this.mode.isVideoShow = value;
    }

    getRotationMode() {
        return this.curFloorPlanRotation;
    }

    setRotateRight() {
        this.curFloorPlanRotation++;
        if (this.curFloorPlanRotation > 3) this.curFloorPlanRotation = 0;
    }

    setRotateLeft() {
        this.curFloorPlanRotation--;
        if (this.curFloorPlanRotation < 0) this.curFloorPlanRotation = 3;
    }
}