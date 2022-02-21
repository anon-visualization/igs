class GUI {

    constructor(sketch) {
        this.sk = sketch;
        this.timelinePanel = new TimelinePanel(this.sk);
        this.fpContainer = new FloorPlanContainer(this.sk, this.timelinePanel.getStart(), this.timelinePanel.getEnd(), this.timelinePanel.getTop());
        this.highlight = new Highlight(this.sk);
    }

    // TODO: pass params
    updateGUI(is3DMode, curSelectTab) {
        this.timelinePanel.draw();
        this.timelinePanel.updateSlicer(is3DMode);
        this.fpContainer.updateSelectors(curSelectTab);
        if (curSelectTab === 5) this.highlight.draw();
    }
}