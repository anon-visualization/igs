/**********************************************************************************************
KalturaPlayer, YoutubePlayer and FilePlayer are implementations of a VideoPlayer interface; this
means that they support the same functionality by having the same set of method names, but behind
the scenes, achieve the functionality in different ways (by relying on platform-specific JavaScript APIs).

JS is dynamically typed, so we don't actually need to declare a VideoPlayer interface. Any additional 
implementation of VideoPlayer should have the following methods: seekTo(time), play(), pause(), mute(), 
unMute(), getCurrentTime(), getVideoDuration(), destroy()

Note the params variable passed into the constructors, this is designed to be a dictionary
containing any relevant settings that are used to initailize the player to the correct video.
This params variable is declared in main.js and is called 'videoParams'; note that in setupMovie,
the 'targetId' is added to the params to specify the div holding the player for Web based players
like YouTube and Kaltura players. For the File Player, native p5.js methods are used by declaring 
a movie element in process Video File methods that work with the html5 video plaer.

// ******* FilePlayer Vars *******
Videoparams expects 1 item, the fileName, videoParams = { fileName: 'your_fileName_here' };
let videoPlatform = 'File'; // what platform the video is being hosted on, specifies what videoPlayer should be instantiated during setupMovie
let videoParams = { fileName: '[your_directory_fileLocation]' };

// ******* YouTube Vars *******
Include following script in head of the format: <script type="text/javascript" src="https://www.youtube.com/iframe_api"></script>
VideoParams expects 1 item, the videoId, videoParams = { videoId: 'your_videoId_here' };
let videoPlatform = 'Youtube'; 
let videoParams = { videoId: 'Iu0rxb-xkMk'};

// ******* Kaltura Vars *******
Include following script in head of the format: <script src="https://cdnapi.kaltura.com/p/{partner_id}/sp/{partnerId}00/embedIframeJs/uiconf_id/{uiconf_id}/partner_id/{partnerId}"></script>
VideoParams expects 3 items, the wid, uiconf_id, and entry_id, videoParams = { wid: 'your_wid_here', uiconf_id: 'your_uiconf_id_here', entry_id: 'your_entry_id_here' };
var videoPlatform = 'Kaltura';
var videoParams = { wid: '_1038472', uiconf_id: '33084471', entry_id: '1_9tp4soob' };
**********************************************************************************************/

// This is the VideoPlayer implementation that utilizes the Youtube Player API
class YoutubePlayer {

    constructor(params) {
        this.targetId = 'moviePlayer';
        this.videoId = params['videoId'];
        this.initializeDiv();
        this.initializePlayer();
    }

    initializeDiv() {
        movie = createDiv(); // create the div that will hold the video if other player
        movie.id(this.targetId);
        movie.size(videoWidth, videoHeight);
        movie.hide();
        movie.position(timelineStart, 0);
    }


    initializePlayer() {
        this.player = new YT.Player(this.targetId, {
            videoId: this.videoId,
            playerVars: {
                controls: 0, // hides controls on the video
                disablekb: 1, // disables keyboard controls on the video
            },
            events: {
                'onReady': this.onPlayerReady,
            }
        });
    }

    // The API will call this function when the video player is ready.
    onPlayerReady() {
        // event.target.playVideo();
        loop(); // restart p5 draw loop once loaded
        console.log("YT player ready: ");
    }

    show() {
        let element = document.querySelector('#moviePlayer');
        element.style.display = 'block';
    }

    hide() {
        let element = document.querySelector('#moviePlayer');
        element.style.display = 'none';
    }

    seekTo(time) {
        this.player.seekTo(time, true);
    }

    play() {
        this.player.playVideo();
    }

    pause() {
        this.player.pauseVideo();
    }

    mute() {
        this.player.mute();
    }

    unMute() {
        this.player.unMute();
    }

    getCurrentTime() {
        return this.player.getCurrentTime();
    }

    getVideoDuration() {
        return this.player.getDuration();
    }

    destroy() {
        this.player.destroy(); // destroy the player object
        movie.remove(); // remove the div element
    }
}

class P5FilePlayer {

    constructor(params) {
        movie = createVideo(params['fileName'], function () {
            movie.id('moviePlayer');
            movie.size(videoWidth, videoHeight);
            movie.hide();
            movie.position(timelineStart, 0);
            movie.onload = function () {
                URL.revokeObjectURL(this.src);
            }
            console.log("File Player Ready:");
        });
    }

    show() {
        let element = document.querySelector('#moviePlayer');
        element.style.display = 'block';
    }

    hide() {
        let element = document.querySelector('#moviePlayer');
        element.style.display = 'none';
    }

    seekTo(t) {
        movie.time(t); // jumps to time parameter
    }

    play() {
        movie.play();
    }

    pause() {
        movie.pause();
    }

    mute() {
        movie.volume(0);
    }

    unMute() {
        movie.volume(1);
    }

    getCurrentTime() {
        return movie.time();
    }

    getVideoDuration() {
        return movie.duration();
    }

    destroy() {
        movie.remove(); // remove the div element
    }
}