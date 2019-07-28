(function () {
    "use strict";

    function setTitle(name) {
        return '<span style="background:#000; color:#FFF;border-radius: 5px;font-size: 14px;"><b> ' + name + ' </b></span>&nbsp;';
    }

    function beautifyPos(pos) {
        const pos_arr = pos.split(':');
        const trace_path = pos_arr[0];
        const line_num = pos_arr[1];

        var title = setTitle('Trace Path');
        var result = '<span style="background:#eeeeee; color:#1b5f28;font-size: 14px;font-weight:bold;border-radius: 5px;"><b>' + trace_path + '</b></span>' +
            '<span style="color: red;font-size: 30px;"><b style="text-shadow: 4px 4px 2px #ceb3b3;">&nbsp;' + line_num + '</b></span>';

        return title + result;
    }


    function beautifySql(sql) {
        var select = sql.replace(/select /ig, "<b>SELECT</b>\n&nbsp;&nbsp;&nbsp;&nbsp;");
        var douhao = select.replace(/,/ig, ", ");
        var as = douhao.replace(/ as /ig," <b>AS</b> ");
        var from = as.replace(/ from /ig,"\n<b>FROM</b>\n&nbsp;&nbsp;&nbsp;&nbsp;");
        var  left_join  = from.replace(/ left join /ig,"\n<b>LEFT JOIN</b>\n&nbsp;&nbsp;&nbsp;&nbsp;");
        var  on  = left_join.replace(/ ON /ig,"\n<b>ON</b>\n&nbsp;&nbsp;&nbsp;&nbsp;");
        var  where  = on.replace(/ where /ig,"\n<b>WHERE</b>\n&nbsp;&nbsp;&nbsp;&nbsp;");
        var  and  = where.replace(/ and /ig,"\n<b>AND</b>\n&nbsp;&nbsp;&nbsp;&nbsp;");
        var  IN  = and.replace(/ in /ig," <b>IN</b> ");
        var  or  = IN.replace(/ or /ig," <b>OR</b> ");
        var  group  = or.replace(/ group by /ig,"\n<b>GROUP BY</b>\n&nbsp;&nbsp;&nbsp;&nbsp;");
        var  order  = group.replace(/ order by /ig,"\n<b>ORDER BY</b>\n&nbsp;&nbsp;&nbsp;&nbsp;");
        var  desc  = order.replace(/ desc /ig," <b>DESC</b> ");
        var  asc  = desc.replace(/ asc /ig," <b>ASC</b> ");
        var  limit  = asc.replace(/ limit /ig,"\n<b>LIMIT</b>\n&nbsp;&nbsp;&nbsp;&nbsp;");

        return limit;
    }

    function beautifySqlDebugShow(pos, sql){
        var pos_html = '<span style="">' + beautifyPos(pos) + '</span>' + '<br>';
        var sql_html = '<button id="buttonCopySql" style="cursor: hand"><b id="copy_sql">CopySql</b></button><pre style="font-size: 14px;padding: 5px;">' + beautifySql(sql) + '</pre>' + '<br>';

        return pos_html + '<hr>' + sql_html + '<hr>';
    }


    // Listen for requests from content pages wanting to set up a port
    chrome.extension.onConnect.addListener(function (port) {
        if (port.name !== 'sqlformat') {
            console.log('Sql Formatter error - unknown port name ' + port.name, port);
            return;
        }

        port.onMessage.addListener(function (msg) {
            if (msg.type === 'SEND PLAIN SQL') {
                // Try to parse as Sql
                var pos = msg.pos;
                var sql = msg.sql;

                // And send it the message to confirm that we're now formatting (so it can show a spinner)
                port.postMessage(['FORMATTING', '', '']);

                // Do formatting
                var html = beautifySqlDebugShow(pos, sql);

                // Post the HTML string to the content script
                port.postMessage(['FORMATTED', html]);

                // Disconnect
                port.disconnect();
            }
        });
    });


}());
