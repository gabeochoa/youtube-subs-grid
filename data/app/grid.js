var YTG = YTG || {};

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}
const videoToId = (video) => video.href.replace(/.*=[^\w)]*&*/g, "")

YTG.grid = (function (YTG, grid) {
    console.log("go - grid");

    grid.settings = {
        'acknowledgedVersion': 0,
        'scrollAutoLoadVideos': true,
        'bypassMarkWatchedAlert': false,
        'hideWatched': true,
    };
    grid.hidden = [
        "OtlNI-lJTgE",
        "adus6IXy7vo"
    ];

    grid.loadHidden = () => {
        const storage_key = ("gabeochoa.forcehidden");
        const fh_ = window.localStorage.getItem(storage_key);
        const fh = JSON.parse(fh_)
        if(fh !== null){
            grid.hidden = fh
        }
    }

    grid.addHidden = (id) => {
        console.log("hide id: ", id);
        const storage_key = ("gabeochoa.forcehidden");
        grid.hidden.push(id);
        window.localStorage.setItem(storage_key, JSON.stringify(grid.hidden));
        grid.jj();
    }

    grid.forceHidden = (id) => {
        // console.log(grid.hidden, "checking id: ", id);
        return grid.hidden.includes(id);
    }

    grid.jj = () => {
        const today = document.querySelector("#title");
        const textnode = document.createTextNode(" test ");
        today.appendChild(textnode);
        if(grid.settings.hideWatched){
            const to_remove = grid.allWatched()
            // remove the hidden ones too 
            grid.notWatched().forEach(
                video => {
                    if(grid.forceHidden(videoToId(video))){ 
                        to_remove.push(video); 
                    }
                }
            );
            to_remove.forEach( (v) => {
                try{ v.parentElement.parentElement.remove(); }
                catch(e){ console.log(v, e); }
            });

        }
        // add buttons to others
        grid.notWatched().forEach( (v) => {
            const d = v.parentElement.parentElement;
            const hidelinktext = document.createTextNode("hide");
            const hidediv = document.createElement("div");
            const hidelink = document.createElement("a");
            hidelink.onclick = () => {
                grid.addHidden(videoToId(v));
                v.parentElement.parentElement.remove();
            };
            hidelink.appendChild(hidelinktext);
            hidediv.appendChild(hidelink);
            d.appendChild(hidediv);
        });
    }

    grid.setup = function (isClassicGridMode) {
        grid.videoCount = grid.allVideos().length;
        grid.loadHidden();
        sleep(2000).then(grid.jj);
    };

    grid.isGrid = function()
    {
        return $('body').hasClass('ytg-gridable');
    };

    grid.updateWatchedVideos = function()
    {
        if (YTG.grid.isGrid()) {

            YTG.history.populateHistory(function () {
                YTG.grid.markVideos();
            });
        }
    };

    grid.allVideos = () => grid.allFiltered(true, false)
    grid.notWatched = () => grid.allFiltered(false, false)
    grid.allWatched = () => grid.allFiltered(false, true)


    grid.allFiltered = function(allVideos, onlyWatched)
    {
        var videos = document.querySelectorAll('#thumbnail');
        if(allVideos){
            return videos;
        }
        const watched_tag = "ytd-thumbnail-overlay-playback-status-renderer"
        try{
            const filtered = [...videos].filter( 
            (v, i) => {
                // o will be null if not watched
                const o = v.querySelector("div");
                const d = o.querySelector(watched_tag);
                return !!onlyWatched? d !== null : d === null;
            });
            return filtered;
        }catch(e){
            return []
        }
    };


    // "What the hell" I hear you thinking, "why do you need this?"
    // Youtube has a "load more" button at the bottom of your list of
    // subscriptions you can click, as well as autoloading a set of videos as you
    // scroll. There's no event I can find that YT
    // fires for the loading of videos, and short of intercepting
    // all AJAX calls (which I didn't seem to work anyway) this seemed
    // the best way with out resorting to constantly running loops.
    grid.watchForGridChanges = function()
    {
        console.log("gridchanges");
        const tick = () => {
            console.log("tick");
            if (grid.allVideos().length > grid.videoCount)
            {
                grid.videoCount = grid.allVideos().length;
                grid.markVideos();
                grid.markYTVideos();
                grid.showAllLoadedVideos();
                // Are we in Classic mode? Fire cleanup for that too.
                if (grid.isClassicGridMode) { grid.classicModeCleanup() }
            }
            setTimeout(tick, 1000);
        }
        tick();
        return;
        // select the target node
        var target = document.querySelector('#browse-items-primary');

        // create an observer instance
        var observer = new MutationObserver(function(mutations) {
            tick();
        });

        // configuration of the observer:
        var config = { childList: true, subtree: true };

        // pass in the target node, as well as the observer options
        observer.observe(target, config);
    };

    grid.showAllLoadedVideos = function()
    {
        // Really YT? YT added this code to only show 10 videos per day. This shows ALL videos
        // per day because why on earth would I subscribe to a channel I don't want to see videos from?!
        $('.yt-uix-expander').removeClass('yt-uix-expander-collapsed');
        $('.yt-uix-expander-head').remove();
    };

    grid.classicModeCleanup = function()
    {
        $('.shelf-content').first().html($('.yt-shelf-grid-item').detach());
        $('h2.shelf-title-cell').remove();
        $('ol.section-list > li:not(:first-child)').remove();
    };

    grid.loadMoreVideos = function () {
        // Load more videos, then load some more
        // Note: don't use jquery here because it messes with the event dispatch stuff.
        YTG.fireEvent(document.querySelector('.load-more-button'), 'click');
    };

    grid.markAllVisibleVideos = function () {

        if (YTG.grid.settings.bypassMarkWatchedAlert || window.confirm('Are you sure you want to mark all videos as watched?')) {
            var videoArray = [];
            var excludeWatched = true;
            grid.notWatched().forEach(
                video => videoArray.push(YTG.utils.videoToId(video))
            );
            YTG.history.massAddToHistory(videoArray);
        }
    };

    // Get all videos marked as watched on the
    // YT side of things, remove them from our
    // internal history
    grid.markYTVideos = function () {
        var videos = [];
        grid.allWatched().forEach(
            elm => {
                elm.style = "opacity: 10%";
                videos.push(YTG.utils.videoToId(video));
            }
        );
        YTG.history.massRemoveFromHistory($.unique(videos));
    };

    grid.markVideos = function () {
        grid.allVideos().forEach( video => {
            grid.cleanVideo(video);
            grid.markVideo(video);
        });

        // TODO - not sure what this is trying to do 
        // if (! grid.allVideos().find(':visible').length)
        // {
            // grid.loadMoreVideos();
        // }
    };

    grid.markVideo = function (videoElm) {
        videoElm = $(videoElm);
        var videoId = videoElm.find('[data-context-item-id]').attr('data-context-item-id');

        var videoLinkElm = videoElm.find('.yt-lockup-thumbnail a');

        // Can't unmark these ones.
        if (videoElm.find('.watched').length > 0) {
            videoElm.addClass('watched');
            videoElm.find('.ytg-mark-watched').attr('data-tooltip-text', 'Cannot changed watched status');
        }
        else if (!videoElm.hasClass('ytg-watched') && YTG.history.videoIsInHistory(videoId)) {
            videoElm.addClass('ytg-watched');
            videoLinkElm.append('<div class="watched-badge">WATCHED</div>');
            videoElm.find('.ytg-mark-watched').attr('data-tooltip-text', 'Mark as unwatched');
        }
        else if (videoElm.hasClass('ytg-watched') && !YTG.history.videoIsInHistory(videoId)) {
            videoElm.removeClass('ytg-watched');
            videoElm.find('.watched-badge').remove();
            videoElm.find('.ytg-mark-watched').attr('data-tooltip-text', 'Mark as watched');
        }


        if (videoElm.hasClass('ytg-watched') || videoElm.hasClass('watched') || videoElm.find('.watched').length) {
            videoElm.addClass('ytg-contains-watched');
        }
        else {
            videoElm.removeClass('ytg-contains-watched');
        }
    };

    grid.cleanVideo = function (videoElm) {
        if (!$(videoElm).hasClass('ytg-cleaned')) {

            grid.addMarkWatchedBtn(videoElm);

            // Fix the thumbnail if its broken.
            $('.yt-thumb-clip img[src*="pixel"]').each(function (idx, elm) {
                $(this).attr('src', $(this).attr('data-thumb'));
            });

            $(videoElm).addClass('ytg-cleaned');
        }
    };

    grid.addMarkWatchedBtn = function (videoElm) {
        // Set up the mark as watched button.
        var button = $(videoElm).find('.addto-watch-later-button').clone();

        button.removeClass('addto-watch-later-button addto-button');
        button.addClass('ytg-mark-watched');
        button.attr('data-tooltip-text', 'Mark as watched');

        $(videoElm).find('.contains-addto').append(button);
    };

    grid.setHideVideos = function (hideVideos) {
        grid.hideVideos = hideVideos || false;
    };

    grid.toggleVideos = function () {
        if ($(this).hasClass('yt-uix-button-toggled')) {
            return false;
        }

        grid.hideVideos = !grid.hideVideos;
        grid.setViewToggle();

        YTG.platform.setStorageItem({ hideVideos: grid.hideVideos });
    };

    grid.setViewToggle = function () {
        $('#hideVideos,#showVideos').removeClass('yt-uix-button-toggled');

        if (grid.hideVideos) {
            $('#hideVideos').addClass('yt-uix-button-toggled');
            $('#page').addClass('ytg-hide-watched-videos');
        }
        else {
            $('#showVideos').addClass('yt-uix-button-toggled');
            $('#page').removeClass('ytg-hide-watched-videos');
        }
    };

    // Is a subs page, a collection page,
    // watch history or watch later page
    // and not an activity page.
    grid.isSubsSection = function (url) {
        var gridablePages = ['/feed/subscriptions', '/feed/SC'];

        return gridablePages.some(function (gridCheck) {
            if (url.indexOf(gridCheck) >= 0) {
                return true;
            }
        });
    };

    grid.isGridable = function (url) {

        if (grid.isSubsSection(url)) {
            return grid.allVideos().length > 0;
        }

        return false;
    };

    grid.buildHistoryControls = function() {
        var headerContainer = $('.shelf-title-table').first();

        YTG.platform.getControlMarkup(function(markup)
        {
            headerContainer.prepend(markup);

            headerContainer.on('click', '.view-toggle-button', YTG.grid.toggleVideos);
            headerContainer.on('click', '#markAllVideos', YTG.grid.markAllVisibleVideos);

            YTG.grid.setViewToggle();

            // Move the grid selector in to our markup for better style control.
            $('.ytg-grid-selector').append($('.shelf-title-row .menu-container').first().detach());

            YTG.platform.getStorageItem(grid.settings, function(data) {

                // Override our defaults.
                grid.settings = data;

                if (data.acknowledgedVersion < YTG.internalFeatureVersion)
                {
                    $('.ytg-subs-grid-settings-button').addClass('ytg-has-updates');
                }

                Object.keys(data).forEach(function(key)
                {
                    $('.ytg-settings input[name="'+key+'"]').prop('checked', data[key]);
                });


            });
        });
    };

    grid.settingsClickedHandler = function()
    {
        $('.ytg-settings').slideToggle({
            complete: function () {
                if ($('.ytg-subs-grid-settings-button').hasClass('ytg-has-updates'))
                {
                    $('.ytg-subs-grid-settings-button').removeClass('ytg-has-updates');
                    YTG.platform.setStorageItem({ acknowledgedVersion: YTG.internalFeatureVersion });
                }
            }
        });
    };

    grid.settingCheckboxClickedHandler = function(e)
    {
        var settingElement = $(this);
        var name = settingElement.attr('name');
        var val = settingElement.prop('checked'); // Ignore the value just get the opposite of its checked status.
        var setting = {};

        settingElement.prop('disabled', true);

        setting[name] = val;
        YTG.platform.setStorageItem(setting, function()
        {
            grid.settings[name] = val;
            settingElement.prop('checked', val);

            settingElement.prop('disabled', false);
        });
    };

    grid.scrollHandler = function()
    {
        var s = $(window).scrollTop(),
            d = $(document).height(),
            c = $(window).height();

        var scrollPercent = (s / (d-c)) * 100;

        if (scrollPercent > 85 && grid.settings.scrollAutoLoadVideos)
        {
            grid.loadMoreVideos();
        }
    };

    return grid;
}(YTG, YTG.grid || {}));
