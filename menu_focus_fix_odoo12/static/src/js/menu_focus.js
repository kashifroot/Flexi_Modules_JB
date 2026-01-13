odoo.define('menu_focus_fix_odoo12.menu_focus', function (require) {
    "use strict";

    var WebClient = require('web.WebClient');

    WebClient.include({
        start: function () {
            var self = this;
            return this._super.apply(this, arguments).then(function () {

            console.log("Menu");

                // Remove focus from menu search input
                var $search = $('.mk_search_input input');
                if ($search.length) {
                    $search.blur();
                    $search.attr('tabindex', '-1'); // prevent refocus
                            // Disable focus
                    $search.prop('disabled', true);

                }

                // Focus first app menu item
                var $firstApp = $('.o_app').first();
                if ($firstApp.length) {
                 $firstApp.attr('tabindex', '0');
                    $firstApp.focus();
                }
                             // 🔑 Re-enable after 10 seconds
                    setTimeout(function () {
                        $search.prop('disabled', false);
                        $search.removeAttr('tabindex');
                    }, 10000); // 10 seconds
            });
        },
    });
});
