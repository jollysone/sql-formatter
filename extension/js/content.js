(function () {

    "use strict";

    var
        sqlformatContent,
        pre,
        sqlformatStyleEl,
        port
    ;

    // Open the port "sqlformat" now, ready for when we need it
    //   console.time('established port');
    port = chrome.extension.connect({name: 'sqlformat'});

    // Add listener to receive response from BG when ready
    port.onMessage.addListener(function (msg) {
        // console.log('Port msg received', msg[0], ("" + msg[1]).substring(0, 30));
        switch (msg[0]) {
            case 'NOT SQL' :
                pre.hidden = false;
                document.body.removeChild(sqlformatContent);
                break;

            case 'FORMATTING' :
                // It is SQL, and it's now being formatted in the background worker.

                // Insert CSS
                sqlformatStyleEl = document.createElement('style');
                sqlformatStyleEl.id = 'sqlformatStyleEl';
                sqlformatStyleEl.innerText = 'body{padding:8px;}';
                document.head.appendChild(sqlformatStyleEl);

                sqlformatStyleEl.insertAdjacentHTML(
                    'beforeend',
                    'body{-webkit-user-select:text;overflow-y:scroll!important;margin:0;position:relative}#optionBar{-webkit-user-select:none;display:block;position:absolute;top:9px;right:17px}#buttonFormatted,#buttonPlain,#buttonCopySql{-webkit-border-radius:2px;-webkit-box-shadow:0 1px 3px rgba(0,0,0,0.1);-webkit-user-select:none;background:-webkit-linear-gradient(#fafafa,#f4f4f4 40%,#e5e5e5);border:1px solid #aaa;color:#444;font-size:12px;margin-bottom:0;min-width:4em;padding:3px 0;position:relative;z-index:10;display:inline-block;width:80px;text-shadow:1px 1px rgba(255,255,255,0.3)}#buttonFormatted{margin-left:0;border-top-left-radius:0;border-bottom-left-radius:0;border-left:none}#buttonPlain{margin-right:0;border-top-right-radius:0;border-bottom-right-radius:0;border-right:0}#buttonFormatted:hover,#buttonPlain:hover,#buttonCopySql:hover{-webkit-box-shadow:0 1px 3px rgba(0,0,0,0.2);background:#ebebeb -webkit-linear-gradient(#fefefe,#f8f8f8 40%,#e9e9e9);border-color:#999;color:#222}#buttonFormatted:active,#buttonPlain:active{-webkit-box-shadow:inset 0 1px 3px rgba(0,0,0,0.2);background:#ebebeb -webkit-linear-gradient(#f4f4f4,#efefef 40%,#dcdcdc);color:#333}#buttonFormatted.selected,#buttonPlain.selected{-webkit-box-shadow:inset 0 1px 5px rgba(0,0,0,0.2);background:#ebebeb -webkit-linear-gradient(#e4e4e4,#dfdfdf 40%,#dcdcdc);color:#333}#buttonFormatted:focus,#buttonPlain:focus,#buttonCopySql:focus{outline:0}#jsonpOpener,#jsonpCloser{padding:4px 0 0 8px;color:#000;margin-bottom:-6px}#jsonpCloser{margin-top:0}#formattedJson{padding-left:28px;padding-top:6px}pre{padding:36px 5px 5px 5px}.kvov{display:block;padding-left:20px;margin-left:-20px;position:relative}.collapsed{white-space:nowrap}.collapsed>.blockInner{display:none}.collapsed>.ell:after{content:"…";font-weight:bold}.collapsed>.ell{margin:0 4px;color:#888}.collapsed .kvov{display:inline}.e{width:20px;height:18px;display:block;position:absolute;left:-2px;top:1px;z-index:5;background-image:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAD1JREFUeNpiYGBgOADE%2F3Hgw0DM4IRHgSsDFOzFInmMAQnY49ONzZRjDFiADT7dMLALiE8y4AGW6LoBAgwAuIkf%2F%2FB7O9sAAAAASUVORK5CYII%3D");background-repeat:no-repeat;background-position:center center;display:block;opacity:.15}.collapsed>.e{-webkit-transform:rotate(-90deg);width:18px;height:20px;left:0;top:0}.e:hover{opacity:.35}.e:active{opacity:.5}.collapsed .kvov .e{display:none}.blockInner{display:block;padding-left:24px;border-left:1px dotted #bbb;margin-left:2px}#formattedJson,#jsonpOpener,#jsonpCloser{color:#333;font:13px/18px monospace}#formattedJson{color:#444}.b{font-weight:bold}.s{color:#0b7500;word-wrap:break-word}a:link,a:visited{text-decoration:none;color:inherit}a:hover,a:active{text-decoration:underline;color:#050}.bl,.nl,.n{font-weight:bold;color:#1a01cc}.k{color:#000}#formattingMsg{font:13px "Lucida Grande","Segoe UI","Tahoma";padding:10px 0 0 8px;margin:0;color:#333}#formattingMsg>svg{margin:0 7px;position:relative;top:1px}[hidden]{display:none!important}span{white-space:pre-wrap}@-webkit-keyframes spin{from{-webkit-transform:rotate(0deg)}to{-webkit-transform:rotate(360deg)}}#spinner{-webkit-animation:spin 2s 0 infinite}*{-webkit-font-smoothing:antialiased}'
                );

                // Show 'Formatting...' spinner
                sqlformatContent.innerHTML =
                    '<p id="formattingMsg">' +
                    '<svg id="spinner" width="16" height="16" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" version="1.1">' +
                    '<path d="M 150,0 a 150,150 0 0,1 106.066,256.066 l -35.355,-35.355 a -100,-100 0 0,0 -70.711,-170.711 z" fill="#3d7fe6"></path>' +
                    '</svg>' +
                    'Formatting...' +
                    '</p>';

                // Create option bar
                createOptionBar();
                break;

            case 'FORMATTED' :
                // Insert HTML content
                sqlformatContent.innerHTML = msg[1];
                copySqlBtnListener();
                break;

            default :
                throw new Error('Message not understood: ' + msg[0]);
        }
    });

    // console.timeEnd('established port');

    function ready() {
        // First, check if it's a PRE and exit if not
        pre = document.body.childNodes[0];

        setInterval(function () {
            try {
                var formatted = document.getElementById('buttonFormatted');
                if (formatted !== null && formatted.className === 'selected'){
                    pre.hidden = true;
                }
            }catch (e) {}
        })

        if (pre.tagName !== 'PRE' || pre.className !== 'xdebug-var-dump') {
            pre.hidden = false;
            port.disconnect();
        }else{
            // This is a 'plain text' page (just a body with one PRE child).

            // Hide the PRE immediately (until we know what to do, to prevent FOUC)
            pre.hidden = true;

            // Send the contents of the PRE to the BG script
            // Add sqlformatContent DIV, ready to display stuff
            sqlformatContent = document.createElement('div');
            sqlformatContent.id = 'sqlformatContent';
            document.body.appendChild(sqlformatContent);

            // Post the contents of the PRE
            port.postMessage({
                type: "SEND PLAIN SQL",
                pos: getPos(),
                sql: getSql(),
            });

            // Now, this script will just wait to receive anything back via another port message.
            // The returned message will be something like "NOT SQL" or "IS SQL"
        }

    }

    document.addEventListener("DOMContentLoaded", ready, false);

    function getPos() {
        var pos = document.getElementsByTagName('pre').item(0).firstElementChild.innerHTML;

        var domain = document.domain;
        var new_pos = pos;

        if (pos.indexOf(domain) !== -1){
            new_pos = pos.split(domain)[1]
        }

        return new_pos;
    }

    function getSql() {
        var sql = document.getElementsByTagName('font').item(0).innerText;

        if (sql.match(/select (.*)\.\.\./ig)) {
            return '<b>xdebug.var_display_max_data</b>：在`php.ini`中该配置项可以设置var_dump输出的字符串的长度，如果要全部输出可以设置其值为-1。';
        }else{
            return sql.match(/select (.*) \n/ig)[0];
        }
    }

    // Create option bar
    function createOptionBar() {
        var optionBar = document.createElement('div');
        optionBar.id = 'optionBar';

        // Create toggleFormat button
        var
            buttonPlain = document.createElement('button'),
            buttonFormatted = document.createElement('button')
        ;

        buttonPlain.id = 'buttonPlain';
        buttonPlain.innerText = 'Raw';

        buttonFormatted.id = 'buttonFormatted';
        buttonFormatted.innerText = 'Parsed';
        buttonFormatted.classList.add('selected');

        buttonPlain.style.cssText = 'cursor: hand';
        buttonFormatted.style.cssText = 'cursor: hand';


        var plainOn = false;
        buttonPlain.addEventListener(
            'click',
            function () {
                // When plain button clicked...
                if (!plainOn) {
                    plainOn = true;
                    pre.hidden = false;
                    sqlformatContent.hidden = true;

                    buttonFormatted.classList.remove('selected');
                    buttonPlain.classList.add('selected');
                }
            },
            false
        );

        buttonFormatted.addEventListener(
            'click',
            function () {
                // When formatted button clicked...
                if (plainOn) {
                    plainOn = false;
                    pre.hidden = true;
                    sqlformatContent.hidden = false;

                    buttonFormatted.classList.add('selected');
                    buttonPlain.classList.remove('selected');
                }
            },
            false
        );

        // Put it in optionBar
        optionBar.appendChild(buttonPlain);
        optionBar.appendChild(buttonFormatted);

        // Put option bar in DOM
        document.body.insertBefore(optionBar, pre);

        return optionBar;
    }

    function copySqlBtnListener() {
        var buttonCopySql = document.getElementById('buttonCopySql');

        buttonCopySql.addEventListener(
            'click',
            function () {
                // When buttonCopySql button clicked...
                var oInput = document.createElement('input');
                oInput.value = getSql();
                document.body.appendChild(oInput);
                oInput.select(); // select object
                document.execCommand("Copy"); // exec brower copy
                oInput.className = 'oInput';
                oInput.style.display='none';

                var copy_sql = document.getElementById('copy_sql');
                var old_show = copy_sql.innerText;
                copy_sql.innerText = 'Copied';
                buttonCopySql.style.cssText = 'background:#000; color:#FFF;';

                setTimeout(function () {
                    buttonCopySql.style.cssText = 'cursor: hand';

                    document.getElementById('copy_sql').innerText = old_show;
                }, 500)
            },
            false
        );
    }

})();
