odoo.define('wk_odoo_direct_print.ReportActionManager', function (require) {
    "use strict";

    // Copyright(c) 2015 - Present Webkul Software Pvt.Ltd. (<https://webkul.com/>)
    // See LICENSE file for full copyright and licensing details.
    // "License URL : <https://store.webkul.com/license.html/>"

    var ActionManager = require('web.ActionManager');
    var core = require('web.core');
    var _t = core._t;

    var link = '<br><br><a href="http://wkhtmltopdf.org/" target="_blank">wkhtmltopdf.org</a>';
    var WKHTMLTOPDF_MESSAGES = {
        broken: _t('Your installation of Wkhtmltopdf seems to be broken. The report will be shown in html.') + link,
        install: _t('Unable to find Wkhtmltopdf on this system. The report will be shown in html.') + link,
        upgrade: _t('You should upgrade your version of Wkhtmltopdf to at least 0.12.0 in order to get a correct display of headers and footers as well as support for table-breaking between pages.') + link,
        workers: _t('You need to start Odoo with at least two workers to print a pdf version of the reports.'),
    };
    
    ActionManager.include({
        _handleReportFallback: function (action, options) {
            var self = this;

            if (action.report_type === 'qweb-html') {
                return self._executeReportClientAction(action, options);

            } else if (action.report_type === 'qweb-pdf') {
                return self.call('report', 'checkWkhtmltopdf').then(function (state) {
                    if (state in WKHTMLTOPDF_MESSAGES) {
                        self.do_notify(_t('Report'), WKHTMLTOPDF_MESSAGES[state], true);
                    }
                    if (state === 'upgrade' || state === 'ok') {
                        return self._triggerDownload(action, options, 'pdf');
                    } else {
                        return self._executeReportClientAction(action, options);
                    }
                });

            } else if (action.report_type === 'qweb-text') {
                return self._triggerDownload(action, options, 'text');

            } else {
                console.error(`The ActionManager can't handle reports of type ${action.report_type}`, action);
                return Promise.reject();
            }
        },

        _executeReportAction: function (action, options) {
            var self = this;
            // Check direct print first
            return this._rpc({
                route: '/direct-print/print-report',
                params: { action: action, options: options },
            }).then(function (report_info) {
                console.log('report_info:', report_info);

                if (report_info.success) {
                    console.log('Reports are directly sent to the printer.');
                    self.do_notify(_t('Success'), _t('Reports are directly sent to the printer.'), false);
                    return Promise.resolve();
                } else {
                    console.log('This report is not assigned to any printer');
                    return self._handleReportFallback(action, options);
                }
            }).fail(function (error) {
                console.error('Error in direct print:', error);
                self.do_notify(_t('Error'), _t('Failed to send report to printer.'), false);
                return self._handleReportFallback(action, options);
            });
        },
    });
});