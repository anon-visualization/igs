class ProcessData {

    /**
     * Creates P5 image file from path and updates core floorPlan image and input width/heights to properly scale and display data
     * @param  {String} filePath
     */
    processFloorPlan(filePath) {
        loadImage(filePath, img => {
            console.log("Floor Plan Image Loaded");
            img.onload = () => URL.revokeObjectURL(this.src);
            loop(); // rerun P5 draw loop after loading image
            core.floorPlan = img;
            core.inputFloorPlanPixelWidth = core.floorPlan.width;
            core.inputFloorPlanPixelHeight = core.floorPlan.height;
        }, e => {
            alert("Error loading floor plan image file. Please make sure it is correctly formatted as a PNG or JPG image file.")
            console.log(e);
        });
    }

    /**
     * Replaces existing videoPlayer object with new VideoPlayer object (YouTube or P5FilePlayer)
     * @param  {String} platform
     * @param  {VideoPlayer Specific Params} params
     */
    processVideo(platform, params) {
        if (testData.dataIsLoaded(videoPlayer)) videoPlayer.destroy();
        switch (platform) {
            case "Youtube":
                videoPlayer = new YoutubePlayer(params);
                break;
            case "File":
                videoPlayer = new P5FilePlayer(params);
                break;
        }
    }

    /** 
     * Organizes methods to process and update core movementFileResults []
     * @param  {PapaParse Results []} results
     * @param {CSV} file
     */
    processMovement(results, file) {
        const pathName = file.name.charAt(0).toUpperCase(); // get name of path, also used to test if associated speaker in conversation file
        const [movement, conversation] = this.createMovementConversationArrays(results); //
        core.updatePaths(pathName, movement, conversation);
        core.updateTotalTime(movement);
        core.movementFileResults.push([results, pathName]); // add results and pathName to core []
    }

    reProcessMovement(movementFileResults) {
        for (const results of movementFileResults) {
            const [movement, conversation] = this.createMovementConversationArrays(results[0]);
            core.updatePaths(results[1], movement, conversation);
        }
    }

    /**
     * Returns clean movement and conversation arrays of MovementPoint and ConversationPoint objects
     * Location data for conversation array is drawn from comparison to movement file/results data
     *  @param  {PapaParse Results []} results
     */
    createMovementConversationArrays(results) {
        let movement = []; // Create empty arrays to hold MovementPoint and ConversationPoint objects
        let conversation = [];
        let conversationCounter = 0; // Current row count of conversation file for comparison
        for (let i = 0; i < results.data.length; i++) {
            // Sample current movement row and test if row is good data
            if (testData.sampleMovementData(results.data, i) && testData.movementRowForType(results.data, i)) {
                const m = this.createMovementPoint(results.data[i][CSVHEADERS_MOVEMENT[1]], results.data[i][CSVHEADERS_MOVEMENT[2]], results.data[i][CSVHEADERS_MOVEMENT[0]]);
                movement.push(m); // add good data to movement []
                // Test conversation data row for quality first and then compare movement and conversation times to see if closest movement data to conversation time
                if (testData.conversationLengthAndRowForType(core.conversationFileResults, conversationCounter) && m.time >= core.conversationFileResults[conversationCounter][CSVHEADERS_CONVERSATION[0]]) {
                    const curTalkTimePos = core.conversationFileResults[conversationCounter][CSVHEADERS_CONVERSATION[0]];
                    const curSpeaker = core.cleanSpeaker(core.conversationFileResults[conversationCounter][CSVHEADERS_CONVERSATION[1]]);
                    const curTalkTurn = core.conversationFileResults[conversationCounter][CSVHEADERS_CONVERSATION[2]];
                    conversation.push(this.createConversationPoint(m.xPos, m.yPos, curTalkTimePos, curSpeaker, curTalkTurn));
                    conversationCounter++;
                } else if (!testData.conversationLengthAndRowForType(core.conversationFileResults, conversationCounter)) conversationCounter++; // make sure to increment counter if bad data to skip row in next iteration of loop
            }
        }
        return [movement, conversation];
    }

    /**
     * Object constructed from .CSV movement file representing a location in space and time along a path
     * @param  {Number} xPos // x and y pixel positions on floor plan
     * @param  {Number} time // time value in seconds
     */
    createMovementPoint(xPos, yPos, time) {
        return {
            xPos,
            yPos,
            time
        }
    }

    /**
     * Object constructed from .CSV movement AND conversation files representing a location
     * in space and time and String values of a single conversation turn
     * @param  {Number} xPos // x and y pixel positions on floor plan
     * @param  {Number} yPos
     * @param  {Number} time // Time value in seconds
     * @param  {String} speaker // Name of speaker
     * @param  {String} talkTurn // Text of conversation turn
     */
    createConversationPoint(xPos, yPos, time, speaker, talkTurn) {
        return {
            xPos,
            yPos,
            time,
            speaker,
            talkTurn
        }
    }
}