
const keyDown = "keydown";
const keyUp = "keyup";
const keyPress = "keypress";
var numLockDown = false;
var capsLockDown = false;
var capsLockInitial = false;
var scrollLockDown = false;
const CAPS_LOCK_FLAG = 0x40;
const NUM_LOCK_FLAG = 0x20;
const SCROLL_LOCK_FLAG = 0x10;

const SHIFT_KEYCODE = 16;
const CTRL_KEYCODE = 17;
const ALT_KEYCODE = 18;
// Chrome+Mac: detect Apple Command key events used to convert to Ctrl
const isMac = /mac/i.test(navigator.userAgent);
var searchKeyPressed = false;
var modifierStates = {
    shiftKey : false,
    altKey : false,
    ctrlKey : false
};
const isEUKSEnabled = false;
const KeyEventNormal = function keyEventNormal(icaKey, pressed) {
    console.log("keyEvent.keyEventNormal.icaKey="+icaKey+";pressed="+pressed);
    if (icaKey.KeyChar != -1) {
        let code = (pressed == true) ? 0 : 1;

        if (icaKey.Special) {
            code += 2;
        }
        writePacketKeyboardUnicode(icaKey.KeyChar, code);
    }
};

const KeyEventPress = function(icaKey) {
    console.log("keyEvent.KeyEventPress.icaKey="+icaKey);
    // Avoid Unicode Injection for printable ASCII range, whose scan codes are required for
    // East-Asian Windows IMEs and some older Windows applications.  This logic is taken partially
    // from iOS, Mac and Android receivers.  If there are some scenarios where Unicode Injection
    // is beneficial for this character range as well, the longer term approach would be to expose
    // a client-side setting to control this behavior (like iOS Receiver) or honoring the UNIKEY
    // keyword in ICA description field (like Android Receiver) to provide more flexibility
    if (isEUKSEnabled && !(icaKey.KeyChar >= 0x20 && icaKey.KeyChar <= 0x7e)) {
        // Code 4 belongs to UNICODE_INJECTION. Only one event is required by XenApp in case of Unicode injection.
        // TODO IT will break if there is a case where server doesn't support EUKS capability, need to research the same..
        writePacketKeyboardUnicode(icaKey.KeyChar, 4);
    } else {
        KeyEventNormal(icaKey, true);
        KeyEventNormal(icaKey, false);
    }
};

const GetLEDFlags = function getLEDFlags() {
    let flags = 0;
    flags |= ( capsLockDown ? CAPS_LOCK_FLAG : 0x0);
    flags |= ( numLockDown ? NUM_LOCK_FLAG : 0x0);
    flags |= ( scrollLockDown ? SCROLL_LOCK_FLAG : 0x0);

    // console.log("flags is" + flags + " capsLockDown " + capsLockDown);
    return flags;

};

const CtrlKey = function ctrlKey(event) {
    return event.ctrlKey || modifierStates.ctrlKey;
};

if (getBrowser().browserID == BrowserInfo["FIREFOX"]) {

    var prev_key = -1;
    //this is used for handle +  numpad + because both have same code
    // 107 so can not be decided at key press  but at keypress it
    var is_keydowneventdone = false;
    // this key is used for keys combination that give different  code at keydown
    // and keypress because keyPressExecuted  become true at first key press then if consecutive
    //keydown and keypress occur then thet charcter either print twicw or two chacter pronted
    // like 1 + downarrowkey

    var unifyKeyCode = ( function() {
        // fix BUG0356471 by Qiang ZHUO

        var unifyFunction;
        // Browser using different keycode table.
        // we unify the keycode to the `IE keycode` which is used by IE and chrome
        // @see http://unixpapa.com/js/key.html
        var mozillaToIeKeycodeMapping = new Uint8Array(172);
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

    const COMMAND_KEYCODE = 224;
    const RUSSIAN_LANGUAGE_ID = 1049;
// TODO Need to verify that when keyboard/mouse event occurs we will pass it to WD only if focus is in session....
    var KeyBoardEventHandler = function keyBoardEventHandler(event, evType) {
        const key = event.keyCode;
        if (evType == keyDown) {
            if (key == 144)//num Lock
            {
                numLockDown = !numLockDown;
                writePacketSetLed(GetLEDFlags());
            } else if (key == 145) {
                scrollLockDown = !scrollLockDown;
                writePacketSetLed(GetLEDFlags());
            } else if (key == 20)//caps lock
            {
                capsLockDown = !capsLockDown;
                writePacketSetLed(GetLEDFlags());
            } else if (key == 93) {
                var icaKey = new IcaKey(false, ' ');
                icaKey.KeyChar = key;

                searchKeyPressed = true;
                writePacketKeyboardUnicode(4, 2);
                //ctrl down
                writePacketKeyboardUnicode(99, 0);
                //c down
                writePacketKeyboardUnicode(99, 1);
                //c up
                writePacketKeyboardUnicode(4, 3);
                //ctrl up

                setTimeout(function () {
                    searchKeyPressed = false;
                }, 1000);

            } else {
                var icaKey = null;

                if (!numLockDown && key >= 96 && key <= 111) {
                    numLockDown = true;
                    writePacketSetLed(GetLEDFlags());
                }
                if (key === CTRL_KEYCODE) {
                    modifierStates.ctrlKey = true;
                } else if (key === ALT_KEYCODE) {
                    modifierStates.altKey = true;
                } else if (key === SHIFT_KEYCODE) {
                    modifierStates.shiftKey = true;
                } else if (key === COMMAND_KEYCODE) {
                    // Command key on Mac, map to Ctrl
                    modifierStates.ctrlKey = true;
                    icaKey = KeyMapping.Converter[CTRL_KEYCODE];
                }

                if (!icaKey) {
                    icaKey = KeyMapping.ScanCodeToKey1(event);
                    // This is to differentiate between Enter Key and NumPad Enter Key. We might need to do this for Right and Left Ctrl,Alt,Shift
                    if (event.keyCode == 13 && event.location == 3) {
                        icaKey = new IcaKey(true, 50);
                    } else if (event.keyCode == CTRL_KEYCODE && (event.location == 2 || event.keyLocation == 2)) {
                        // handle with right Ctrl, location = 1 is left Ctrl
                        icaKey = new IcaKey(true, 51);
                    }
                }
                if ((icaKey.KeyChar == 219 || icaKey.KeyChar == 221) && modifierStates.ctrlKey && modifierStates.altKey) return;
                KeyEventNormal(icaKey, true);
            }
        } else if (evType == keyUp) {
            if (key == 44)//PrintScreen
            {
                //print screen only fires Keyup events
                KeyEventNormal(KeyMapping.ScanCodeToKey1(event, evType), true);
                //send down
                KeyEventNormal(KeyMapping.ScanCodeToKey1(event, evType), false);
                //send up

            }
            if (key != 144 && key != 20 && key != 145) {
                var icaKey = null;

                if (key === CTRL_KEYCODE) {
                    modifierStates.ctrlKey = false;
                } else if (key === ALT_KEYCODE) {
                    updateAltModifier(event);

                    if (event.returnValue != null) {
                        event.keyCode = 0;
                        event.returnValue = false;
                    }
                    if (event.cancelBubble != null)
                        event.cancelBubble = true;
                    if (event.stopPropagation)
                        event.stopPropagation();
                    if (event.preventDefault)
                        event.preventDefault();
                    return false;

                } else if (key === SHIFT_KEYCODE) {
                    modifierStates.shiftKey = false;
                } else if (key == COMMAND_KEYCODE) {
                    // Command key on Mac, map to Ctrl
                    modifierStates.ctrlKey = false;
                    icaKey = KeyMapping.Converter[CTRL_KEYCODE];
                }

                if (!icaKey) {
                    icaKey = KeyMapping.ScanCodeToKey1(event);
                    // This is to differentiate between Enter Key and NumPad Enter Key. We might need to do this for Right and Left Ctrl,Alt,Shift
                    if (event.keyCode == 13 && event.location == 3) {
                        icaKey = new IcaKey(true, 50);
                    } else if (event.keyCode == CTRL_KEYCODE && (event.location == 2 || event.keyLocation == 2)) {
                        // handle with right Ctrl, location = 1 is left Ctrl
                        icaKey = new IcaKey(true, 51);
                    }
                }
                if ((icaKey.KeyChar == 219 || icaKey.KeyChar == 221) && modifierStates.ctrlKey && modifierStates.altKey) return;
                KeyEventNormal(icaKey, false);
            }

        } else if (evType == keyPress) {
            /*
             * handling capslock in key press only code A-Z (65-90) && a-z (97-122)
             * other overlapped key ( as numlock key having same keycode ) is handled before
             * so in this keypress no need for worry
             *
             */
            var is_capschange = false;
            if (event.shiftKey) {
                if ((!capsLockDown) && (key >= 97) && (key <= 122)) {
                    is_capschange = true;
                } else if (capsLockDown && (key >= 65) && (key <= 90)) {
                    is_capschange = true;
                }
            } else {
                /* First time  when the session is started, we send the state of capsLock. If we don't do this previous session capsLock state will be used which is wrong.
                  Refer BUG0648652 for more*/
                if (!capsLockInitial) {
                    capsLockInitial = true;
                    writePacketSetLed(GetLEDFlags());
                }
                if (capsLockDown && (key >= 97) && (key <= 122)) {
                    is_capschange = true;
                } else if ((!capsLockDown) && (key >= 65) && (key <= 90)) {
                    is_capschange = true;
                }
            }
            if (is_capschange) {
                capsLockDown = !capsLockDown;
                writePacketSetLed(GetLEDFlags());
            }
            if (modifierStates.ctrlKey && modifierStates.altKey) {
                writePacketKeyboardUnicode(event.keyCode || event.which, 4);
            } else {
                KeyEventPress(KeyMapping.ScanCodeToKey1(event, evType));
            }
        }
    };
}else {
    const LEFT_COMMAND_KEYCODE = 91;
    const RIGHT_COMMAND_KEYCODE = 93;
    const RUSSIAN_LANGUAGE_ID = 1049;
    // TODO Need to verify that when keyboard/mouse event occurs we will pass it to WD only if focus is in session....
    var KeyBoardEventHandler = function keyBoardEventHandler(event) {
            const evType = event.type;
            const key = event.keyCode;
            if (evType == keyDown) {
                //console.log("keyEvent.KeyBoardEventHandler.keydown.keyCode="+key);
                if (key == 144)//num Lock
                {
                    numLockDown = !numLockDown;
                    writePacketSetLed(GetLEDFlags());
                } else if (key == 145) {
                    scrollLockDown = !scrollLockDown;
                    writePacketSetLed(GetLEDFlags());
                } else if (key == 20)//caps lock
                {
                    capsLockDown = !capsLockDown;
                    writePacketSetLed(GetLEDFlags());
                }
                else {
                    var icaKey = null;

                    if (!numLockDown && key >= 96 && key <= 111) {
                        numLockDown = true;
                        writePacketSetLed(GetLEDFlags());
                    }
                    if (key === CTRL_KEYCODE) {
                        modifierStates.ctrlKey = true;
                    } else if (key === ALT_KEYCODE) {
                        modifierStates.altKey = true;
                    } else if (key === SHIFT_KEYCODE) {
                        modifierStates.shiftKey = true;
                    } else if (isMac && (key === LEFT_COMMAND_KEYCODE || key === RIGHT_COMMAND_KEYCODE)) {
                        // Command key on Mac, map to Ctrl
                        modifierStates.ctrlKey = true;
                        icaKey = KeyMapping.Converter[CTRL_KEYCODE];
                    }
                    if (!icaKey) {
                        icaKey = KeyMapping.ScanCodeToKey(event.keyCode, null, event.shiftKey);
                        // This is to differentiate between Enter Key and NumPad Enter Key. We might need to do this for Right and Left Ctrl,Alt,Shift
                        if(event.keyCode == 13 && event.location == 3) {
                            icaKey = new IcaKey(true, 50);
                        } else if (event.keyCode == CTRL_KEYCODE && (event.location == 2 || event.keyLocation == 2)) {
                            // handle with right Ctrl, location = 1 is left Ctrl
                            icaKey = new IcaKey(true, 51);
                        }
                    }
                    //console.log("keyEvent.KeyBoardEventHandler.keyDown.icaKey="+icaKey);
                    if ((icaKey.KeyChar == 219 || icaKey.KeyChar == 221) && event.ctrlKey && event.altKey) return;
                    KeyEventNormal(icaKey, true);
                }
            } else if (evType == keyUp) {
                //console.log("keyEvent.KeyBoardEventHandler.keyUp.keyCode="+key);
                if (key == 44)//PrintScreen
                {
                    //print screen only fires Keyup events
                    KeyEventNormal(KeyMapping.ScanCodeToKey(event.keyCode, evType, event.shiftKey), true);
                    //send down
                    KeyEventNormal(KeyMapping.ScanCodeToKey(event.keyCode, evType, event.shiftKey), false);
                    //send up

                }
                if (key != 144 && key != 20 && key != 145 ) {
                    var icaKey = null;

                    if (key === CTRL_KEYCODE) {
                        modifierStates.ctrlKey = false;
                    } else if (key === ALT_KEYCODE) {
                        updateAltModifier(event);

                        if (event.returnValue != null) {
                            event.keyCode = 0;
                            event.returnValue = false;
                        }
                        if (event.cancelBubble != null)
                            event.cancelBubble = true;
                        if (event.stopPropagation)
                            event.stopPropagation();
                        if (event.preventDefault)
                            event.preventDefault();
                        return false;

                    } else if (key === SHIFT_KEYCODE) {
                        modifierStates.shiftKey = false;
                    } else if (isMac && (key === LEFT_COMMAND_KEYCODE || key === RIGHT_COMMAND_KEYCODE)) {
                        // Command key on Mac, map to Ctrl
                        modifierStates.ctrlKey = false;
                        icaKey = KeyMapping.Converter[CTRL_KEYCODE];
                    }

                    if (!icaKey) {
                        icaKey = KeyMapping.ScanCodeToKey(event.keyCode, null, event.shiftKey);
                        // This is to differentiate between Enter Key and NumPad Enter Key. We might need to do this for Right and Left Ctrl,Alt,Shift
                        if(event.keyCode == 13 && event.location == 3) {
                            icaKey = new IcaKey(true, 50);
                        } else if (event.keyCode == CTRL_KEYCODE && (event.location == 2 || event.keyLocation == 2)) {
                            // handle with right Ctrl, location = 1 is left Ctrl
                            icaKey = new IcaKey(true, 51);
                        }
                    }
                    //console.log("keyEvent.KeyBoardEventHandler.keyUp.icaKey="+icaKey);
                    if ((icaKey.KeyChar == 219 || icaKey.KeyChar == 221) && event.ctrlKey && event.altKey) return;
                    KeyEventNormal(icaKey, false);
                }

            } else if (evType == keyPress) {
                //console.log("keyEvent.KeyBoardEventHandler.keyPress.keyCode="+key);
                /*
                 * handling capslock in key press only code A-Z (65-90) && a-z (97-122)
                 * other overlapped key ( as numlock key having same keycode ) is handled before
                 * so in this keypress no need for worry
                 *
                 */
                var is_capschange = false;
                if (event.shiftKey) {
                    if ((!capsLockDown) && (key >= 97) && (key <= 122)) {
                        is_capschange = true;
                    } else if (capsLockDown && (key >= 65) && (key <= 90)) {
                        is_capschange = true;
                    }
                } else {

                    /* First time  when the session is started, we send the state of capsLock. If we don't do this previous session capsLock state will used which is wrong.
                      Refer BUG0648652 for more*/
                    if(!capsLockInitial)
                    {
                        capsLockInitial = true;
                        writePacketSetLed(GetLEDFlags());
                    }
                    if (capsLockDown && (key >= 97) && (key <= 122)) {
                        is_capschange = true;
                    } else if ((!capsLockDown) && (key >= 65) && (key <= 90)) {
                        is_capschange = true;
                    }
                }
                if (is_capschange) {
                    capsLockDown = !capsLockDown;
                    writePacketSetLed(GetLEDFlags());
                }
                if (event.ctrlKey && event.altKey) {
                    writePacketKeyboardUnicode(event.keyCode, 4);
                } else {
                    KeyEventPress(KeyMapping.ScanCodeToKey(event.keyCode, evType, event.shiftKey));
                }
            }
    };
}

const updateAltModifier = function(event) {
    if (event == null)
        return;
    if (event.altKey !== modifierStates.altKey) {
        //send alt key event down/up
        if (event.altKey) {
            //send down
            KeyEventNormal(KeyMapping.Converter[ALT_KEYCODE], true);
        } else {
            //send up
            KeyEventNormal(KeyMapping.Converter[ALT_KEYCODE], false);
        }
        modifierStates.altKey = event.altKey;
    }

};

const checkModifiers = function(event) {
    var isControlKey = event.ctrlKey;
    if(isMac){
        // event.metaKey flag indicates if the command key was pressed(true) or not(false)
        // since we map cmd key to ctrl key, isControlKey should consider both flags
        isControlKey = event.ctrlKey || event.metaKey;
    }
    if (event.shiftKey !== modifierStates.shiftKey) {

        //send shift key event down/up
        if (event.shiftKey) {
            //send down
            KeyEventNormal(KeyMapping.Converter[SHIFT_KEYCODE], true);
        } else {
            //send up
            KeyEventNormal(KeyMapping.Converter[SHIFT_KEYCODE], false);
        }
        modifierStates.shiftKey = event.shiftKey;
    }
    if (isControlKey !== modifierStates.ctrlKey && event.keyCode != CTRL_KEYCODE) {
        //send ctrl key event down/up
        if (isControlKey) {
            //send down
            KeyEventNormal(KeyMapping.Converter[CTRL_KEYCODE], true);
        } else {
            //send up
            KeyEventNormal(KeyMapping.Converter[CTRL_KEYCODE], false);
        }
        modifierStates.ctrlKey = isControlKey;
    }
};