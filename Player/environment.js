/**
 * Created by rajasekarp on 8/26/2016.
 */
    var BrowserInfo = new Array(0);
    BrowserInfo.FIREFOX = 1;
    BrowserInfo.MSIE = 2;
    BrowserInfo.Chrome = 3;
    BrowserInfo.SAFARI = 4;
    BrowserInfo.BB10 = 5;
    BrowserInfo.NONSUPPORTEDBROWSER = 6;
    BrowserInfo.OTHERS = 7;
    BrowserInfo.EDGE = 8;

    var BrowserName = new Array(0);
    BrowserName[BrowserInfo.FIREFOX] = "FIREFOX";
    BrowserName[BrowserInfo.MSIE ]= "MSIE";
    BrowserName[BrowserInfo.Chrome] = "Chrome";
    BrowserName[BrowserInfo.SAFARI] = "SAFARI";
    BrowserName[BrowserInfo.BB10] = "BB10";
    BrowserName[BrowserInfo.NONSUPPORTEDBROWSER] = "NONSUPPORTEDBROWSER";
    BrowserName[BrowserInfo.OTHERS] = "OTHERS";
    BrowserName[BrowserInfo.EDGE] = "EDGE";

        var browserMajorVersion;
        var browserVersion;

        /*
         _navigator will be useful when useragent string is changing dynamically.(example in case of continuum )
         */
        var _navigator = {
            appVersion :  navigator.appVersion ,
            userAgent :  navigator.userAgent ,
            platform : navigator.platform
        };
        var _window = (typeof window != 'undefined') ? window : null;
        function EnvironmentManager() {

        }




        var RECEIVERTYPE = new Array(0);
        RECEIVERTYPE.CHROMEAPP = 1;
        RECEIVERTYPE.HTMLAPP = 2;

        var RECEIVERNAME = new Array(0);
        RECEIVERNAME[RECEIVERTYPE.CHROMEAPP] = "CHROMEAPP";
        RECEIVERNAME[RECEIVERTYPE.HTMLAPP] = "HTMLAPP";

        function getBrowser() {
            //document.loadScript("./Business/CtxDialog.js",function(){});
            var nVer = _navigator.appVersion;
            var nAgt = _navigator.userAgent;
            var browserID = null;
            var fullVersion = '' + parseFloat(_navigator.appVersion);
            var nameOffset, verOffset, ix;

            // In MSIE, the true version is after "MSIE" in userAgent
            if (( verOffset = nAgt.indexOf("MSIE")) !== -1) {
                browserID = BrowserInfo.MSIE;
                fullVersion = nAgt.substring(verOffset + 5);
            } else if((verOffset = nAgt.indexOf("Edge")) !== -1){
                browserID = BrowserInfo.EDGE;
                //UserAgent = "...Edge/12.0 .."
                fullVersion = nAgt.substring(verOffset + 5, verOffset + 5+4);
            }else if (nAgt.indexOf("Trident") !== -1) {
                browserID = BrowserInfo.MSIE;
                verOffset = nAgt.indexOf("rv:");
                fullVersion = nAgt.substring(verOffset + 3, verOffset + 3 + 4);
            }
            // In BB10, the true version is after after "Version"
            else if (( verOffset = nAgt.indexOf("BB10")) !== -1) {
                browserID = BrowserInfo.BB10;
                fullVersion = nAgt.substring(verOffset + 7);
                if (( verOffset = nAgt.indexOf("Version")) !== -1)
                    fullVersion = nAgt.substring(verOffset + 8);
            }

            // In chrome, the true version is after "chrome"
            else if (( verOffset = nAgt.indexOf("Chrome")) !== -1) {
                browserID = BrowserInfo.Chrome;
                fullVersion = nAgt.substring(verOffset + 7);
                if (( verOffset = nAgt.indexOf("Version")) !== -1)
                    fullVersion = nAgt.substring(verOffset + 8);
            }

            // In Safari, the true version is after "Safari" or after "Version"
            else if (( verOffset = nAgt.indexOf("Safari")) !== -1) {
                browserID = BrowserInfo.SAFARI;
                fullVersion = nAgt.substring(verOffset + 7);
                if (( verOffset = nAgt.indexOf("Version")) !== -1)
                    fullVersion = nAgt.substring(verOffset + 8);

                //Added for worxweb as fullVersion will be empty when session is running inside UIWebview and hence reading applewebkit no
                if (fullVersion == "" && (verOffset = nAgt.indexOf("AppleWebKit")) !== -1)
                    fullVersion = nAgt.substring(verOffset + 12);
            }
            // In Firefox, the true version is after "Firefox"
            else if (( verOffset = nAgt.indexOf("Firefox")) !== -1) {
                browserID = BrowserInfo.FIREFOX;
                fullVersion = nAgt.substring(verOffset + 8);
            } else {
                if (supportBasicFeature() === false) {
                    browserID = BrowserInfo.NONSUPPORTEDBROWSER;
                } else {
                    browserID = BrowserInfo.OTHERS;
                }
            }

            // trim the fullVersion string at semicolon/space if present
            if (( ix = fullVersion.indexOf(";")) !== -1) {
                fullVersion = fullVersion.substring(0, ix);
            }
            if (( ix = fullVersion.indexOf(" ")) !== -1) {
                fullVersion = fullVersion.substring(0, ix);
            }

            browserVersion = fullVersion;
            browserMajorVersion  = parseInt('' + fullVersion, 10);

            if (isNaN(browserMajorVersion)) {
                browserMajorVersion = parseInt(_navigator.appVersion, 10);
            }
            return {
                browserID : browserID ,
                browserMajorVersion : browserMajorVersion,
                browserVersion : browserVersion
            };
        }

function supportBasicFeature() {
    var rc = true;
    if ((( typeof Uint32Array) === "undefined") || (( typeof Int32Array) === "undefined") || (( typeof Uint8Array) === "undefined") || (( typeof Int8Array) === "undefined") || (( typeof Uint16Array) === "undefined") || (( typeof Int16Array) === "undefined") || (( typeof ArrayBuffer) === "undefined") || (( typeof Float32Array) === "undefined") || (( typeof Float64Array) === "undefined")) {
        rc = false;
    }
    if (( typeof WebSocket) === "undefined") {
        rc = false;
    }
    try {
        var elem = document.createElement('canvas');
        if ((!(elem.getContext && elem.getContext('2d'))) === true) {
            rc = false;
        }
    } catch (error) {
        rc = false;
    }
    return rc;
}