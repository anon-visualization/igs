/**
 * This class holds different tests and helper methods used in draw movement and conversation classes
 * It centralizes decisions about what points to show and not show and is coupled with the sketchController/gui classes
 */
class TestPoint {

    constructor(sketch) {
        this.sk = sketch;
    }

    isShowingInGUI(pixelTime) {
        return this.sk.gui.timelinePanel.overAxis(pixelTime) && this.isShowingInAnimation(pixelTime);
    }

    isShowingInAnimation(value) {
        if (this.sk.sketchController.getIsAnimate()) return this.sk.sketchController.animationCounter > this.sk.sketchController.mapPixelTimeToTotalTime(value);
        else return true;
    }

    /**
     * This method tests if a point is showing for all selected codes from codeList
     * IMPLEMENTATION: Iterate through core codeList and return false if: for any of codes that are true in codeList a code at curPoint is false 
     * @param  {MovementPoint} point
     */
    isShowingInCodeList(codesArray) {
        if (this.sk.arrayIsLoaded(this.sk.core.codeList)) {
            for (let j = 0; j < this.sk.core.codeList.length; j++) {
                if (this.sk.core.codeList[j].isShowing) {
                    if (codesArray[j]) continue;
                    else return false;
                }
            }
        }
        return true;
    }

    /**
     * Returns scaled pixel values for a point to graphical display
     * IMPORTANT: currently view parameter can be either one of 2 constants or "null" for conversation drawing
     * @param  {Movement Or Conversation Point} point
     * @param  {Integer} view
     */
    getSharedPosValues(point) {
        const timelineXPos = this.sk.sketchController.mapTotalTimeToPixelTime(point.time);
        const selTimelineXPos = this.sk.sketchController.mapSelectTimeToPixelTime(timelineXPos);
        const [floorPlanXPos, floorPlanYPos] = this.sk.sketchController.handleRotation.getScaledXYPos(point.xPos, point.yPos, this.sk.gui.fpContainer.getContainer(), this.sk.inputFloorPlan.getParams());
        return {
            timelineXPos,
            selTimelineXPos,
            floorPlanXPos,
            floorPlanYPos,
        };
    }

    // ***** DRAW MOVEMENT TESTS ***** //
    /**
     * @param  {Integer} view
     * @param  {MovementPoint} curPoint
     */
    isPlanViewAndStopped(view, pointIsStopped) {
        return (view === this.sk.PLAN && pointIsStopped && this.sk.sketchController.getCurSelectTab() !== 3);
    }

    /**
     * Controls fat line drawing/segmentation
     * @param  {Number} xPos, yPos
     * @param  {boolean} pointIsStopped
     */
    selectModeForFatLine(xPos, yPos, pointIsStopped) {
        switch (this.sk.sketchController.getCurSelectTab()) {
            case 1:
                return this.sk.gui.fpContainer.overCursor(xPos, yPos);
            case 2:
                return this.sk.gui.fpContainer.overSlicer(xPos, yPos);
            default:
                return pointIsStopped; // this always returns false for floorplan view
        }
    }

    selectModeForStrokeWeights() {
        switch (this.sk.sketchController.getCurSelectTab()) {
            case 3:
                return [1, 0];
            case 4:
                return [0, 9];
            default:
                return [1, 9];
        }
    }

    // ***** DRAW CONVERSATION TESTS ***** //

    /**
     * 
     * @param  {String} talkTurn
     */
    isTalkTurnSelected(talkTurn) {
        const wordToSearch = this.sk.sketchController.getWordToSearch();
        if (!wordToSearch) return true; // Always return true if empty/no value
        else {
            const escape = wordToSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
            if (wordToSearch.length === 1) return new RegExp(escape, "i").test(talkTurn); // case insensitive regex test
            else return new RegExp('\\b' + escape + '\\b', "i").test(talkTurn); // \\b for whole word test
        }
    }

    /**
     * Adjusts Y positioning of conversation rectangles correctly for align and 3 D views
     */
    getConversationAdjustYPos(floorPlanYPos, rectLength) {
        if (this.sk.sketchController.mode.isAlignTalk) {
            if (this.sk.sketchController.handle3D.getIsShowing()) return this.sk.gui.fpContainer.getContainer().height;
            else return 0;
        } else if (this.sk.sketchController.handle3D.getIsShowing()) return floorPlanYPos;
        else return floorPlanYPos - rectLength;
    }

    /**
     * Controls conversation drawing based on selectMode
     * @param  {Number} xPos, yPos
     * @param  {boolean} pointIsStopped
     */
    selectModeForConversation(xPos, yPos, isStopped) {
        switch (this.sk.sketchController.getCurSelectTab()) {
            case 0:
                return true;
            case 1:
                return this.sk.gui.fpContainer.overCursor(xPos, yPos);
            case 2:
                return this.sk.gui.fpContainer.overSlicer(xPos, yPos);
            case 3:
                return !isStopped;
            case 4:
                return isStopped;
        }
    }
}