odoo.define('wk_odoo_direct_print.final', function (require) {
    "use strict";

    var rpc = require('web.rpc');
    var core = require('web.core');
    var _t = core._t;

    $(document).on('click', '.wk_print_direct', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();

        var attachment_id = $(this).data('id');
        if (!attachment_id) {
            return;
        }

        rpc.query({
            route: '/direct-print/attachment-info',
            params: { id: attachment_id },
        }).then(function (result) {

            if (result && result.success) {
                core.bus.trigger('do_notify', {
                    title: _t('Success'),
                    message: _t('Attachment sent to printer.'),
                });
            } else {
                core.bus.trigger('do_warn', {
                    title: _t('Error'),
                    message: result.msg || _t('Failed to send attachment to printer.'),
                });
            }

        }, function () {
            core.bus.trigger('do_warn', {
                title: _t('Error'),
                message: _t('Server error while printing.'),
            });
        });
    });
});
