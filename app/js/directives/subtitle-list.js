var directives = angular.module('amara.SubtitleEditor.directives', []);
directives.directive('subtitleList', function (subtitleList, currentPlayerTime, pubsub) {
    var hasWindowResize = false;


    function resizeSubtitleList(window, elm) {
        var height = $(window).height() - $(elm).offset().top - 2;
        height = Math.max(40, height);
        $(elm).css("height", height + "px");
    }

    return {
        link:function (scope, elm, attrs) {

            var elm = elm;
            if (!hasWindowResize) {
                $(window).resize(function (event) {
                    resizeSubtitleList(window, elm);
                })
            }
            resizeSubtitleList(window, elm);
        }
    }
});

directives.directive('amaraEditableSubtitle', function (subtitleList, currentPlayerTime, pubsub) {
    var hasWindowResize = false;
    var obj =  {
        link:function (scope, elm, attrs) {

            var textOnFocus = null;
            var el = angular.element(elm[0]);
            var editableParagrah = $(elm[0]).children("p")[0];
            editableParagrah.addEventListener('focus', function () {
                $(el).addClass("active");
                currentPlayerTime.set(scope.subtitle.startTime);
                angular.element(el).controller().setActive(true);
                textOnFocus = $(editableParagrah).text();
                // this little monster is the helper that
                // selects all text in a div.
                window.setTimeout(function () {
                    var sel, range;
                    if (window.getSelection && document.createRange) {
                        range = document.createRange();
                        range.selectNodeContents(editableParagrah);
                        sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    } else if (document.body.createTextRange) {
                        range = document.body.createTextRange();
                        range.moveToElementText(editableParagrah);
                        range.select();
                    }
                }, 1);
            });
            editableParagrah.addEventListener('blur', function (event) {
                // if text is empty, restore to the text on focus
                // easy cop out, but just saner than alternatives
                // (deleting, sub, etc)
                $(el).removeClass("active");
                angular.element(el).controller().setActive(false);
                var text = $(editableParagrah).text();
                if (!String.prototype.trim) {
                    text = text.replace(/^\s+|\s+$/g, '');
                } else {
                    text = text.trim();
                }
                if (text == '') {
                    $(editableParagrah).text(textOnFocus);
                    return;
                }
                scope.$root.$apply(function () {
                    scope.subtitle.text = $(editableParagrah).text();
                    scope.$root.subtitles = subtitleList.get();
                });
                scope.$emit("subtitleChanged")
            }, false);
            $(editableParagrah).keypress(function (event) {
                if (event.keyCode == 13 && !event.shiftKey) {
                    event.preventDefault();
                    editableParagrah.blur();
                }
            });
            if (scope.mustScrollToBottom) {
                var parent = elm[0].parentElement;
                parent.scrollTop = parent.scrollHeight - parent.offsetHeight;
                scope.mustScrollToBottom = false;
            }
            var currentTime = currentPlayerTime.get();
            if (scope.subtitle.startTime > currentTime &&
                scope.subtitle.endTime < currentTime) {
                el.addClass("currentlyPlaying");
            }

            function onSubtitleSelected(isSelected){
                if (isSelected){
                    el.get(0).scrollIntoView(true);
                }
                el.controller().setActive(isSelected);
            }
            // watch for changes to this specific sub
            pubsub.subscribe("subtitleSelected_" + scope.$index, onSubtitleSelected)
        }
    };
    return obj;
});