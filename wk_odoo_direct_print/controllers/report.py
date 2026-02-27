# -*- coding: utf-8 -*-
#################################################################################
#
#    Copyright (c) 2017-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>)
#    You should have received a copy of the License along with this program.
#    If not, see <https://store.webkul.com/license.html/>
#################################################################################

from odoo import http
from odoo.http import request
import logging
import base64

_logger = logging.getLogger(__name__)
class Report(http.Controller):

    @http.route('/direct-print/print-report', type='json', auth="user", csrf=False, methods=['POST'])
    def report_info(self, action, options):
        def create_print_job(printer_id, method, content, file_extension=None):
            vals = {
                'printer_id': printer_id,
                'method': method,
                'content': content,
                'file_extension': file_extension
            }
            request.env['print.jobs'].create_notify_print_job(**vals)

        ReportSudo = request.env['ir.actions.report'].sudo()
        report_name = action['report_name']
        report = ReportSudo.search([('report_name', '=', report_name)], limit=1)

        wkprinter = request.env['wk.printer']
        printer_ids = wkprinter.search([('state', '=', 'Active'), ('report_ids', 'in', [report.id])])

        if printer_ids:
            active_ids = action['context']['active_ids']
            if report.report_type == 'qweb-text':
                renderd_text = report.render_qweb_text(active_ids, data=action.get('context'))[0]
                if report.printerType == 'ESCPOS':
                    renderd_text = str(renderd_text)
                    if len(active_ids) > 1: # for multi records
                        temp_text = []
                        def extract_receipts(text):
                            receipt_blocks = text.split('</receipt>')
                            receipts = [block + '</receipt>' for block in receipt_blocks if block.strip()]
                            return receipts
                        receipts = extract_receipts(renderd_text[4:-1])
                        for i, receipt in enumerate(receipts, 1):
                            xml_text = receipt.split('\\n')
                            xml_text = "".join(xml_text)
                            temp_text.append(wkprinter.get_esc_command_set({'data':xml_text}))
                        renderd_text = ''.join(temp_text)
                    else:
                        xml_text = renderd_text[4:-1].split('\\n')
                        xml_text = "".join(xml_text)
                        try:
                            renderd_text = wkprinter.get_esc_command_set({'data':xml_text})
                        except:
                            logger.info('Could not render the report for ESCPOS priner.')
                    renderd_text = renderd_text.replace("\x00", "[NULL]")
                for printer in printer_ids:
                    create_print_job(printer, 'print-raw', renderd_text)
            elif report.report_type == 'qweb-pdf':
                pdf = report.render_qweb_pdf(
                    active_ids, data=action.get('context'))[0]
                renderd_text = base64.b64encode(pdf)
                for printer in printer_ids:
                    create_print_job(printer, 'print-file', renderd_text, file_extension='pdf')
            return {
                'success' : True,
            }
        else:
            return {
                'success' : False,
                'msg': 'No Printer found for this action.'
            }



