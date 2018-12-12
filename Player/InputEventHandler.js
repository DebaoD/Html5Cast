

var isKeyPressReq = false;
var keyDownEvent = null;
var altDownEvent= null;
var altFlag=false;
var keyPressExecuted = false;
var ctrlKeyDown = false;


if (getBrowser().browserID == BrowserInfo["FIREFOX"]) {
    let prev_key = -1;
    //this is used for handle +  numpad + because both have same code
    // 107 so can not be decided at key press  but at keypress it
    let is_keydowneventdone = false;
    // this key is used for keys combination that give different  code at keydown
    // and keypress because keyPressExecuted  become true at first key press then if consecutive
    //keydown and keypress occur then thet charcter either print twicw or two chacter pronted
    // like 1 + downarrowkey

    let unifyKeyCode = ( function() {
        // fix BUG0356471 by Qiang ZHUO

        let unifyFunction;
        // Browser using different keycode table.
        // we unify the keycode to the `IE keycode` which is used by IE and chrome
        // @see http://unixpapa.com/js/key.html
        let mozillaToIeKeycodeMapping = new Uint8Array(172);
        mozillaToIeKeycodeMapping[63] = 219;
        // ÃŸ (\xDF) in DE, press <->
        mozillaToIeKeycodeMapping[171] = 187;
        // ~ in DE, press <AltGr> + <]>
        mozillaToIeKeycodeMapping[169] = 219;
        // > in FR, press <Maj> + <<>
        mozillaToIeKeycodeMapping[60] = 226;
        // ] in FR, press <AltGr> + <->
        mozillaToIeKeycodeMapping[61] = 187;
        // } in FR, press <AltGr> + <=>
        mozillaToIeKeycodeMapping[164] = 186;
        // Â¤ (\xA4) in FR, press <AltGr> + <]>

        unifyFunction = function(keyCode) {
            return mozillaToIeKeycodeMapping[keyCode] || keyCode;
        };

        return unifyFunction;
    }());


    function InputEvt(event) {
            const evType = event.type;
            if (evType === "keydown") {
                //console.log("keyEvent.InputEventHandler.keydown.keyCode="+event.keyCode);
                //The followinng if loop comes into active when 'Alt' is pressed.
                //There are 5 cases we have to take care
                //1. When only Alt is Pressed. In this case we send 'Alt Down' and 'Alt Up' to Server during 'Alt Up' Event
                //2. When Hot keys like 'Alt+Search' are pressed. We donot send any keys to Server
                //3. When Non Hot keys like 'Alt+ F' are Pressed. We send Alt Down and F to the Server
                //4. Cases like Alt+Ctrl or Alt+Shift are pressed. We send Alt Down and Ctrl/SHift to Server
                //5. Complicated Scenarios like Alt+Tab are Pressed.
                if(event.keyCode==18 && event.shiftKey==false && event.ctrlKey==false){
                    altDownEvent = event;
                    altFlag=true;
                    return true;
                }
                if(event.keyCode!=18 && altFlag)
                {
                    if(event.altKey==true)
                    {
                        //This loop handles non Hot keys like in case of 'Alt+F'. We send 'Alt Down' here and 'F' in the code below.
                        updateAltModifier(altDownEvent);
                        altDownEvent =null;
                        altFlag=false;
                    }
                    else
                    {
                        //This is for clearing the Alt Down event in any other error cases.
                        altDownEvent = null;
                        altFlag = false;
                    }
                }

                // Win_Left_Keycode = 91, Win_Right_Keycode = 92
                if ((navigator.appVersion.indexOf("Win") != -1) && (event.keyCode == 91 || event.keyCode == 92)) {

                    var evt = event ? event : window.event;
                    if (evt.stopPropagation) {
                        evt.stopPropagation();
                        evt.stopImmediatePropagation();
                    }
                    if (evt.cancelBubble != null) {
                        evt.cancelBubble = true;
                    }
                    return true;
                }
                keyDownEvent = null;
                keyPressExecuted = false;
                is_keydowneventdone = false;


                checkModifiers(event);
                //updateAltModifier(event);

                let key = unifyKeyCode(event.keyCode);

                if (event.ctrlKey && event.altKey)//Only if both keys are pressed simultaneously
                {
                    /*
                     adding 58 , 59  for firefox ;: key
                     */

                    if ((key > 64 && key < 91) || (key >= 48 && key <= 60) || (key == 12) || (key >= 33 && key <= 40) || (key == 45) || (key >= 186 && key <= 192) || (key >= 219 && key <= 223) || (key == 226) || (key == 0) || (key == 161) || (key == 160)) {
                        /* All printable character (These values remain same for all keyboards as these are not ASCII/UNICODE values and have no relation with them)
                         (key > 64 && key < 91): A-Z
                         (key >= 48 && key <=57):0-9
                         (key==12)||(key>=33 && key<=40)||(key==45): NumPad
                         (key>=186 && key<=192)||(key>=219 && key<=222): Other printable characters like `,;]\ etc.
                         (key==226) European keyboards (DE, FR) maps to <>|
                         */
                        keyDownEvent = event;
                        isKeyPressReq = true;
                        return true;
                    }
                    /* Else it is a non printable character and therefore should be handled like it is being handled right now */
                }
                if (key != 144 && key != 145 && key != 224// 224 is Command key on Firefox + Mac
                    && ((key > 64 && key < 91) || (key >= 48 && key <= 59) || key == 61// = key on Firefox + Mac
                        // Firefox on Mac Unicode keyboard keydown events come in as 0/0, keypress.which contains Unicode codepoint
                        || (key == 0 && event.which == 0) || (key >= 128)) && !CtrlKey(event) && !event.altKey)/*BUG??: (key>=128) ?*/
                {
                    isKeyPressReq = true;
                    return true;
                }

                /* handle with Dutch keyboard key as `~'"^ */
                if (isKeyPressReq && key == 32)
                {
                    return true;
                }
                /*
                 * num lock + - have same code as + - so not handling in keydown
                 */
                if ((key == 107) || (key == 109)) {
                    prev_key = key;
                    isKeyPressReq = true;
                    return true;
                }
               KeyBoardEventHandler(event, evType);
                is_keydowneventdone = true;
                if (key == 122) {
                    return true;
                } else {
                    event.preventDefault();
                    return false;
                }
            } else if (evType === "keyup") {
                //This is in the case of Only 'Alt' key, we send 'Alt Down' now and 'Alt Up' in the code below.
                if(event.keyCode==18 &&  altDownEvent!=null && !event.ctrlKey && !event.shiftKey){
                    altFlag = false;
                    updateAltModifier(altDownEvent);
                    altDownEvent = null;
                }

                altFlag=false; 	 //We clear the flag in case of any error scenarios.

                // Win_Left_Keycode = 91, Win_Right_Keycode = 92
                if ((navigator.appVersion.indexOf("Win") != -1) && (event.keyCode == 91 || event.keyCode == 92)) {

                    let evt = event ? event : window.event;
                    if (evt.stopPropagation) {
                        evt.stopPropagation();
                        evt.stopImmediatePropagation();
                    }
                    if (evt.cancelBubble != null) {
                        evt.cancelBubble = true;
                    }
                    return true;
                }
                let key = unifyKeyCode(event.keyCode);
                HandleClipboardKeyup(event);

                if ((keyDownEvent != null) && (keyPressExecuted == false)) {
                    /* Key down wont be executed when cntrl+alt+key is not having any 3rd character */
                    KeyBoardEventHandler(keyDownEvent, "keydown");
                    /*  Event Should be cleared */
                    keyDownEvent = null;
                    keyPressExecuted = false;
                }


                /*
                 adding 58 , 59  for firefox ;: key
                 adding 61, 224 for firefox on Mac: 61 is equal sign, 224 is Command key
                 */
                if (((key > 64 && key < 91) || (key >= 48 && key <= 59) || key == 61 || (key >= 128)) && key != 224 && keyPressExecuted) {
                    isKeyPressReq = false;
                    return true;
                }

                /* handle with Dutch keyboard key as `~'"^ */
                if (keyPressExecuted && key == 32) {
                    return true;
                }

                if ((key == 107) || (key == 109)) {
                    isKeyPressReq = false;
                    return true;
                }

                KeyBoardEventHandler(event, evType);
                return false;
            } else if (evType === "keypress") {
                // Win_Left_Keycode = 91, Win_Right_Keycode = 92
                if ((navigator.appVersion.indexOf("Win") != -1) && (event.keyCode == 91 || event.keyCode == 92)) {

                    let evt = event ? event : window.event;
                    if (evt.stopPropagation) {
                        evt.stopPropagation();
                        evt.stopImmediatePropagation();
                    }
                    if (evt.cancelBubble != null) {
                        evt.cancelBubble = true;
                    }
                    return true;
                }

                if (event.keyCode == 27 || event.keyCode == 9)// Firefox Mac only handle preventDefault for onkeypress events
                {
                    // If IE
                    if (!event)
                        event.returnValue = false;
                    // Firefox, Safari, Opera
                    else {
                        event.preventDefault();
                        event.stopImmediatePropagation();
                    }
                    return false;
                }
                let key = event.which;
                keyPressExecuted = true;
                if (isKeyPressReq && (is_keydowneventdone == false)) {
                    /*
                     * for handling keys( +- ) && and numpasd( + - ) same code in firefox
                     * at key down so can not be handle at keydown at keypress simple + have
                     * different key code then 107 nut here K ,M have same code as numpad +
                     * - have so need previous keycode
                     */
                    if ((prev_key == key) && ((prev_key == 107) || (prev_key == 109))) {
                        KeyBoardEventHandler(event, "keydown");
                    } else {
                        KeyBoardEventHandler(event, evType);
                    }
                    prev_key = -1;
                    return false;
                }
            }
    }

} else {
    function InputEvt(event) {
            const evType = event.type;
            if (evType === "keydown") {
                //console.log("keyEvent.InputEventHandler.keydown.keyCode="+event.keyCode);
                //The followinng if loop comes into active when 'Alt' is pressed.
                //There are 5 cases we have to take care
                //1. When only Alt is Pressed. In this case we send 'Alt Down' and 'Alt Up' to Server during 'Alt Up' Event
                //2. When Hot keys like 'Alt+Search' are pressed. We donot send any keys to Server
                //3. When Non Hot keys like 'Alt+ F' are Pressed. We send Alt Down and F to the Server
                //4. Cases like Alt+Ctrl or Alt+Shift are pressed. We send Alt Down and Ctrl/SHift to Server
                //5. Complicated Scenarios like Alt+Tab are Pressed.
                if(event.keyCode==18 && event.shiftKey==false && event.ctrlKey==false){
                    //console.log("keyEvent.InputEventHandler.keydown.return 1");
                    altDownEvent = event;
                    altFlag=true;
                    return true;
                }

                var key = event.keyCode;

                if(event.keyCode!=18 && altFlag)
                {
                    if(event.altKey==true)
                    {
                        //This loop handles non Hot keys like in case of 'Alt+F'. We send 'Alt Down' here and 'F' in the code below.
                        updateAltModifier(altDownEvent);
                        altDownEvent = null;
                        altFlag=false;
                    }
                    else
                    {
                        //This is for clearing the Alt Down event in any other error cases.
                        altDownEvent = null;
                        altFlag = false;
                    }
                }

                // Win_Left_Keycode = 91, Win_Right_Keycode = 92
                if ((navigator.appVersion.indexOf("Win") != -1) && (event.keyCode == 91 || event.keyCode == 92)) {

                    var evt = event ? event : window.event;
                    if (evt.stopPropagation) {
                        evt.stopPropagation();
                        evt.stopImmediatePropagation();
                    }
                    if (evt.cancelBubble != null) {
                        evt.cancelBubble = true;
                    }
                    //console.log("keyEvent.InputEventHandler.keydown.return 2");
                    return true;
                }

                keyDownEvent = null;
                keyPressExecuted = false;
                checkModifiers(event);

                if ((key == 0) && (event.which == 0)) {
                    //console.log("keyEvent.InputEventHandler.keydown.return 3");
                    //Key sent in chrome os device when power switch is pressed for a short duration: Do nothing
                    isKeyPressReq = false;
                    return true;
                }

                if (event.ctrlKey && event.altKey)//Only if both keys are pressed simultaneously
                {
                    if ((key > 64 && key < 91) || (key >= 48 && key <= 57) || (key == 12) || (key >= 33 && key <= 40) || (key == 45) || (key >= 186 && key <= 192) || (key >= 219 && key <= 223) || (key == 226)) {
                        /* All printable character (These values remain same for all keyboards as these are not ASCII/UNICODE values and have no relation with them)
                         (key > 64 && key < 91): A-Z
                         (key >= 48 && key <=57):0-9
                         (key==12)||(key>=33 && key<=40)||(key==45): NumPad
                         (key>=186 && key<=192)||(key>=219 && key<=222): Other printable characters like `,;]\ etc.
                         (key==226) European keyboards (DE, FR) maps to <>|
                         */
                        //console.log("keyEvent.InputEventHandler.keydown.return 4");
                        keyDownEvent = event;
                        isKeyPressReq = true;
                        return true;
                    }
                    /* Else it is a non printable character and therefore should be handled like it is being handled right now */
                }

                if (key != 144 && key != 145 && ((key > 64 && key < 91) || (key >= 48 && key <= 57) || (key >= 128)) && !CtrlKey(event) && !event.altKey)/*BUG??: (key>=128) ?*/
                {
                    //console.log("keyEvent.InputEventHandler.keydown.return 5");
                    isKeyPressReq = true;
                    return true;
                }

                /* handle with Dutch keyboard key as `~'"^ */
                if (isKeyPressReq && key == 32)
                {
                    //console.log("keyEvent.InputEventHandler.keydown.return 6");
                    return true;
                }

                KeyBoardEventHandler(event);
                event.preventDefault();
                return false;

            } else if (evType === "keyup") {
                //console.log("keyEvent.InputEventHandler.keyup.keyCode="+event.keyCode);
                if (event.keyCode == 18) {
                    /* Clear altFlag when 'Alt' up.
                       BUG0531872, in Mac OS, some Alt+keys are used to output a 3rd character.
                       Clearing altFlag until 'Alt' up enables the user to hold 'Alt' down and input characters constantly.
                    */
                    altFlag=false;
                    //This is in the case of Only 'Alt' key, we send 'Alt Down' now and 'Alt Up' in the code below.
                    if (altDownEvent!=null && !event.ctrlKey && !event.shiftKey) {
                        updateAltModifier(altDownEvent);
                        altDownEvent = null;
                    }
                }

                // Win_Left_Keycode = 91, Win_Right_Keycode = 92
                if ((navigator.appVersion.indexOf("Win") != -1) && (event.keyCode == 91 || event.keyCode == 92)) {

                    let evt = event ? event : window.event;
                    if (evt.stopPropagation) {
                        evt.stopPropagation();
                        evt.stopImmediatePropagation();
                    }
                    if (evt.cancelBubble != null) {
                        evt.cancelBubble = true;
                    }
                    return true;
                }
                let key = event.keyCode;
                HandleClipboardKeyup(event);
                if ((keyDownEvent != null) && (keyPressExecuted == false)) {
                    /* Key down wont be executed when cntrl+alt+key is not having any 3rd character */
                    KeyBoardEventHandler(keyDownEvent);
                    /*  Event Should be cleared */
                    keyDownEvent = null;
                    keyPressExecuted = false;
                }

                if ((key == 0) && (event.which == 0)) {
                    //Key sent in chrome os device when power switch is pressed for a short duration: Do nothing
                    isKeyPressReq = false;
                    return true;
                }


                if (((key > 64 && key < 91) || (key >= 48 && key <= 57) || (key >= 128)) && keyPressExecuted) {
                    isKeyPressReq = false;
                    return true;
                }

                /* handle with Dutch keyboard key as `~'"^ */
                if (keyPressExecuted && key == 32) {
                    return true;
                }
                KeyBoardEventHandler(event);
                // TODO Added Ctrl & Shift check for debugging on chrome temporarily... Remove it later...
                if (event.shiftKey == true && event.ctrlKey == true)
                    return true;
                else
                    return false;
            } else if (evType === "keypress") {
                //console.log("keyEvent.InputEventHandler.keypress.keyCode="+event.keyCode);
                keyPressExecuted = true;
                if (isKeyPressReq) {
                    KeyBoardEventHandler(event);
                    return false;
                }
            }
        }
}

function HandleClipboardKeyup(evt) {
    const isMac = /mac/i.test(navigator.userAgent);
    let keyCode = evt.keyCode;
    if (!isMac && evt.ctrlKey == false) {
        ctrlKeyDown = false;
    }
    if (isMac && (keyCode == 91 || keyCode == 93 || keyCode == 224)) {
        keyCode = 17;
    }
    switch (keyCode) {
        case 17:
            ctrlKeyDown = false;
            break;
    }
}