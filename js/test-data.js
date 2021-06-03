class TestData {

    /**
     * Returns false if parameter is undefined or null
     * @param  {Any Type} data
     */
    dataIsLoaded(data) {
        return data != null; // in javascript this tests for both undefined and null values
    }

    /**
     * Tests if PapaParse meta results array includes correct headers for movement
     * @param  {PapaParse results.meta.fields} meta
     */
    CSVHEADERS_MOVEMENT(meta) {
        return meta.includes(CSVHEADERS_MOVEMENT[0]) && meta.includes(CSVHEADERS_MOVEMENT[1]) && meta.includes(CSVHEADERS_MOVEMENT[2]);
    }

    /**
     * Tests if PapaParse meta results array includes correct headers for conversation
     * @param  {PapaParse results.meta.fields} meta
     */
    CSVHEADERS_CONVERSATION(meta) {
        return meta.includes(CSVHEADERS_CONVERSATION[0]) && meta.includes(CSVHEADERS_CONVERSATION[1]) && meta.includes(CSVHEADERS_CONVERSATION[2]);
    }

    /**
     * Returns true if all values in provided row are of number type
     * @param  {Results [] from PapaParse} data
     * @param  {Integer} curRow
     */
    movementRowForType(data, curRow) {
        return typeof data[curRow][CSVHEADERS_MOVEMENT[0]] === 'number' && typeof data[curRow][CSVHEADERS_MOVEMENT[1]] === 'number' && typeof data[curRow][CSVHEADERS_MOVEMENT[2]] === 'number';
    }

    /**
     * Tests if at least one row of correctly typed data in PapaParse data array
     * Returns true on first row of PapaParse data array that has all correctly typed data for movement headers
     * @param  {PapaParse results.data []} data
     */
    movementRowsForType(data) {
        for (let i = 0; i < data.length; i++) {
            if (typeof data[i][CSVHEADERS_MOVEMENT[0]] === 'number' && typeof data[i][CSVHEADERS_MOVEMENT[1]] === 'number' && typeof data[i][CSVHEADERS_MOVEMENT[2]] === 'number') return true;
        }
        return false;
    }

    /**
     * Tests if at least one row of correctly typed data in PapaParse data array
     * Returns true on first row of PapaParse data array that has all correctly typed data for conversation headers
     * @param  {PapaParse results.data []} data
     */
    conversationRowsForType(data) {
        for (let i = 0; i < data.length; i++) {
            if (typeof data[i][CSVHEADERS_CONVERSATION[0]] === 'number' && typeof data[i][CSVHEADERS_CONVERSATION[1]] === 'string' && data[i][CSVHEADERS_CONVERSATION[2]] != null) return true;
        }
        return false;
    }

    // Tests if current conversation row is less than total rows in table and if time is number and speaker is string and talk turn is not null or undefined
    // NOTE: this also tests if a conversation file is loaded
    conversationLengthAndRowForType(curRow) {
        return curRow < core.conversationFileResults.length && typeof core.conversationFileResults[curRow][CSVHEADERS_CONVERSATION[0]] === 'number' && typeof core.conversationFileResults[curRow][CSVHEADERS_CONVERSATION[1]] === 'string' && core.conversationFileResults[curRow][CSVHEADERS_CONVERSATION[2]] != null;
    }

    /**
     * Method to sample data in two ways. Important to optimize user interaction and good curve drawing.
     * SampleRateDivisor determines if there is large or small amount of data
     * (1) If minimal amount of data, sample if curRow is greater than last row to 2 decimal places
     * (2) If large amount of data, sample if curRow is one whole number greater than last row
     * @param  {Results [] from PapaParse} data
     * @param  {Integer} curRow
     */
    sampleMovementData(data, curRow) {
        if (curRow === 0 || curRow === 1) return true; // always return true for first two rows to set starting point
        const sampleRateDivisor = 5; // 5 as rate seems to work nicely on most devices
        if (Math.floor(data.length / sampleRateDivisor) < keys.timelineLength) return Number.parseFloat(data[curRow][CSVHEADERS_MOVEMENT[0]]).toFixed(2) > Number.parseFloat(data[curRow - 1][CSVHEADERS_MOVEMENT[0]]).toFixed(2);
        else return Math.floor(data[curRow][CSVHEADERS_MOVEMENT[0]]) > Math.floor(data[curRow - 1][CSVHEADERS_MOVEMENT[0]]); // Large data sampling rate
    }
}